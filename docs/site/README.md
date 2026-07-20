---
home: true
title: GMKit 文档
heroText: GMKit
tagline: 按能力查阅 Java、TypeScript、协议约定与扩展包
actions:
  - text: 开始使用
    link: /guide/
    type: primary
  - text: API Reference
    link: /api/
    type: secondary
features:
  - title: 按能力查阅
    details: 每个算法页面同时列出 Java 与 TypeScript 的支持范围、参数默认值、格式差异和可验证示例。
  - title: 按验证证据说明
    details: 固定标准向量、共享互操作向量、单元测试和外部运行时验证分别记录，避免扩大测试结论。
  - title: 为扩展包预留目录
    details: 新工具可以独立登记包、版本、API 入口和测试命令，无需改变现有核心包的使用方式。
footer: Apache-2.0 Licensed | Copyright © 2026 GMKit contributors
---

## 当前发布包

| 发布包 | 当前版本 | 入口 | 当前实现范围 |
|:--|:--|:--|:--|
| `cn.gmkit:gmkit` | `0.10.1` | [安装](/guide/getting-started.html#java) | SM2、SM3、SM4、ZUC |
| `cn.gmkit:gmkit-sm9` | `0.10.1` | [SM9](/algorithms/SM9.html) | Java API 与 JAR 内 JNI/GmSSL 运行库 |
| `gmkitx` | `0.10.1` | [安装](/guide/getting-started.html#typescript) | SM2、SM3、SM4、ZUC、SHA；不包含 SM9 |

::: warning 安全状态
GMKit 当前发布包尚未完成独立第三方安全审计。固定向量和单元测试只能证明已覆盖行为，不能替代密码产品认证、密钥管理设计或目标运行环境的安全评估。
:::

## 阅读路径

- [开始使用](/guide/)：安装发布包并执行最小验证示例。
- [算法](/algorithms/)：按 SM2、SM3、SM4、ZUC、SM9、SHA 查阅两端能力与边界。
- [公共能力](/api/common.html)：查阅编码、随机源、安全上下文、格式与异常约定。
- [API Reference](/api/)：查阅从公开入口生成的 TypeDoc 和 Javadoc。
- [协议与标准](/standards/)：查看输入输出约定、标准来源和测试证据边界。
- [集成示例](/integrations/)：查看 Java、Hutool、Go、Python、Rust 和 Node 示例。
- [扩展包](/extensions/)：了解未来工具包如何接入文档、版本和测试。
- [项目维护](/maintenance/)：查看架构、发布、基准和维护规则。

包版本和入口由 [`catalog/packages.json`](https://github.com/gmkits/gmkit/blob/main/docs/site/catalog/packages.json) 维护。新增能力以实际发布制品和测试结果为准，目录登记不代表安全认证或标准合规结论。

## 文档源码位置

站点源码固定在 `docs/site`；根目录 `docs` 还保存不依赖站点构建的项目级策略文件。算法包只放在 `packages`，应用只放在 `apps`，文档门户不是 npm 或 Maven 发布包。移动源码目录不会改变 `gmkit.cn` 上的页面 URL。
