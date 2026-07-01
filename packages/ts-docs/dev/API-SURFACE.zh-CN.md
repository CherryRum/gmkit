---
title: 公开 API 清单
icon: list
order: 2
author: mumu
date: 2025-11-23
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

- 以 `src/index.ts` 为唯一公开导出面
- `0.x` 阶段允许清理过期 ABI；无算法前缀的旧顶层别名已经移除
- 涉及密码学参数的“容错”优先改为“显式拒绝”
- Java / Go / Python / Rust 对接时，以协议字段完全对齐为先，不依赖自动推断

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
| 函数 | `sm2GenerateKeyPair`, `sm2GetPublicKeyFromPrivateKey`, `sm2CompressPublicKey`, `sm2DecompressPublicKey`, `sm2Encrypt`, `sm2Decrypt`, `sm2Sign`, `sm2Verify`, `sm2KeyExchange` |
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
| 函数 | `sm4Encrypt`, `sm4Decrypt` |
| 类 | `SM4` |
| 类型 | `SM4Options`, `SM4DecryptOptions`, `SM4CipherResult`, `SM4GCMResult`, `SM4CCMResult`, `SM4AEADResult` |

### ZUC

| 分类 | 导出 |
|:--|:--|
| 函数 | `zucEncrypt`, `zucDecrypt`, `zucKeystream`, `zucKeystreamWords`, `eea3`, `eia3`, `zucGenerateKeystream` |
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
| RNG / 环境 | `configureRNG`, `setRNGPolicy`, `setCustomRNG`, `getRandomBytes`, `setTextCodec`, `getEnvReport` |
| 类型 | `BytesLike`, `RNGPolicy`, `TextCodec`, `EnvReport` |

### ASN.1

| 导出 |
|:--|
| `encodeSignature`, `decodeSignature`, `rawToDer`, `derToRaw`, `asn1ToXml`, `signatureToXml` |

### 默认导出

默认导出保留 UMD / CDN 使用场景，包含：

- `sm2`, `sm3`, `sm4`, `zuc`, `sha`
- `sm2GenerateKeyPair`, `sm2GetPublicKeyFromPrivateKey`, `sm2CompressPublicKey`, `sm2DecompressPublicKey`
- `sm2Encrypt`, `sm2Decrypt`, `sm2Sign`, `sm2Verify`, `sm2KeyExchange`
- `sm3Digest`, `sm3Hmac`
- `sm4Encrypt`, `sm4Decrypt`
- `zucEncrypt`, `zucDecrypt`, `zucKeystream`, `zucKeystreamWords`, `zucGenerateKeystream`, `eea3`, `eia3`
- `sha256`, `sha384`, `sha512`, `sha1`
- `hmacSha256`, `hmacSha384`, `hmacSha512`

默认导出不再包含 `generateKeyPair`、`getPublicKeyFromPrivateKey`、`compressPublicKey`、`decompressPublicKey`、`sign`、`verify`、`keyExchange`、`digest`、`hmac` 等无算法前缀旧名。

## Java 端建议优先实现顺序

### 第一阶段：先覆盖协议主路径

| gmkitx API | Java 端建议 |
|:--|:--|
| `sm2Encrypt` / `sm2Decrypt` | 先用 Bouncy Castle 或 Kona 对齐 `C1C3C2`、公钥格式、编码格式 |
| `sm2Sign` / `sm2Verify` | 先固定 `userId` 与 `signatureFormat`，推荐先支持 DER + raw 两种 |
| `sm3Digest` / `sm3Hmac` | 用 `SM3` 和 `HmacSM3` 对齐结果格式 |
| `sm4Encrypt` / `sm4Decrypt` | 优先实现 `CBC + PKCS7` 与 `GCM`，再扩展 `CCM/CTR/CFB/OFB` |

### 第二阶段：补全工程能力

| gmkitx API | Java 端建议 |
|:--|:--|
| `sm2GenerateKeyPair`, `sm2GetPublicKeyFromPrivateKey` | 统一原始 hex 表示，避免 PEM/DER 与裸密钥混淆 |
| `sm2CompressPublicKey`, `sm2DecompressPublicKey` | 互操作常见，建议补齐 |
| `sm2KeyExchange` | 单独做协议测试，不能与普通 ECDH 混淆 |
| `SM2` / `SM3` / `SM4` 类 | 在函数式 API 稳定后再封装 OOP 版本 |
| `ASN.1` / utils | 作为互操作工具层补齐，不建议先写业务封装再回补 |

## 跨语言协议冻结清单

写 Java 端或其他端实现时，协议里至少要固定下面这些字段：

| 项目 | 必须明确 |
|:--|:--|
| SM2 签名 | `userId`, `signatureFormat`, `inputFormat/outputFormat` |
| SM2 加解密 | `mode`, 公钥是否压缩, 密文编码 |
| SM4 | `mode`, `padding`, `iv/nonce`, `aad`, `tagLength`, 密文编码 |
| ZUC | `key`, `iv`, 输出编码, `length` 语义是字节还是 word |
| 文本 | UTF-8，不混用本地编码 |
| RNG | 必须使用 CSPRNG，不接受 `Math.random()` 级别实现 |

## 0.10.0-preview.1 安全边界

`0.10.0-preview.1` 补充了对错误输入的显式拒绝，文档和其他语言实现都应同步：

- SM2 拒绝非法 `mode`
- SM2 拒绝非法 `signatureFormat`
- SM4 拒绝奇数长度的 hex key / iv / nonce
- SM4-GCM 拒绝不合规的标签长度

如果其他语言实现仍然“自动补零”“自动回退默认模式”，就会和当前 TypeScript 行为不一致，必须避免。
