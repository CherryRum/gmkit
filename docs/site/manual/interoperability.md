---
title: Java 与 TypeScript 跨语言接入
description: 固定 GMKit 0.10.1 双语言协议中的编码、SM2、SM4-GCM 和版本字段。
pageInfo: false
contributors: false
editLink: false
icon: arrows-left-right
category: [使用手册, 互操作]
tag: [Java, TypeScript, 协议]
---

# Java 与 TypeScript 跨语言接入

跨语言接入不能依赖任一端的自动识别或默认值。本章固定消息字节、外层编码、SM2 身份与格式、SM4-GCM 字段和协议版本。

## 固定字段

<ApiTable label="跨语言协议字段" min-width="70rem">

| 字段 | 本手册约定 | 两端职责 |
|:--|:--|:--|
| 文本 | UTF-8 | 签名和加密前不得改写字符或换行 |
| 二进制外层 | Base64 | 解码后再交给字节 API |
| SM2 签名 | 非空 userId、DER、Base64 | 签名端和验签端使用相同 userId |
| SM2 密文 | C1C3C2、Base64 | 解密端不尝试另一种排列 |
| SM4-GCM | 12 字节 nonce、AAD、128-bit tag | 保存 ciphertext、tag、nonce 和 AAD |
| 载荷版本 | `schema=1` | 解析端只接受已知版本 |

</ApiTable>

完整双向案例将在跨语言接入提交中补齐。

