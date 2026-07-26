---
title: Java ZUC 使用手册
description: 使用 GMKit Java 0.10.1 完成 ZUC 密钥流、流加解密、EEA3 和 EIA3。
pageInfo: false
contributors: false
editLink: false
icon: signal
category: [使用手册, Java]
tag: [ZUC, EEA3, EIA3]
---

# Java ZUC 使用手册

只有协议明确要求 ZUC、EEA3 或 EIA3 时才使用本章入口。普通业务认证加密优先选择 SM4-GCM。

## 本章任务

- 区分 byte、32-bit word 和 bit 长度。
- 生成密钥流并完成流加解密。
- 使用 EEA3 处理协议消息。
- 使用 EIA3 计算并比较 MAC-I。

完整案例将在 Java 常用任务提交中补齐。

