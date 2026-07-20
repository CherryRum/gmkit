---
title: 公开 API 清单
icon: list
order: 2
category:
  - 开发指南
  - API
tag:
  - API
  - TypeScript
  - Java
  - 互操作
---

# 公开 API 清单

本文以 `packages/ts/src/index.ts` 为准，整理 gmkitx 当前对外暴露的全部 API，供文档核对、跨语言实现和小版本维护使用。

## 维护原则

- 以 `packages/ts/src/index.ts` 为唯一公开导出入口，包的 `exports` 目前只开放根入口和 `package.json`。
- 无算法前缀的旧顶层别名继续保留并标记 `@deprecated`，避免已有项目升级后发生运行时中断。
- 参数默认值属于兼容协议；无效枚举、非法编码和不满足长度要求的输入应明确拒绝。
- Java 与 TypeScript 共享互操作向量，但不承诺 API 或 ABI 相同。其他语言对接也必须显式固定协议字段。

## 顶层命名空间导出

| 导出名 | 说明 | 主要内容 |
|:--|:--|:--|
| `sm2` | SM2 命名空间 | 函数式 API + `SM2` 类 |
| `sm3` | SM3 命名空间 | 函数式 API + `SM3` 类 |
| `sm4` | SM4 命名空间 | 函数式 API + `SM4` 类 |
| `zuc` | ZUC 命名空间 | 函数式 API + `ZUC` 类 |
| `sha` | SHA 命名空间 | 函数式 API + `SHA1/256/384/512` 类 |

## 具名导出

### SM2

| 分类 | 导出 |
|:--|:--|
| 函数 | `sm2GenerateKeyPair`, `sm2GetPublicKeyFromPrivateKey`, `sm2CompressPublicKey`, `sm2DecompressPublicKey`, `sm2Encrypt`, `sm2Decrypt`, `sm2DecryptBytes`, `sm2Sign`, `sm2Verify`, `sm2KeyExchange` |
| 类 | `SM2` |
| 类型 | `KeyPair`, `SignOptions`, `VerifyOptions`, `SM2CurveParams`, `SM2KeyExchangeParams`, `SM2KeyExchangeResult`, `SM2EncryptOptions`, `SM2DecryptOptions`, `SM2SignatureFormat`, `SM2SignatureInputFormat` |

### SM3

| 分类 | 导出 |
|:--|:--|
| 函数 | `sm3Digest`, `sm3Hmac` |
| 类 | `SM3` |
| 类型 | `SM3Options` |

### SM4

| 分类 | 导出 |
|:--|:--|
| 函数 | `sm4Encrypt`, `sm4Decrypt`, `sm4DecryptBytes` |
| 类 | `SM4` |
| 类型 | `SM4Options`, `SM4DecryptOptions`, `SM4CipherResult`, `SM4GCMResult`, `SM4CCMResult`, `SM4AEADResult` |

### ZUC

| 分类 | 导出 |
|:--|:--|
| 函数 | `zucEncrypt`, `zucDecrypt`, `zucDecryptBytes`, `zucKeystream`, `zucKeystreamWords`, `eea3`, `eea3Encrypt`, `eia3`, `zucGenerateKeystream` |
| 类 / 状态 | `ZUC`, `ZUCState` |
| 类型 | `ZUCOptions`, `ZUCDecryptOptions` |

### SHA

| 分类 | 导出 |
|:--|:--|
| 函数 | `sha256`, `sha384`, `sha512`, `sha1`, `hmacSha256`, `hmacSha384`, `hmacSha512` |
| 类 | `SHA256`, `SHA384`, `SHA512`, `SHA1` |
| 类型 | `SHAOptions` |

### 常量与公共类型

| 分类 | 导出 |
|:--|:--|
| 常量 | `CipherMode`, `PaddingMode`, `SM2CipherMode`, `OutputFormat`, `InputFormat`, `OID`, `DEFAULT_USER_ID` |
| 类型 | `CipherModeType`, `PaddingModeType`, `SM2CipherModeType`, `OutputFormatType`, `InputFormatType` |

### 工具函数

| 分类 | 导出 |
|:--|:--|
| 编码 | `hexToBytes`, `bytesToHex`, `base64ToBytes`, `bytesToBase64`, `stringToBytes`, `bytesToString` |
| 输入输出 | `normalizeInput`, `decodeInput`, `encodeOutput`, `autoDecodeString` |
| 基础运算 | `xor`, `rotl`, `bytes4ToUint32BE`, `uint32ToBytes4BE` |
| 格式判断 | `isHexString`, `isBase64String` |
| RNG / 环境 | `configureRNG`, `setRNGPolicy`, `setCustomRNG`, `clearCustomRNG`, `hasCustomRNG`, `getRandomBytes`, `setTextCodec`, `getEnvReport` |
| 比较 | `constantTimeEqual`（尽力而为；JavaScript 运行时不提供严格常量时间保证） |
| 类型 | `BytesLike`, `RNGPolicy`, `TextCodec`, `EnvReport` |

### ASN.1

| 导出 |
|:--|
| `encodeSignature`, `decodeSignature`, `rawToDer`, `derToRaw`, `asn1ToXml`, `signatureToXml` |

