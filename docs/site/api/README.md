---
title: API Reference
icon: code
category:
  - API Reference
---

# API Reference

本区分为手写公共 API 指南与自动生成 Reference。手写页面解释入口选择、编码、默认值和跨语言差异；TypeDoc/Javadoc 用来核对每个函数、重载、字段、返回值、异常与弃用状态。

- [公开 API 清单](/api/public-api.html)：TypeScript 全部顶层导出和 Java 全部公共类型。
- [公共能力](/api/common.html)：编码、随机源、安全上下文、格式、ASN.1、异常与混合加密。

| 语言 | latest | 版本快照 |
|:--|:--|:--|
| TypeScript | [TypeDoc](/api/typescript/latest/) | `/api/typescript/versions/<version>/` |
| Java | [Javadoc](/api/java/latest/) | `/api/java/versions/<version>/` |

latest 随 `main` 更新，不等同于已发布版本。版本快照从对应 `ts-v*` 或 `java-v*` tag 重建，适合核对公开制品。

<ApiVersionCatalog />

`latest` 可能领先已发布版本。排查线上调用时优先选择与制品版本相同的快照；开发 `main` 时再使用 latest。
