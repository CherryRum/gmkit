---
title: 公共能力与输入约定
description: 统一说明双语言 API 的文本、字节、Hex、Base64、随机源、Provider 和错误约定。
pageInfo: false
icon: toolbox
order: 2
category: [API 说明书]
tag: [编码, RNG, Provider, ASN.1, 异常]
---

# 公共能力与输入约定

本页解释两个语言说明书共同依赖的编码、文本、随机源、安全上下文、敏感值比较、ASN.1 和异常行为。算法特有参数仍以 [TypeScript API 说明书](/api/typescript/) 和 [Java API 说明书](/api/java/) 中的对应算法页为准。

## 使用前先固定的协议字段

跨进程、跨语言或持久化数据不能只传“密文字符串”。至少应明确记录算法、mode、padding、输入输出编码、IV/nonce、AAD、tag、SM2 密文排列、签名格式和协议版本。自动识别只用于兼容既有输入，不能替代稳定 schema。

| 字段 | 推荐做法 | 不推荐做法 |
|:--|:--|:--|
| 文本编码 | 明确 UTF-8，二进制直接传字节 | 依赖系统默认 Charset |
| 二进制编码 | schema 中固定 Hex 或 Base64 | 每次通过内容猜测 |
| AEAD | 同时传 nonce、AAD、ciphertext、tag | 只保存 ciphertext |
| SM2 | 固定 C1C3C2/C1C2C3 与 raw/DER | 由接收端长期试错 |
| 版本 | 在载荷或外层协议记录版本 | 假定所有服务同时升级 |

## 文本与字节

- TypeScript 的字符串算法输入通过当前 `TextCodec` 转成 UTF-8；默认优先宿主 `TextEncoder`/`TextDecoder`，受限平台可注入实现。
- Java 无 Charset 重载时使用 UTF-8；需要其他编码时选择显式 Charset 重载。
- 二进制解密结果使用 `sm2DecryptBytes`、`sm4DecryptBytes`、`zucDecryptBytes` 或 Java `byte[]` 入口。文本 API 不能无损表示任意字节。

### TypeScript 编码 API

| API | 输入与返回 | 失败条件 / 注意 |
|:--|:--|:--|
| `hexToBytes(hex)` | 偶数长度 Hex -> `Uint8Array` | 拒绝奇数长度和非 Hex 字符 |
| `bytesToHex(bytes)` | 字节 -> 小写 Hex | 参数必须是字节数组 |
| `base64ToBytes(base64)` | RFC 4648 Base64 -> 字节 | 拒绝非法字符、长度和非规范填充 |
| `bytesToBase64(bytes)` | 字节 -> 标准 Base64 | 输出带所需 `=` 填充 |
| `stringToBytes(str)` | UTF-8 文本 -> 字节 | 使用当前 `TextCodec` |
| `bytesToString(bytes)` | UTF-8 字节 -> 文本 | 任意二进制不要调用 |
| `normalizeInput(value)` | 字符串按 UTF-8，字节原样返回 | 它不会把字符串猜成 Hex |
| `decodeInput(value, format)` | 字节直通；字符串按 Hex/Base64 解码 | 默认 format 为 Hex |
| `encodeOutput(bytes, format)` | 按 Hex/Base64 编码 | 默认 Hex |
| `autoDecodeString(str)` | 优先 Hex，再尝试 Base64 | 协议边界建议显式传格式，避免纯 Hex 字符串歧义 |
| `isHexString`, `isBase64String` | 格式判断 | 只判断编码形态，不证明业务字段有效 |

```ts
import { InputFormat, OutputFormat, decodeInput, encodeOutput } from 'gmkitx';

const bytes = decodeInput('AP+AQQ==', InputFormat.BASE64);
if (encodeOutput(bytes, OutputFormat.HEX) !== '00ff8041') {
  throw new Error('encoding mismatch');
}
```

### Java 编码 API

