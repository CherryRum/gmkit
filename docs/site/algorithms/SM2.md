---
title: SM2 椭圆曲线公钥密码算法
icon: key
order: 1
category: [算法]
tag: [SM2, 加密, 签名, 密钥交换]
---

# SM2 椭圆曲线公钥密码算法

GMKit 的 Java 与 TypeScript 包都提供 SM2 密钥生成、公钥派生与压缩、加解密、签名验签和密钥交换。实现固定使用标准 SM2 曲线；本文记录当前 API 行为和测试边界，不构成产品认证声明。

## 支持与入口

| 能力 | TypeScript | Java |
|:--|:--|:--|
| 密钥生成、私钥派生公钥 | `sm2GenerateKeyPair`、`sm2GetPublicKeyFromPrivateKey` | `SM2.generateKeyPair`、`getPublicKeyFromPrivateKey` |
| 公钥压缩、解压 | `sm2CompressPublicKey`、`sm2DecompressPublicKey` | `SM2.compressPublicKey`、`decompressPublicKey` |
| 加密、解密 | `sm2Encrypt`、`sm2Decrypt`、`sm2DecryptBytes` | `SM2.encrypt*`、`decrypt*` |
| 签名、验签 | `sm2Sign`、`sm2Verify` | `SM2.sign*`、`verify*` |
| Z/e 与预摘要入口 | 没有顶层独立入口 | `computeZ`、`computeE`、`signDigest`、`verifyDigest` |
| 密钥交换 | `sm2KeyExchange` | `keyExchange`、`keyExchangeWithConfirmation`、`confirmResponder` |
| 对象式/静态式 | `SM2` 类与 `sm2` 命名空间 | `SM2` 实例与 `SM2Util` 静态入口 |

具体重载见 [TypeDoc](/api/typescript/latest/) 和 [Javadoc](/api/java/latest/cn/gmkit/sm2/package-summary.html)。新 TypeScript 代码优先使用带 `sm2` 前缀的具名函数；无前缀旧名仅为兼容保留。

## 密钥与编码

| 数据 | 约定 |
|:--|:--|
| 私钥 | 1 到曲线阶减 1 的标量；API 表示为 32 字节或 64 个 hex 字符 |
| 非压缩公钥 | `04 || x || y`，65 字节 / 130 个 hex 字符 |
| 压缩公钥 | `02/03 || x`，33 字节 / 66 个 hex 字符 |
| 默认密文排列 | `C1C3C2`；兼容 `C1C2C3` |
| 默认签名 | raw `r || s`，64 字节；可选 canonical DER |
| 默认用户标识 | `1234567812345678`；当前版本中省略或传 `''` 都回落到该值 |

`SM2CurveParams` 是历史类型兼容入口，当前实现只接受与标准曲线完全相同的参数；传入自定义曲线会抛错。公钥压缩只改变点编码，不改变密钥。

下面使用私钥标量 1 验证公钥派生。期望值是标准 SM2 曲线基点的非压缩编码。

<details open class="language-entry">
<summary><strong>TypeScript</strong></summary>

```ts
import {
  sm2CompressPublicKey,
  sm2DecompressPublicKey,
  sm2GetPublicKeyFromPrivateKey,
} from 'gmkitx';

const privateKey = '0'.repeat(63) + '1';
const expectedPublicKey =
  '0432c4ae2c1f1981195f9904466a39c9948fe30bbff2660be1715a4589334c74c7' +
  'bc3736a2f4f6779c59bdcee36b692153d0a9877cc62a474002df32e52139f0a0';
const publicKey = sm2GetPublicKeyFromPrivateKey(privateKey);
const compressed = sm2CompressPublicKey(publicKey);

if (publicKey !== expectedPublicKey) throw new Error('SM2 public key vector mismatch');
if (sm2DecompressPublicKey(compressed) !== publicKey) {
  throw new Error('SM2 public key compression mismatch');
}
```

</details>

<details class="language-entry">
<summary><strong>Java</strong></summary>

