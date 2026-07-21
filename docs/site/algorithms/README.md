---
title: 算法与协议能力
description: 对照 SM2、SM3、SM4、ZUC、SM9 和 SHA 的双语言能力、协议字段与验证边界。
icon: shield
category:
  - 算法
tag:
  - 算法
  - 跨语言
  - 协议
---

# 算法与协议能力

本目录只处理算法选择、协议字段、双语言差异和验证证据。函数签名、重载、默认值、异常和可执行案例集中在各语言 API 说明书，避免同一调用方法在多处重复维护。

## 当前支持矩阵

<ApiTable label="GMKit 算法支持矩阵" min-width="68rem">

| 能力 | Java `gmkit` | TypeScript `gmkitx` | 说明 |
|:--|:--:|:--:|:--|
| [SM2](/algorithms/SM2) | 支持 | 支持 | 密钥、公钥压缩、加解密、签名验签、密钥交换 |
| [SM3](/algorithms/SM3) | 支持 | 支持 | 摘要与 HMAC；TS 另有增量状态机 |
| [SM4](/algorithms/SM4) | 支持 | 支持 | ECB、CBC、CTR、CFB、OFB、GCM、CCM |
| [ZUC](/algorithms/ZUC) | 支持 | 支持 | ZUC-128、128-EEA3、128-EIA3 |
| [SM9](/algorithms/SM9.html) | `gmkit-sm9` | 不提供 | Java API 通过 JNI 调用 JAR 内 GmSSL 本地动态库 |
| [SHA](/algorithms/SHA) | 使用 JDK | 支持 | `gmkitx` 提供 SHA-1/256/384/512 与 HMAC；Java 主包不封装 SHA |

</ApiTable>

“支持”只表示当前发布包存在对应 API，并由列出的测试覆盖；不等同于密码产品认证或对所有第三方实现的互操作承诺。

## 阅读顺序

1. 先按业务目标选择算法，再核对该算法页列出的协议字段和双语言差异。
2. 把 mode、padding、编码、`userId`、IV/nonce、tag 和版本写入协议，而不是留给接收方猜测。
3. 进入 [TypeScript 说明书](/api/typescript/) 或 [Java 说明书](/api/java/) 选择具体入口并运行成功、失败案例。
4. 用固定向量验证确定性操作，再双向验证随机签名或密文；历史制品签名从 [版本签名索引](/api/#已发布版本签名索引) 核对。

## 共同约定

- 文档中的 bit 与 byte 会明确标注；SM2 密钥交换在 TS 使用 `keyLength` 字节，在 Java 使用 `keyBits` 位。
- 字符串示例均按 UTF-8。二进制数据应使用 `Uint8Array` 或 `byte[]`，不要经过文本解码。
- Hex 输出使用小写；Base64 使用 RFC 4648 基本字母表并带标准填充。
- 项目共享向量用于锁定两端协议字段。只有标注外部标准来源的 case 才作为对应标准的固定参考。
