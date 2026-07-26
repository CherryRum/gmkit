---
title: TypeScript 数据、编码与错误
description: 明确 gmkitx 0.10.1 的 UTF-8、字节、Hex、Base64、随机源和失败语义。
pageInfo: false
contributors: false
editLink: false
icon: binary
category: [使用手册, TypeScript]
tag: [编码, Uint8Array, RNG]
---

# TypeScript 数据、编码与错误

本章给出所有后续示例共同遵循的数据规则：业务文本使用 UTF-8，任意二进制使用 `Uint8Array`，协议字段显式指定 Hex 或 Base64。

## 本章任务

- 编码和解码 `00 ff 80 41`。
- 配置严格随机源并生成 nonce。
- 区分验签失败、认证失败和非法参数。

详细案例将在 TypeScript 常用任务提交中补齐。

