---
title: Java 核心类型与错误
description: 明确 GMKit Java 0.10.1 的编码、字节、Provider、安全上下文和异常边界。
pageInfo: false
contributors: false
editLink: false
icon: binary
category: [使用手册, Java]
tag: [编码, Provider, SecureRandom]
---

# Java 核心类型与错误

本章给出所有 Java 示例共同遵循的数据和运行环境规则：文本显式使用 UTF-8，二进制使用 `byte[]`，协议字段使用明确的 codec。

## 本章任务

- 完成 Hex、Base64 和 UTF-8 往返。
- 创建不修改全局 Provider 列表的安全上下文。
- 区分 `false`、`GmkitException` 和 SM9 异常。

完整案例将在 Java 常用任务提交中补齐。