DER 解码只接受 canonical DER。`asn1ToXml` 用于调试展示，会拒绝截断、越过容器边界或超过 64 层嵌套的输入，不应作为通用证书解析器。

### 默认导出

默认导出保留 UMD / CDN 使用场景，包含：

- `sm2`, `sm3`, `sm4`, `zuc`, `sha`
- `sm2GenerateKeyPair`, `sm2GetPublicKeyFromPrivateKey`, `sm2CompressPublicKey`, `sm2DecompressPublicKey`
- `sm2Encrypt`, `sm2Decrypt`, `sm2DecryptBytes`, `sm2Sign`, `sm2Verify`, `sm2KeyExchange`
- `sm3Digest`, `sm3Hmac`
- `sm4Encrypt`, `sm4Decrypt`, `sm4DecryptBytes`
- `zucEncrypt`, `zucDecrypt`, `zucDecryptBytes`, `zucKeystream`, `zucKeystreamWords`, `zucGenerateKeystream`, `eea3`, `eea3Encrypt`, `eia3`
- `sha256`, `sha384`, `sha512`, `sha1`
- `hmacSha256`, `hmacSha384`, `hmacSha512`

默认导出继续包含 `generateKeyPair`、`getPublicKeyFromPrivateKey`、`compressPublicKey`、`decompressPublicKey`、`sign`、`verify`、`keyExchange`、`digest`、`hmac` 等已弃用旧名，用于维持 UMD/CDN 和已有项目的调用路径。新代码应使用带算法前缀的函数或命名空间。

## 弃用兼容别名

下列名称仍是公开导出，也仍包含在默认导出对象中。它们不会在本次版本中删除，但只用于兼容旧项目：

| 旧名称 | 推荐替代项 |
|:--|:--|
| `generateKeyPair` | `sm2GenerateKeyPair` |
| `getPublicKeyFromPrivateKey` | `sm2GetPublicKeyFromPrivateKey` |
| `compressPublicKey` | `sm2CompressPublicKey` |
| `decompressPublicKey` | `sm2DecompressPublicKey` |
| `sign` | `sm2Sign` |
| `verify` | `sm2Verify` |
| `keyExchange` | `sm2KeyExchange` |
| `digest` | `sm3Digest` |
| `hmac` | `sm3Hmac` |

弃用标记只影响类型提示，不改变运行时行为。正式删除任何兼容名称都必须经过主版本变更、迁移说明和发布记录，不能在小版本中静默移除。

## Java 对照边界

Java 主包已经实现 SM2、SM3、SM4 和 ZUC。跨语言调用以 [共享互操作向量](/dev/INTEROP_VECTORS) 为验证依据，而不是按函数名推断行为一致：

| 协议项 | 对接要求 |
|:--|:--|
| SM2 | 固定 `userId`、C1C3C2/C1C2C3、raw/DER、公钥表示和文本编码 |
| SM3 | 固定原始字节或 UTF-8 输入，以及 hex/base64 输出 |
| SM4 | 固定 mode、padding、IV/nonce、AAD、tag 和 tag 长度 |
| ZUC | 固定 key、IV、COUNT、BEARER、DIRECTION 和消息 bit length |

Java 独有的 SM9 JNI/GmSSL 模块不属于 gmkitx 的公开 API，TypeScript 端不提供 SM9 占位实现。

## 跨语言协议冻结清单

写 Java 端或其他端实现时，协议里至少要固定下面这些字段：

| 项目 | 必须明确 |
|:--|:--|
| SM2 签名 | `userId`, `signatureFormat`, `inputFormat/outputFormat` |
| SM2 加解密 | `mode`, 公钥是否压缩, 密文编码 |
| SM4 | `mode`, `padding`, `iv/nonce`, `aad`, `tagLength`, 密文编码 |
| ZUC | `key`, `iv`, 输出编码, `length` 语义是字节还是 word |
| 文本 | UTF-8，不混用本地编码 |
| RNG | 默认策略为 `warn`：无 CSPRNG 时警告并兼容降级；安全敏感应用应注入 CSPRNG 或启用 `configureRNG('strict')`；自定义 RNG 必须返回精确长度的 `Uint8Array` |

## 输入校验与兼容边界

当前公开入口会显式拒绝以下错误输入，调用方不能依赖自动修补或静默回退：

- SM2 拒绝非法 `mode`
- SM2 拒绝非法 `signatureFormat`
- SM4 拒绝奇数长度的 hex key / iv / nonce
- SM4-GCM 拒绝不合规的标签长度

`userId` 是特意保留的兼容例外：省略值和空字符串都会回落到 `DEFAULT_USER_ID`。随机源默认策略同样保持为 `warn`，缺少 CSPRNG 时警告并兼容降级；安全敏感环境应调用 `configureRNG('strict')`，受限小程序应通过 `setCustomRNG()` 注入平台随机源。

文档审计会从 `packages/ts/src/index.ts` 提取全部顶层导出，并检查本页是否覆盖。新增或删除公开名称时，应同步更新本页、类型测试和 CHANGELOG。