| 类型 | 主要方法 | 语义 |
|:--|:--|:--|
| `HexCodec` | `decodeStrict`, `encode`, `isHex`, `normalize` | 严格 Hex；normalize 移除允许的前缀并统一小写 |
| `Base64Codec` | `decode`, `encode`, `isBase64`, `looksLikeBase64` | 标准 Base64 编解码与形态检查 |
| `ByteEncodings` | `encode`, `decode`, `decodeAuto` | 使用 `InputFormat`/`OutputFormat` 统一转换 |
| `Texts` | `utf8`, `bytes`, `text` | UTF-8 或显式 Charset 转换 |
| `Bytes` | `clone`, `require*`, `concat`, `copyOfRange` | 防御性复制与字节容器操作 |

`decodeAuto` 同样存在 Hex/Base64 形态重叠问题。网络协议应传编码字段，不应长期依赖自动识别。

## TypeScript 随机源

随机源优先级为：

1. `setCustomRNG()` 注入的宿主函数。
2. `globalThis.crypto.getRandomValues`，大请求按 65536 字节分块。
3. CommonJS 环境可加载的 `node:crypto.randomBytes`。
4. 兼容降级随机源。

| API | 作用 |
|:--|:--|
| `configureRNG(policy)` | 设置 `strict` / `warn` / `allow`；默认 `warn` |
| `setRNGPolicy(policy)` | `configureRNG` 的兼容别名 |
| `setCustomRNG(fn)` | 注入 CSPRNG；返回值必须是精确长度的 `Uint8Array` |
| `clearCustomRNG()` | 清除注入源，主要用于测试 teardown |
| `hasCustomRNG()` | 判断是否已注入 |
| `getRandomBytes(length=32)` | 生成正整数长度随机字节 |
| `getEnvReport()` | 报告 BigInt、文本编解码与系统随机源能力 |

`warn` 在缺少 CSPRNG 时警告一次并兼容运行，`allow` 静默兼容，二者的降级输出都不具备密码学安全性。安全环境应使用 `strict`；小程序等受限环境应注入平台 CSPRNG，而不是关闭警告。

```ts
import { configureRNG, getEnvReport, setCustomRNG } from 'gmkitx';

configureRNG('strict');
const report = getEnvReport();
// 平台有专用安全随机 API 时：setCustomRNG((length) => platformRandom(length));
if (!report.hasWebCrypto && !report.hasNodeCrypto) {
  console.warn('需要通过 setCustomRNG 注入平台 CSPRNG');
}
```

不要把测试用确定性 RNG 留在正式进程。启动检查可结合 `hasCustomRNG()` 和应用自己的运行环境标识。

## Java 安全上下文

`GmSecurityContext` 把 Provider、`SecureRandom` 与是否注册 Provider 的策略放在一个不可变对象中。`GmSecurityContexts` 提供常用构造：

| API | 用途 |
|:--|:--|
| `defaults()` | 使用库默认 Provider 与 SecureRandom 策略 |
| `withProvider(provider)` | 使用指定 Provider |
| `withSecureRandom(random)` | 注入指定 `SecureRandom` |
| `withProviderAndRandom(provider, random)` | 同时固定两者 |
| `GmSecurityContext.builder()` | 需要控制 `registerProvider` 时使用 |

```java
import cn.gmkit.core.GmSecurityContext;
import cn.gmkit.core.GmSecurityContexts;
import cn.gmkit.sm2.SM2;
import java.security.SecureRandom;

GmSecurityContext context = GmSecurityContexts.withSecureRandom(new SecureRandom());
SM2 sm2 = new SM2(context);
if (sm2.securityContext() != context) {
    throw new IllegalStateException("security context mismatch");
}
```

`BcProviders.ensureRegistered()` 会修改 JVM 全局 Provider 列表。容器或已有安全策略的应用应优先传 Provider 实例，并由应用统一决定是否全局注册。

## 文本编解码与环境

