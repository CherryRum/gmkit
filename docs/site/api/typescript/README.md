---
title: TypeScript API 说明书
icon: code
category:
  - API Reference
  - TypeScript
tag:
  - TypeScript
  - gmkitx
  - API
---

# TypeScript API 说明书

这里是 `gmkitx` 公共 API 的手写说明书入口。说明书负责解释如何选择入口、参数如何编码、默认值是什么、失败时如何处理，以及完整调用如何组合；逐符号类型定义仍可在 [TypeDoc Reference](/api/typescript/latest/) 中核对。

## 阅读顺序

1. 从 [快速开始](/guide/getting-started.html#typescript) 安装 `gmkitx` 并完成最小验证。
2. 阅读本说明书中的导入方式和公共约定。
3. 按算法进入 SM2、SM3、SM4、ZUC 或 SHA 页面。
4. 排查具体类型或源码签名时使用 [latest TypeDoc](/api/typescript/latest/)；线上版本问题使用相同版本的快照。

## 当前边界

- 公共入口是 `gmkitx` 根导出；不支持从 `src/*` 或 `dist/*` 深度导入。
- 字符串消息默认按 UTF-8 处理，Hex/Base64 字段必须按 API 的格式参数解释。
- TypeScript 包包含 SM2、SM3、SM4、ZUC 和 SHA，不包含 SM9。
- Java 与 TypeScript 独立版本化；同名算法不表示函数签名、异常和对象生命周期相同。

## Reference

- [TypeDoc latest](/api/typescript/latest/)
- [TypeDoc 版本目录](/api/)
- [公开 API 审计清单](/api/public-api.html)
- [公共输入与安全约定](/api/common.html)
