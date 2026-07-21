---
title: API 说明书
description: 按语言阅读 GMKit 使用说明，并从已发布版本签名索引核对历史制品。
pageInfo: false
contributors: false
editLink: false
icon: code
category:
  - API 说明书
tag:
  - API
  - TypeDoc
  - Javadoc
---

# API 说明书

这里按语言和算法解释怎样选择入口、传递参数、处理失败。需要核对历史制品的逐成员签名时，再从页面下方选择与制品相同的已发布版本。

## 选择说明书

| 目标 | 入口 | 能解决的问题 |
|:--|:--|:--|
| 使用 npm 包 | [TypeScript API 说明书](/api/typescript/) | 导入方式、121 个根导出、参数默认值、错误行为和可执行示例 |
| 使用 Maven 包 | [Java API 说明书](/api/java/) | 两个 artifact、46 个公共类型、重载、Builder、异常和资源生命周期 |
| 设计跨语言协议 | [公共输入与安全约定](/api/common.html) | UTF-8、Hex/Base64、随机源、Provider、ASN.1 和失败语义 |
| 核对历史签名 | 已发布版本签名索引 | 与 npm/Maven 制品相同版本的函数、成员、字段和弃用标记 |

## 三层文档的职责

1. **语言说明书**：回答“应该调用什么、参数怎么传、失败如何处理”。
2. **算法页**：回答“协议字段如何选择、Java/TypeScript 有什么差异”。
3. **版本签名索引**：回答“这个已发布版本的精确签名和源码注释是什么”。

自动生成的签名索引不能替代说明书：生成器会列出全部成员，但不会替应用决定 mode、padding、身份、编码、nonce 或资源生命周期。

## 已发布版本签名索引

版本选择器只列出已经发布的快照。排查线上调用时，应选择与 npm 或 Maven 制品完全相同的版本；当前源码的签名由仓库构建任务校验，不作为普通使用入口展示。

<ApiVersionCatalog />

## 阅读示例的约定

- TypeScript 示例均从 `gmkitx` 根入口导入，不使用 `src/*`、`dist/*` 等深度路径。
- Java 示例只使用发布 JAR 中的 public 类型，不使用 package-private 实现。
- 示例中的 Hex 默认不带 `0x`；字符串消息默认使用 UTF-8。
- 示例的断言属于可执行文档门禁，但测试通过不代表完成安全审计或产品认证。
