---
title: Java SM3 使用手册
description: 使用 GMKit Java 0.10.1 完成 SM3 摘要、HMAC、固定向量和 Charset 处理。
pageInfo: false
contributors: false
editLink: false
icon: fingerprint
category: [使用手册, Java]
tag: [SM3, HMAC, UTF-8]
---

# Java SM3 使用手册

本章使用 `SM3Util` 完成一次性摘要和 HMAC，并明确 String、`byte[]` 与 Charset 的选择。

## 本章任务

- 核对 SM3 `abc` 固定向量。
- 比较 UTF-8 文本与等价字节输入。
- 计算 HMAC 并拒绝被修改的消息。

完整案例将在 Java 常用任务提交中补齐。

