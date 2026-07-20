---
title: 算法与协议能力
icon: shield
category:
  - 算法
---

# 算法与协议能力

本目录按算法组织文档。同一页面同时说明 Java 与 TypeScript 的实现范围、API 入口、参数默认值、编码约定、错误边界和验证依据。两端共享部分协议向量，但不共享源码、签名或异常类型。

## 当前支持矩阵

| 能力 | Java `gmkit` | TypeScript `gmkitx` | 说明 |
|:--|:--:|:--:|:--|
| [SM2](/algorithms/SM2) | 支持 | 支持 | 密钥、公钥压缩、加解密、签名验签、密钥交换 |
| [SM3](/algorithms/SM3) | 支持 | 支持 | 摘要与 HMAC；TS 另有增量状态机 |
| [SM4](/algorithms/SM4) | 支持 | 支持 | ECB、CBC、CTR、CFB、OFB、GCM、CCM |
| [ZUC](/algorithms/ZUC) | 支持 | 支持 | ZUC-128、128-EEA3、128-EIA3 |
| [SM9](/algorithms/SM9.html) | `gmkit-sm9` | 不提供 | Java API 通过 JNI 调用 JAR 内 GmSSL runtime |
| [SHA](/algorithms/SHA) | 使用 JDK | 支持 | `gmkitx` 提供 SHA-1/256/384/512 与 HMAC；Java 主包不封装 SHA |

“支持”只表示当前发布包存在对应 API，并由列出的测试覆盖；不等同于密码产品认证或对所有第三方实现的互操作承诺。

## 阅读顺序

1. 先看算法页的支持矩阵和默认值，不要从相似函数名推断两端行为相同。
2. 协议中显式保存 mode、padding、编码、`userId`、IV/nonce、tag 等字段。
3. 用页面中的固定向量验证确定性操作，再验证随机签名、随机密文能被对端验签或解密。
4. 查具体重载和类型签名时进入 [API Reference](/api/)；查公共编码、随机源与异常时进入 [公共能力](/api/common.html)。

## 共同约定

- 文档中的 bit 与 byte 会明确标注；SM2 密钥交换在 TS 使用 `keyLength` 字节，在 Java 使用 `keyBits` 位。
- 字符串示例均按 UTF-8。二进制数据应使用 `Uint8Array` 或 `byte[]`，不要经过文本解码。
- Hex 输出使用小写；Base64 使用 RFC 4648 基本字母表并带标准填充。
- 项目共享向量用于锁定两端协议字段。只有标注外部标准来源的 case 才作为对应标准的固定参考。
