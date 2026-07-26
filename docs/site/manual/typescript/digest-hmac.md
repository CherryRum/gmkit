---
title: TypeScript 摘要与 HMAC 使用手册
description: 使用 gmkitx 0.10.1 完成 SM3、SHA-2、HMAC、固定向量和增量摘要。
pageInfo: false
contributors: false
editLink: false
icon: fingerprint
category: [使用手册, TypeScript]
tag: [SM3, SHA-2, HMAC]
---

# TypeScript 摘要与 HMAC 使用手册

本章区分普通摘要和带密钥认证：摘要用于内容指纹，HMAC 用于持有共享 key 的双方验证消息完整性。

## 本章任务

- 核对 SM3 与 SHA-256 固定向量。
- 计算 HMAC 并拒绝被修改的消息。
- 使用增量类处理分块输入并验证 reset 行为。

完整案例将在 TypeScript 常用任务提交中补齐。