`setTextCodec({ encode, decode })` 用于缺少标准 `TextEncoder`/`TextDecoder` 的运行时。注入实现必须遵循 UTF-8，并正确处理代理对、非法序列和非 BMP 字符；不要用逐字符 `charCodeAt` 截断成单字节。

`EnvReport` 字段为 `hasBigInt`、`hasTextEncoder`、`hasTextDecoder`、`hasWebCrypto`、`hasNodeCrypto`。报告只反映调用时能力，不执行随机数质量检测。

## 敏感值比较

TypeScript `constantTimeEqual` 和 Java `Bytes.constantTimeEquals` 的共同语义：任一输入为空引用返回 false，长度不同返回 false，长度相同扫描全部字节。它们适合 MAC、tag 和摘要字节比较。

JavaScript 的 JIT 和宿主运行时不提供严格恒时保证，TS 实现只避免代码层显式按内容提前退出。不要先把敏感字节转字符串再用 `===` 代替字节比较。

## ASN.1 与 SM2 签名格式

| TypeScript API | 作用 |
|:--|:--|
| `encodeSignature(r, s)` | 将两个正整数编码为 canonical DER SEQUENCE |
| `decodeSignature(signature)` | 解析 DER 签名并返回 r/s |
| `rawToDer(rawSignature)` | 64 字节 `r \|\| s` -> DER |
| `derToRaw(derSignature)` | DER -> 128 字符 raw Hex |
| `asn1ToXml(data, indent?)` | 受限 DER 结构调试输出 |
| `signatureToXml(signature, options?)` | 按 raw/DER 输入生成签名调试 XML |

解析器拒绝 BER 无限长度、非最短长度/整数、截断、尾随数据和超过限制的嵌套。`asn1ToXml` 不识别证书语义，也不负责 X.509、PKCS#8、PKCS#12 或 CSR 验证。

Java 使用 `SM2Signatures` 在 raw/DER 间转换，使用 `SM2Ciphertexts` 处理 SM2 密文结构。跨端签名协议必须显式记录格式，不能只凭首字节长期猜测。

## 基础字节运算

| TypeScript API | 语义 |
|:--|:--|
| `xor(a, b)` | 等长字节数组逐字节异或；长度不一致会失败 |
| `rotl(value, shift)` | 32-bit 循环左移 |
| `bytes4ToUint32BE(bytes, offset=0)` | 大端四字节读取为无符号 32-bit number |
| `uint32ToBytes4BE(value)` | 32-bit number 写为大端四字节 |

这些是协议实现工具，不负责密钥派生或 nonce 管理。不要用 `xor` 和重复 key 自行设计加密方案。

## Java 混合加密

`SM2Sm4Hybrid` 是 Java 便利入口：生成随机 SM4 key，使用 SM4 处理载荷，再用 SM2 加密会话 key。`SM2Sm4HybridPayload` 分字段保存 encryptedKey、ciphertext、IV、AAD、tag、mode 与 padding，并提供 Hex/Base64 getter。

该对象没有定义稳定的跨语言序列化 schema。发送到其他系统前必须固定字段编码、版本、SM2 密文排列、SM4 mode/tag 和 key id；TypeScript 对端可使用 SM2/SM4 API 逐字段处理。

## 异常与失败语义

| 场景 | TypeScript | Java |
|:--|:--|:--|
| 非法参数/编码 | 抛 `Error` | 主包抛 `GmkitException`，部分校验抛标准参数异常 |
| 验签不通过 | 通常返回 `false` | 返回 `false` |
| AEAD tag 不通过 | 抛错，不返回明文 | 抛 `GmkitException`，不返回明文 |
| SM9 native/PEM/句柄失败 | 不适用 | `SM9Exception` |
| SM9 平台不支持 | 不适用 | `SM9UnsupportedPlatformException` |

调用方应区分“输入不可信导致验证为 false”和“运行环境/格式/资源错误导致异常”。不要把异常吞掉后返回空字符串、空数组或成功状态。
