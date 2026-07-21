---
home: true
title: GMKit 文档
description: GMKit Java 与 TypeScript 的快速入门、算法协议、公共 API、集成和维护文档。
heroText: GMKit
tagline: 按能力查阅 Java、TypeScript、协议约定与扩展包
actions:
  - text: TypeScript API 说明书
    link: /api/typescript/
    type: primary
  - text: Java API 说明书
    link: /api/java/
    type: primary
  - text: 开始使用
    link: /guide/
    type: secondary
features:
  - title: 按能力查阅
    details: 算法页说明协议差异，语言说明书列出签名、默认值、失败行为和可执行断言。
  - title: 区分验证证据
    details: 固定向量、互操作测试、单元测试和运行时验证分别记录，不混用结论。
  - title: 版本可核对
    details: 当前说明书面向使用场景；历史签名按已发布 npm 或 Maven 版本保存。
---

## 当前发布包

<ApiTable label="GMKit 当前发布包" min-width="68rem">

| 发布包 | 当前版本 | 入口 | 当前实现范围 |
|:--|:--|:--|:--|
| `cn.gmkit:gmkit` | `0.10.1` | [安装](/guide/java.html) | SM2、SM3、SM4、ZUC |
| `cn.gmkit:gmkit-sm9` | `0.10.1` | [SM9](/algorithms/SM9.html) | Java API 与 JAR 内 JNI/GmSSL 运行库 |
| `gmkitx` | `0.10.1` | [安装](/guide/typescript.html) | SM2、SM3、SM4、ZUC、SHA；不包含 SM9 |

</ApiTable>

::: warning 安全状态
GMKit 当前发布包尚未完成独立第三方安全审计。固定向量和单元测试只能证明已覆盖行为，不能替代密码产品认证、密钥管理设计或目标运行环境的安全评估。
:::

## 选择接入路径

<div class="doc-path-grid">
  <a class="doc-path-card" href="/guide/typescript.html">
    <span class="doc-path-label">浏览器 / Node.js</span>
    <strong>安装 gmkitx</strong>
    <small>先运行固定向量，再完成 SM2 签名与 SM4-GCM 认证加密闭环。</small>
  </a>
  <a class="doc-path-card" href="/guide/java.html">
    <span class="doc-path-label">Java 8+</span>
    <strong>安装 Maven 制品</strong>
    <small>选择实例式或静态式入口，配置 Provider，并按需启用 SM9。</small>
  </a>
  <a class="doc-path-card" href="/guide/troubleshooting.html">
    <span class="doc-path-label">调用失败</span>
    <strong>按症状排查</strong>
    <small>从依赖、编码、SM2 字段、AEAD 参数、随机源和本地动态库逐层定位。</small>
  </a>
  <a class="doc-path-card" href="/api/">
    <span class="doc-path-label">查 API</span>
    <strong>进入双语言说明书</strong>
    <small>先看可操作的手写说明，再按版本进入 TypeDoc 或 Javadoc 精确签名。</small>
  </a>
</div>

## 阅读路径

- [开始使用](/guide/)：安装发布包并执行最小验证示例。
- [算法](/algorithms/)：按 SM2、SM3、SM4、ZUC、SM9、SHA 查阅两端能力与边界。
- [TypeScript API 说明书](/api/typescript/)：逐项查阅 121 个根导出、默认值、错误和可运行示例。
- [Java API 说明书](/api/java/)：逐项查阅 46 个公共顶层类型、重载、Builder 和资源生命周期。
- [公共约定](/api/common.html)：查阅编码、随机源、安全上下文、格式与异常约定。
- [API 总入口](/api/)：选择语言说明书或已发布版本签名索引。
- [协议与标准](/standards/)：查看输入输出约定、标准来源和测试证据边界。
- [集成示例](/integrations/)：查看 Java、Hutool、Go、Python、Rust 和 Node 示例。
- [扩展包](/extensions/)：了解未来工具包如何接入文档、版本和测试。
- [项目维护](/maintenance/)：查看架构、发布、基准和维护规则。

包版本和入口由 [`catalog/packages.json`](https://github.com/gmkits/gmkit/blob/main/docs/site/catalog/packages.json) 维护。新增能力以实际发布制品和测试结果为准，目录登记不代表安全认证或标准合规结论。

## 文档源码位置

站点源码固定在 `docs/site`；根目录 `docs` 还保存不依赖站点构建的项目级策略文件。算法包只放在 `packages`，应用只放在 `apps`，文档门户不是 npm 或 Maven 发布包。移动源码目录不会改变 `gmkit.cn` 上的页面 URL。
