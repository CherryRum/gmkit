---
title: 公共 API 覆盖数据
description: 供维护者核对 gmkitx 根导出与 GMKit Java 公共顶层类型的兼容性边界。
pageInfo: false
contributors: false
editLink: false
icon: list
order: 1
category: [项目维护]
tag: [API, TypeScript, Java]
---

# 公共 API 覆盖数据

本页是文档门禁使用的维护数据，列出 `gmkitx` 根入口和 Java 发布 JAR 的公共类型。使用方法、默认值、失败行为和示例请阅读 [TypeScript API 说明书](/api/typescript/) 或 [Java API 说明书](/api/java/)；普通接入不需要逐项阅读本页。

## 边界定义

| 发布单元 | 公共边界 | 非公共路径 |
|:--|:--|:--|
| `gmkitx` | `packages/ts/src/index.ts` 经 package `exports` 暴露的根入口；另开放 `gmkitx/package.json` | `src/*`、`dist/*` 深度导入 |
| `cn.gmkit:gmkit` | 发布 JAR 中 `cn.gmkit` 下的 public 类型和成员 | package-private 实现、测试源码 |
| `cn.gmkit:gmkit-sm9` | 发布 JAR 中 `cn.gmkit.sm9` 的 public 类型和成员 | JNI bridge/loader 的 package-private 实现 |

Java 与 TypeScript 独立版本化。共享向量只冻结指定协议字段，不表示两端 API、ABI、异常或对象生命周期相同。

## TypeScript 公开导出

以下名称全部从 `gmkitx` 根入口公开。按场景调用的完整说明见 [TypeScript API 说明书](/api/typescript/)。

### 命名空间与推荐函数

| 能力 | 命名空间 | 推荐顶层函数 |
|:--|:--|:--|
| SM2 | `sm2` | `sm2GenerateKeyPair`, `sm2GetPublicKeyFromPrivateKey`, `sm2CompressPublicKey`, `sm2DecompressPublicKey`, `sm2Encrypt`, `sm2Decrypt`, `sm2DecryptBytes`, `sm2Sign`, `sm2Verify`, `sm2KeyExchange` |
| SM3 | `sm3` | `sm3Digest`, `sm3Hmac` |
| SM4 | `sm4` | `sm4Encrypt`, `sm4Decrypt`, `sm4DecryptBytes` |
| ZUC | `zuc` | `zucEncrypt`, `zucDecrypt`, `zucDecryptBytes`, `zucKeystream`, `zucKeystreamWords`, `zucGenerateKeystream`, `eea3`, `eea3Encrypt`, `eia3` |
| SHA | `sha` | `sha1`, `sha256`, `sha384`, `sha512`, `hmacSha256`, `hmacSha384`, `hmacSha512` |

推荐顶层函数能直接表达算法归属。命名空间适合统一注入；类适合保存状态或配置。不要混用无前缀旧别名编写新代码。

### 类、状态与算法类型

| 能力 | 类 / 状态 | 类型 |
|:--|:--|:--|
| SM2 | `SM2` | `KeyPair`, `SignOptions`, `VerifyOptions`, `SM2CurveParams`, `SM2KeyExchangeParams`, `SM2KeyExchangeResult`, `SM2EncryptOptions`, `SM2DecryptOptions`, `SM2SignatureFormat`, `SM2SignatureInputFormat` |
| SM3 | `SM3` | `SM3Options` |
| SM4 | `SM4` | `SM4Options`, `SM4DecryptOptions`, `SM4CipherResult`, `SM4GCMResult`, `SM4CCMResult`, `SM4AEADResult` |
| ZUC | `ZUC`, `ZUCState` | `ZUCOptions`, `ZUCDecryptOptions` |
| SHA | `SHA1`, `SHA256`, `SHA384`, `SHA512` | `SHAOptions` |

`ZUCState` 和 `zucGenerateKeystream` 是较底层入口，适合明确按 32-bit word 处理的协议实现；普通字节数据使用高层 API。

### 常量与联合类型

| 导出 | 说明 |
|:--|:--|
| `OutputFormat`, `OutputFormatType` | `hex` / `base64` 输出 |
| `InputFormat`, `InputFormatType` | `hex` / `base64` 输入 |
| `PaddingMode`, `PaddingModeType` | `pkcs7` / `none` / `zero` |
| `CipherMode`, `CipherModeType` | SM4 的 ECB/CBC/CTR/CFB/OFB/GCM/CCM |
| `SM2CipherMode`, `SM2CipherModeType` | C1C3C2 / C1C2C3 |
| `OID` | SM2、SM2-with-SM3、SM3、SM4 与历史 EC 公钥 OID |
| `DEFAULT_USER_ID` | 兼容默认值 `1234567812345678` |

### 编码、环境与底层工具

| 分类 | 公开导出 |
|:--|:--|
| Hex/Base64/UTF-8 | `hexToBytes`, `bytesToHex`, `base64ToBytes`, `bytesToBase64`, `stringToBytes`, `bytesToString` |
| 统一输入输出 | `normalizeInput`, `decodeInput`, `encodeOutput`, `autoDecodeString` |
| 字节运算 | `xor`, `rotl`, `bytes4ToUint32BE`, `uint32ToBytes4BE`, `constantTimeEqual` |
| 格式判断 | `isHexString`, `isBase64String` |
| 随机源 | `configureRNG`, `setRNGPolicy`, `setCustomRNG`, `clearCustomRNG`, `hasCustomRNG`, `getRandomBytes` |
| 环境/文本 | `setTextCodec`, `getEnvReport` |
| 公共类型 | `BytesLike`, `RNGPolicy`, `TextCodec`, `EnvReport` |
| ASN.1 签名 | `encodeSignature`, `decodeSignature`, `rawToDer`, `derToRaw`, `asn1ToXml`, `signatureToXml` |

