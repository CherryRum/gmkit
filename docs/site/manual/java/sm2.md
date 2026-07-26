---
title: Java SM2 使用手册
description: 使用 GMKit Java 0.10.1 完成标准 Z 签名验签、加解密、格式转换和密钥交换。
pageInfo: false
contributors: false
editLink: false
icon: key
category: [使用手册, Java]
tag: [SM2, 签名, 加密]
---

# Java SM2 使用手册

本章使用 `SM2` 实例和标准 `SM3(Z || M)` 签名路径，固定非空 user ID、DER 签名与 C1C3C2 密文。

## 本章任务

- 生成密钥并完成签名、验签与篡改拒绝。
- 加密、解密 UTF-8 文本和任意二进制。
- 转换公钥、签名和密文格式。
- 完成双方密钥交换并比较确认值。

完整案例将在 Java 常用任务提交中补齐。

