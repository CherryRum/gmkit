---
title: GMKit 旧系统迁移
description: 将 GMKit 0.10.1 的弃用别名、自动识别和非标准兼容入口迁移到明确 API。
pageInfo: false
contributors: false
editLink: false
icon: route
category: [使用手册, 迁移]
tag: [弃用, 兼容, 升级]
---

# GMKit 旧系统迁移

本页是旧入口的唯一使用者索引。新代码从 [TypeScript 手册](/manual/typescript/) 或 [Java 手册](/manual/java/) 开始，不从本页选择 API。

迁移原则是“先锁定现有字节行为，再改入口名称和协议字段”。不要同时更换算法、编码、key 和数据格式，否则无法判断差异来源。

## TypeScript 无前缀别名

下列别名在 0.10.1 仍可运行，但已弃用：

<ApiTable label="TypeScript 无前缀别名迁移" min-width="66rem">

| 旧名称 | 替代名称 | 行为差异 |
|:--|:--|:--|
| `generateKeyPair` | `sm2GenerateKeyPair` | 无；只消除算法归属歧义 |
| `getPublicKeyFromPrivateKey` | `sm2GetPublicKeyFromPrivateKey` | 无 |
| `compressPublicKey` | `sm2CompressPublicKey` | 无 |
| `decompressPublicKey` | `sm2DecompressPublicKey` | 无 |
| `sign` | `sm2Sign` | 无；迁移后再显式补 userId/DER/编码 |
| `verify` | `sm2Verify` | 无；迁移后再移除自动格式识别 |
| `keyExchange` | `sm2KeyExchange` | 无 |
| `digest` | `sm3Digest` | 无 |
| `hmac` | `sm3Hmac` | 无 |

</ApiTable>

第一步只换名称并保持参数、固定向量和测试不变。第二步再显式写入格式字段。

## TypeScript 导入与运行配置

<ApiTable label="TypeScript 导入迁移" min-width="70rem">

| 旧写法/入口 | 替代 | 原因 |
|:--|:--|:--|
| 默认聚合导出 | 从 `gmkitx` 具名导入 | 依赖清晰，便于静态分析；默认导出为兼容保留 |
| `setRNGPolicy(policy)` | `configureRNG(policy)` | 行为相同，新名称说明是全局随机策略 |
| `autoDecodeString(value)` | `decodeInput(value, InputFormat.HEX/BASE64)` | 协议不再根据内容猜测 |
| 省略 `inputFormat` | 显式传 `InputFormat` | 只由 Hex 字符组成的 Base64 存在歧义 |

</ApiTable>

浏览器 IIFE 仍通过全局 `GMKit` 访问具名成员；这与 ESM 的默认聚合导出不是同一迁移问题。

## 密文和签名自动识别

旧系统可能只存一个字符串，没有 `encoding`、签名结构或 SM2 密文排列。迁移按以下顺序：

1. 从当前生产数据抽取不含密钥和隐私的格式样本。
2. 用 0.10.1 固定版本写回归测试，记录实际是 Hex/Base64、RAW/DER、C1C3C2/C1C2C3。
3. 新增 `schema`、`encoding`、`signatureFormat` 或 `cipherMode` 字段。
4. 过渡期“旧记录双读，新记录单写”：旧 schema 可按已锁定顺序读取，新 schema 只按显式字段读取。
5. 统计旧 schema 清零后删除自动识别分支。

禁止对新 schema 失败后继续尝试另一种编码或排列。否则损坏数据可能被错误解释为另一种合法输入。

## SM2 no-Z

标准 SM2 签名计算：

```text
Z = SM3(ENTL || userId || curve || publicKey)
e = SM3(Z || M)
```

旧 no-Z 路径计算：

```text
e = SM3(M)
```

它们是不同协议。no-Z 不是“跳过可选步骤”，也不是性能开关；标准 Bouncy Castle `SM2Signer` 没有对应公开选项。

<ApiTable label="no-Z 兼容入口" min-width="72rem">

