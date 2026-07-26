---
title: Java SM9 使用手册
description: 使用 GMKit Java 0.10.1 检查平台、管理 KGC 与身份密钥、签名、IBE、PEM 和本地句柄。
pageInfo: false
contributors: false
editLink: false
icon: shield-keyhole
category: [使用手册, Java]
tag: [SM9, IBE, PEM]
---

# Java SM9 使用手册

SM9 使用独立制品和随 JAR 分发的本地动态库。本章先检查平台，再区分 KGC 主密钥、可分发主公钥和与身份绑定的用户私钥。

## 本章任务

- 检查本地动态库和平台诊断。
- 生成主密钥并派生身份私钥。
- 完成签名、验签、IBE 加解密和错误身份测试。
- 导出、加密保存并重新导入 PEM。
- 使用 try-with-resources 关闭所有句柄。

完整案例将在 Java SM9 与高级能力提交中补齐。

