---
title: Java SM2 + SM4 混合加密
description: 使用 GMKit Java 0.10.1 组合 SM2 与 SM4-GCM 保护会话密钥和大消息。
pageInfo: false
contributors: false
editLink: false
icon: boxes
category: [使用手册, Java]
tag: [SM2, SM4-GCM, 混合加密]
---

# Java SM2 + SM4 混合加密

本章使用随机 SM4 会话 key 加密业务数据，再用接收方 SM2 公钥保护会话 key。结果对象不是稳定网络序列化格式，应用必须定义自己的载荷 schema。

## 本章任务

- 生成接收方 SM2 密钥对。
- 使用 GCM 和 AAD 完成混合加密。
- 保存解密需要的全部载荷字段。
- 解密并验证 tag 篡改失败。

完整案例将在 Java SM9 与高级能力提交中补齐。

