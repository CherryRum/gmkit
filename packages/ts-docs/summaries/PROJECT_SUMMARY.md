---
title: 项目状态
icon: info
order: 1
category: [维护记录]
---

# 项目状态

本文是当前 Monorepo 的维护入口，不是营销材料。版本、模块和验证命令以仓库文件为准。

## 模块

| 路径 | 内容 |
|:--|:--|
| `packages/ts` | `gmkitx`：SM2/SM3/SM4/ZUC/SHA 的纯 TypeScript 包 |
| `packages/java` | GMKit Java 主包、BOM、SM9 API/native 模块和基准 |
| `packages/ts-docs` | VuePress 技术文档与跨语言 fixture |
| `vectors` | Java/TypeScript 共享互操作数据 |
| `apps/gmkit-studio` | 工具站应用，独立于算法包发布 |

## 能力边界

- TypeScript 不实现 SM9；SM9 位于 Java/native 边界。
- TypeScript 不提供 AES/RSA；文档示例来自 Web Crypto。
- ZUC 当前为 ZUC-128、128-EEA3、128-EIA3，不支持 ZUC-256。
- 固定向量和单测不等于第三方安全审计或产品认证。

## 验证入口

```bash
npm run verify
npm run docs:check
npm run docs:test-examples
npm run docs:build
```

发布标签区分 `ts-v*` 和 `java-v*`。TypeScript 旧 `v*` 触发器只为兼容历史流程。

## 已知限制

- JavaScript 运行时无法保证严格常量时间和可靠内存清除。
- 缺 CSPRNG 时默认 `warn` 会为旧受限环境降级；高安全部署应 strict 或注入平台安全源。
- 跨语言库只验证文档声明的 fixture 范围，不能推导全部 API 互操作。

- [实现状态](/summaries/IMPLEMENTATION_SUMMARY)
- [安全状态](/summaries/SECURITY-SUMMARY)