```java
import cn.gmkit.sm2.SM2Util;

String privateKey = String.format("%064x", 1);
String expectedPublicKey =
    "0432c4ae2c1f1981195f9904466a39c9948fe30bbff2660be1715a4589334c74c7" +
    "bc3736a2f4f6779c59bdcee36b692153d0a9877cc62a474002df32e52139f0a0";
String publicKey = SM2Util.getPublicKeyFromPrivateKey(privateKey, false);
String compressed = SM2Util.compressPublicKey(publicKey);

if (!expectedPublicKey.equals(publicKey)) {
    throw new IllegalStateException("SM2 public key vector mismatch");
}
if (!publicKey.equals(SM2Util.decompressPublicKey(compressed))) {
    throw new IllegalStateException("SM2 public key compression mismatch");
}
```

</details>

## 加密与解密

SM2 加密含随机临时标量，因此相同输入产生不同密文。验证时检查能否解密、错误私钥是否失败、C3 篡改是否被拒绝，不比较两次密文是否相同。

| 项目 | TypeScript 默认值 | Java 默认值 |
|:--|:--|:--|
| 密文排列 | `C1C3C2`；解密未指定时先试 C1C3C2，再试 C1C2C3 | `C1C3C2` |
| 输出 | hex 字符串 | `byte[]`；`encryptHex`/`encryptBase64` 显式编码 |
| 文本 | UTF-8 | 无 Charset 重载时 UTF-8 |
| 二进制解密 | `sm2DecryptBytes` | `decrypt` 返回 `byte[]` |
| DER 密文 | 可识别 canonical DER 输入 | `SM2Ciphertexts` 提供格式转换与解析能力 |

空明文会被拒绝。原始密文至少包含 C1 点、32 字节 C3 和非空 C2；C3 不匹配、点编码无效、DER 非最短编码或尾随数据均应视为失败。

<details open class="language-entry">
<summary><strong>TypeScript 二进制 round-trip</strong></summary>

```ts
import {
  InputFormat,
  OutputFormat,
  SM2CipherMode,
  sm2DecryptBytes,
  sm2Encrypt,
  sm2GenerateKeyPair,
} from 'gmkitx';

const keys = sm2GenerateKeyPair();
const input = Uint8Array.of(0x00, 0xff, 0x80, 0x41);
const cipher = sm2Encrypt(keys.publicKey, input, {
  mode: SM2CipherMode.C1C3C2,
  outputFormat: OutputFormat.BASE64,
});
const output = sm2DecryptBytes(keys.privateKey, cipher, {
  mode: SM2CipherMode.C1C3C2,
  inputFormat: InputFormat.BASE64,
});
if (output.length !== input.length || output.some((value, i) => value !== input[i])) {
  throw new Error('SM2 binary round-trip failed');
}
```

</details>

<details class="language-entry">
<summary><strong>Java 二进制 round-trip</strong></summary>

```java
import cn.gmkit.core.SM2CipherMode;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import java.util.Arrays;

SM2 sm2 = new SM2();
SM2KeyPair keys = sm2.generateKeyPair(false);
byte[] input = new byte[] {0x00, (byte) 0xff, (byte) 0x80, 0x41};
byte[] cipher = sm2.encrypt(keys.publicKey(), input, SM2CipherMode.C1C3C2);
byte[] output = sm2.decrypt(keys.privateKey(), cipher, SM2CipherMode.C1C3C2);
if (!Arrays.equals(input, output)) throw new IllegalStateException("SM2 round-trip failed");
```

</details>

## 签名与验签

标准流程计算 `Z = SM3(ENTL || ID || a || b || xG || yG || xA || yA)`，再计算 `e = SM3(Z || M)`。签名端与验签端必须使用相同 `userId`、消息字节和签名编码。

| 选项 | TypeScript | Java |
|:--|:--|:--|
| 签名格式默认值 | `raw` | `RAW` |
| 验签格式默认值 | `raw` | `AUTO` |
| 输出/输入编码 | 默认 hex，可选 Base64 | `byte[]` 或 `signHex`/`signBase64`；字符串验签自动解码 |
| 跳过 Z | `skipZComputation` | `skipZComputation`、`signWithoutZ` |

跳过 Z 仅用于已经明确采用该非默认语义的旧协议。新协议不要为了少一次摘要而启用。

