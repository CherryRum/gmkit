---
title: TypeScript SM2 使用手册
description: 使用 gmkitx 0.10.1 完成标准 SM2 签名验签、加解密、公钥处理和密钥交换。
pageInfo: false
contributors: false
editLink: false
icon: key
category: [使用手册, TypeScript]
tag: [SM2, 签名, 加密]
---

# TypeScript SM2 使用手册

本章主流程固定非空 `userId`、DER 签名、C1C3C2 密文和 Base64 外层编码；高级部分说明角色明确的密钥交换。

## 本章任务

- 生成密钥并完成签名、验签与篡改拒绝。
- 加密、解密 UTF-8 文本和任意二进制。
- 压缩、解压公钥并检查曲线点。
- 发起方与响应方派生相同密钥并验证确认标签。

完整案例将在 TypeScript 常用任务与高级能力提交中补齐。

