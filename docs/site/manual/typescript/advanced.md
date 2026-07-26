---
title: TypeScript 高级能力
description: 配置 gmkitx 0.10.1 的自定义随机源、TextCodec、ASN.1、低层状态和实例复用。
pageInfo: false
contributors: false
editLink: false
icon: sliders
category: [使用手册, TypeScript]
tag: [RNG, ASN.1, 状态管理]
---

# TypeScript 高级能力

本章只面向受限运行环境、协议诊断或需要低层状态控制的调用方。普通业务优先使用各算法章节的高层入口。

## 本章任务

- 在受限宿主注入 CSPRNG 和 UTF-8 codec。
- 检查环境报告并禁止不安全随机降级。
- 解析签名 ASN.1 结构。
- 正确复用 `SM3`、`SHA*`、`SM4`、`ZUC` 和 `ZUCState`。

完整案例将在 TypeScript 高级能力提交中补齐。