<details open class="language-entry">
<summary><strong>TypeScript DER + Base64</strong></summary>

```ts
import { InputFormat, OutputFormat, sm2GenerateKeyPair, sm2Sign, sm2Verify } from 'gmkitx';

const keys = sm2GenerateKeyPair();
const message = 'GMKit SM2 signature check';
const userId = 'gmkit-release-v1';
const signature = sm2Sign(keys.privateKey, message, {
  userId,
  signatureFormat: 'der',
  outputFormat: OutputFormat.BASE64,
});
const options = { userId, signatureFormat: 'der' as const, inputFormat: InputFormat.BASE64 };
if (!sm2Verify(keys.publicKey, message, signature, options)) throw new Error('verify failed');
if (sm2Verify(keys.publicKey, `${message}!`, signature, options)) {
  throw new Error('modified message was accepted');
}
```

</details>

<details class="language-entry">
<summary><strong>Java DER + Base64</strong></summary>

```java
import cn.gmkit.core.SM2SignatureFormat;
import cn.gmkit.core.SM2SignatureInputFormat;
import cn.gmkit.sm2.*;

SM2 sm2 = new SM2();
SM2KeyPair keys = sm2.generateKeyPair();
String message = "GMKit SM2 signature check";
String userId = "gmkit-release-v1";
SM2SignOptions signOptions = SM2SignOptions.builder()
    .userId(userId).signatureFormat(SM2SignatureFormat.DER).build();
SM2VerifyOptions verifyOptions = SM2VerifyOptions.builder()
    .userId(userId).signatureFormat(SM2SignatureInputFormat.DER).build();
String signature = sm2.signBase64(keys.privateKey(), message, signOptions);

if (!sm2.verify(keys.publicKey(), message, signature, verifyOptions)) {
    throw new IllegalStateException("verify failed");
}
if (sm2.verify(keys.publicKey(), message + "!", signature, verifyOptions)) {
    throw new IllegalStateException("modified message was accepted");
}
```

</details>

## 密钥交换

SM2 密钥交换不是普通 ECDH。双方都需要静态密钥、临时密钥、身份和角色，并应校验确认标签。

| 协议字段 | TypeScript | Java |
|:--|:--|:--|
| 派生长度 | `keyLength`，单位 byte，默认 16 | `keyBits`，单位 bit，默认 128 |
| 角色 | `isInitiator` | `initiator` |
| 身份 | `userId`、`peerUserId` | `selfId`、`peerId` |
| 临时密钥 | 可传临时私钥，返回临时公钥 | 方法参数显式传静态/临时材料 |
| 确认 | 返回 `s1`、`s2` | `keyExchangeWithConfirmation` 返回 `s1`、`s2`，响应方可接收确认标签 |

跨语言协议若要派生 32 字节，TS 应使用 `keyLength: 32`，Java 应使用 `keyBits(256)`。双方必须固定角色、身份 UTF-8 字节、密钥点编码和确认标签传输顺序。

## 错误与安全边界

- 私钥必须落在合法标量范围；公钥必须是曲线上的有效点。
- 解密失败不得转换成空明文继续处理；验签返回 `false` 不等同于系统异常。
- 密钥生成、加密和签名依赖 CSPRNG。TS 默认 `warn` 仅为受限环境兼容；安全环境启用 `configureRNG('strict')` 或注入平台 CSPRNG。Java 可通过 `GmSecurityContext` 注入 `SecureRandom`。
- SM2 不适合直接承载大文件；业务载荷通常用认证加密算法处理，再用 SM2 保护随机会话密钥。
- Java `SM2Signatures`、`SM2Ciphertexts` 等公共类型用于格式转换和底层协议对接；常规调用优先 `SM2`/`SM2Util`。

## 验证依据

- [GM/T 0009 实现边界](/standards/GMT-0009-COMPLIANCE)
- [GM/T 0009 快速参考](/standards/GMT-0009-快速参考)
- [共享互操作向量](/standards/interop-vectors)
- `npm test -w packages/ts -- sm2`
- `mvn -f packages/java/pom.xml -B -ntp -pl gmkit -Dtest=SM2*Test test`
