---
title: API Reference
icon: code
category:
  - API Reference
---

# API Reference

这里同时提供面向使用者的 API 说明书和从源码生成的精确 Reference。第一次接入请先阅读对应语言说明书；只有在核对具体重载、类型定义或历史版本时，才需要进入 TypeDoc/Javadoc。

## 从这里开始

| 目标 | 入口 | 能解决的问题 |
|:--|:--|:--|
| 使用 npm 包 | [TypeScript API 说明书](/api/typescript/) | 导入方式、121 个根导出、参数默认值、错误行为和完整示例 |
| 使用 Maven 包 | [Java API 说明书](/api/java/) | 两个 artifact、46 个公共类型、重载、Builder、异常和资源生命周期 |
| 设计跨语言协议 | [公共输入与安全约定](/api/common.html) | UTF-8、Hex/Base64、随机源、Provider、ASN.1 和失败语义 |
| 审计公共边界 | [公开 API 清单](/api/public-api.html) | 哪些名称属于兼容性承诺，哪些路径属于内部实现 |
| 核对精确签名 | latest TypeDoc/Javadoc | 当前 `main` 的函数、成员、字段、返回值与弃用标记 |
| 排查线上版本 | 版本快照 | 与已发布 npm/Maven 制品相同版本的 Reference |

## 三层文档的职责

1. **语言说明书**：回答“应该调用什么、参数怎么传、失败如何处理”。
2. **算法页**：回答“协议字段如何选择、Java/TypeScript 有什么差异”。
3. **自动 Reference**：回答“这个版本的精确签名和源码注释是什么”。

自动 Reference 不能替代说明书：生成器会列出全部成员，但不会替应用决定 mode、padding、身份、编码、nonce 或资源生命周期。

## 版本化 Reference

| 语言 | 当前 `main` | 已发布版本路径 |
|:--|:--|:--|
| TypeScript | [TypeDoc latest](/api/typescript/latest/) | `/api/typescript/versions/<version>/` |
| Java | [Javadoc latest](/api/java/latest/) | `/api/java/versions/<version>/` |

`latest` 随 `main` 更新，不等同于已发布版本。排查线上调用时先选择与制品版本相同的快照；开发当前源码时再使用 latest。

<ApiVersionCatalog />

## 阅读示例的约定

- TypeScript 示例均从 `gmkitx` 根入口导入，不使用 `src/*`、`dist/*` 等深度路径。
- Java 示例只使用发布 JAR 中的 public 类型，不使用 package-private 实现。
- 示例中的 Hex 默认不带 `0x`；字符串消息默认使用 UTF-8。
- 示例的断言属于可执行文档门禁，但测试通过不代表完成安全审计或产品认证。