上述工具的精确语义见 [公共能力](/api/common.html)。`asn1ToXml` 是受限调试输出，不是 X.509/PKCS 通用解析器。

### 弃用兼容别名

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

这些名称仍存在于具名导出和 `default` 聚合对象中，`@deprecated` 只影响提示，不改变运行时。删除需要版本和迁移记录，不能在补丁版本静默发生。

### 默认导出

`default` 导出用于 UMD/CDN 和旧整体导入，包含 `sm2`、`sm3`、`sm4`、`zuc`、`sha`，全部推荐顶层算法函数，以及上述弃用别名。编码、RNG、ASN.1 和类型工具不在默认对象中，应使用具名导入。

## Java 公共类型

以下类型来自两个 Maven 发布 JAR。各重载、Builder、异常和生命周期说明见 [Java API 说明书](/api/java/)。

### `cn.gmkit.core`

| 类型 | 作用 |
|:--|:--|
| `HexCodec`, `Base64Codec`, `ByteEncodings` | 严格 Hex/Base64 编解码与统一 Input/OutputFormat 转换 |
| `Texts` | UTF-8 或显式 Charset 的字符串/字节转换 |
| `Bytes` | 防御性复制、长度检查、拼接、区间复制和敏感值比较 |
| `Checks` | 通用非空、非空白和默认值检查 |
| `BcProviders` | 创建、查找或按需注册 Bouncy Castle Provider |
| `GmSecurityContext`, `GmSecurityContexts` | 封装 Provider、SecureRandom 和注册策略 |
| `InputFormat`, `OutputFormat` | HEX / BASE64 枚举 |
| `SM2CipherMode` | C1C3C2 / C1C2C3 |
| `SM2SignatureFormat`, `SM2SignatureInputFormat` | RAW / DER 与验签 AUTO |
| `SM4CipherMode`, `SM4Padding` | SM4 mode 与 padding 枚举 |
| `GmkitException` | 主包参数和密码操作运行时异常 |
| `Messages` | 主包双语错误消息构造；应用通常不需要直接调用 |

### `cn.gmkit.sm2`

| 类型 | 作用 |
|:--|:--|
| `SM2`, `SM2Util` | 实例式与静态式主入口 |
| `SM2KeyPair` | `publicKey()` / `privateKey()` Hex 值对象 |
| `SM2SignOptions`, `SM2VerifyOptions` | 签名格式、身份、Z 语义与安全上下文配置 |
| `SM2KeyExchangeOptions`, `SM2KeyExchangeResult` | 角色、bit 长度、身份、确认标签和派生结果 |
| `SM2Ciphertext`, `SM2Ciphertexts` | C1/C2/C3 结构和 raw/DER、排列转换 |
| `SM2Signatures` | raw/DER 签名格式转换与解析 |

### `cn.gmkit.sm3`、`cn.gmkit.sm4`、`cn.gmkit.zuc`

| 包 | 公共类型 | 作用 |
|:--|:--|:--|
| `cn.gmkit.sm3` | `SM3`, `SM3Util` | 摘要与 HMAC 的实例/静态入口 |
| `cn.gmkit.sm4` | `SM4`, `SM4Util`, `SM4Options`, `SM4CipherResult` | 加解密、配置与结构化结果 |
| `cn.gmkit.zuc` | `ZUC`, `ZUCUtil` | ZUC-128、EEA3、EIA3 静态入口 |

### `cn.gmkit.integration`

| 类型 | 作用 |
|:--|:--|
| `SM2Sm4Hybrid` | 生成随机 SM4 key，用 SM4 处理数据并用 SM2 加密会话 key |
| `SM2Sm4HybridPayload` | 保存加密 key、密文、IV、AAD、tag、mode 和 padding |

它是 Java 混合加密值对象，不是跨语言序列化格式。跨系统传输前仍需定义 JSON/二进制 schema、字段编码和版本。

### `cn.gmkit.sm9`

| 类型 | 作用 |
|:--|:--|
| `SM9` | native 可用性、密钥、签名验签和 IBE 门面 |
| `SM9SignMasterKey`, `SM9SignKey` | 签名主密钥/公开主密钥与用户签名私钥 |
| `SM9EncMasterKey`, `SM9EncKey` | 加密主密钥/公开主密钥与用户解密私钥 |
| `SM9Signature` | 可复用流式签名/验签上下文 |
| `SM9Exception`, `SM9UnsupportedPlatformException` | 操作失败与平台不支持异常 |

SM9 handle 类型都实现 `AutoCloseable`，详细生命周期见 [SM9](/algorithms/SM9.html)。

## 变更规则

新增或删除 TypeScript 顶层导出、Java public 顶层类型时，文档检查会要求同步更新本页。方法级签名由 TypeDoc/Javadoc 门禁检查；兼容策略见仓库 [`docs/API_STABILITY.md`](https://github.com/gmkits/gmkit/blob/main/docs/API_STABILITY.md)。