| 语言 | 旧入口 | 新协议替代 |
|:--|:--|:--|
| TypeScript | `SignOptions.skipZComputation`、`VerifyOptions.skipZComputation` | 省略该字段，使用非空 `userId` 的标准 `sm2Sign/sm2Verify` |
| Java | Builder 的 `skipZComputation(true)` | 不设置该字段 |
| Java | `signWithoutZ`、`verifyWithoutZ` | `SM2.sign/verify` + 标准选项 |
| Java | `computeEWithoutZ`、`computeE(..., true)` | 标准签名让库计算 Z；预计算 e 的协议使用独立 `signDigest/verifyDigest` |

</ApiTable>

预计算 e 与 no-Z 不等价。`signDigest/verifyDigest` 表示调用方已经按外部协议得到完整 e；库不会替调用方补 Z 或再做摘要。

迁移 no-Z 时不能直接把开关改为 `false` 后继续接受历史签名。应使用 schema 区分：

- 历史记录按明确的 legacy-no-z 规则只读验证；
- 新记录只产生标准 SM2 签名；
- 两类记录使用不同协议标识和测试向量；
- 旧记录过期或重签后删除 no-Z 验证路径。

## 空用户标识

Java `SM2.GM_2023_USER_ID` 的值是空字符串，但 0.10.1 的 `SM2SignOptions.Builder` 和 `SM2VerifyOptions.Builder` 会把空字符串重新映射为 `SM2.DEFAULT_USER_ID`。因此它不能产生独立的空 ID 语义，且已弃用。

TypeScript 同样用 `options.userId || DEFAULT_USER_ID` 处理空字符串。

迁移时先读取历史代码实际使用的最终 ID。新协议选择一个非空、稳定、两端一致的 UTF-8 ID，并把它写入协议配置；不要根据标准年份猜测。

## SHA-1

TypeScript `sha1` 和 `SHA1` 只用于核对无法立即迁移的旧协议。新数据使用 `sha256`、`sha384` 或 `sha512`，具体选择由对端协议决定。

迁移不能只把函数名从 SHA-1 换成 SHA-256：摘要长度、签名字段、数据库列和对端校验都会变化。使用版本字段区分旧摘要和新摘要，完成双读单写后再移除 SHA-1。

## 旧 EEA3 密钥流入口

<ApiTable label="EEA3 入口迁移" min-width="68rem">

| 语言 | 旧入口 | 返回 | 替代 |
|:--|:--|:--|:--|
| TypeScript | `eea3(...)` | word 对齐的密钥流 Hex | `eea3Encrypt(..., message, bitLength)` |
| Java | `ZUC.eea3(...)` | word 对齐的密钥流 Hex | `ZUC.eea3Encrypt(..., message, bitLength)` |

</ApiTable>

如果旧代码确实需要原始密钥流做标准向量核对，可以继续留在测试中；业务消息加解密改用 `eea3Encrypt`，并把 bitLength 写进协议。

## Java 静态入口

`SM2Util`、`SM3`、`SM4Util` 等公开入口不是已删除 API。主手册为减少同义写法，固定使用 `SM2`/`SM4` 实例和 `SM3Util`。已有静态调用可以继续运行；迁移到实例的理由应是需要共享 `GmSecurityContext`，不能只为统一代码风格制造无意义改动。

`ByteEncodings.decodeAuto` 不用于新协议，替代为 `ByteEncodings.decode(value, InputFormat.HEX/BASE64, label)`。

## 迁移验收

- 新 schema 中没有自动格式识别。
- 新 SM2 签名使用非空 ID、DER 和标准 Z。
- 新 SM2 密文固定 C1C3C2。
- 新 SM4 数据使用 GCM/CCM 并保存 nonce、AAD、tag 和编码。
- 新代码没有无前缀 TypeScript 别名、SHA-1 或旧 EEA3 入口。
- 历史路径有独立测试和协议标识，不会在新路径失败后自动触发。
- 监控可以统计剩余旧记录数量，但日志不包含 key、完整明文或私钥。

完整旧签名仍可在 [TypeScript API 说明书](/api/typescript/) 和 [Java API 说明书](/api/java/) 的兼容成员中查阅。
