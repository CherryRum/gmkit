---
title: Java SM4 使用手册
description: 使用 GMKit Java 0.10.1 完成 SM4-GCM、AAD、tag、二进制解密和认证失败验证。
pageInfo: false
contributors: false
editLink: false
icon: lock
category: [使用手册, Java]
tag: [SM4, GCM, AEAD]
---

# Java SM4 使用手册

本章使用 `SM4` 和 `SM4Options` 明确指定 GCM、NONE padding、nonce、AAD 和 tag 长度。

## 本章任务

- 完成 SM4-GCM 文本和二进制往返。
- 检查结果对象中的 ciphertext 与 tag。
- 验证 tag、AAD 或 ciphertext 被修改后抛出 `GmkitException`。
- 了解 CCM 和其他工作模式的边界。

完整案例将在 Java 常用任务提交中补齐。

