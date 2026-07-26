---
title: TypeScript SM4 使用手册
description: 使用 gmkitx 0.10.1 完成 SM4-GCM 认证加密、CCM、二进制处理和失败验证。
pageInfo: false
contributors: false
editLink: false
icon: lock
category: [使用手册, TypeScript]
tag: [SM4, GCM, AEAD]
---

# TypeScript SM4 使用手册

新协议首先选择 GCM 或 CCM。主流程固定 16 字节 key、12 字节 GCM nonce、AAD、ciphertext 和 tag，并验证 tag 被修改时解密失败。

## 本章任务

- 完成 SM4-GCM 文本和二进制往返。
- 保存 nonce、AAD、ciphertext、tag 与编码字段。
- 验证 tag、AAD 或 ciphertext 被修改后拒绝解密。
- 了解 CCM 和不带认证模式的适用边界。

完整案例将在 TypeScript 常用任务提交中补齐。

