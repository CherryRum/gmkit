---
title: 项目维护
description: 面向贡献者说明仓库架构、发布、文档部署、验证证据、性能基准和公共兼容性流程。
icon: tool
category:
  - 项目维护
tag:
  - 发布
  - 文档
  - 验证
---

# 项目维护

本节面向贡献者和发布维护者。所有版本、API、文档和验证结论都应能回到仓库中的单一来源，避免手工复制形成漂移。

## 按任务进入

<div class="doc-path-grid">
  <a class="doc-path-card" href="/maintenance/architecture.html">
    <span class="doc-path-label">理解仓库</span>
    <strong>架构与责任边界</strong>
    <small>确认 packages、apps、docs、vectors 各自承载什么，以及禁止的反向依赖。</small>
  </a>
  <a class="doc-path-card" href="/maintenance/publishing.html">
    <span class="doc-path-label">发布制品</span>
    <strong>版本与发布流程</strong>
    <small>同步 npm、Maven、tag、变更记录和版本化 API Reference。</small>
  </a>
  <a class="doc-path-card" href="/maintenance/documentation-deployment.html">
    <span class="doc-path-label">更新站点</span>
    <strong>文档构建与部署</strong>
    <small>生成 TypeDoc/Javadoc，执行页面、链接、示例和部署产物检查。</small>
  </a>
  <a class="doc-path-card" href="/extensions/package-contract.html">
    <span class="doc-path-label">增加能力</span>
    <strong>扩展包接入契约</strong>
    <small>定义制品隔离、目录登记、说明书、测试证据和版本快照要求。</small>
  </a>
</div>

## 发布前最短路径

1. 阅读[架构说明](/maintenance/architecture.html)，确认变更位于正确的包和目录。
2. 公共 API 变化先更新源码注释、语言说明书、覆盖映射和可执行示例。
3. 执行[发布流程](/maintenance/publishing.html)中的定向检查。
4. 用[发布精简清单](/maintenance/release-audit.html)核对版本、制品内容和变更记录。
5. 按[文档构建与部署](/maintenance/documentation-deployment.html)生成不可变 Reference 并验证站点。

## 验证与证据

- [性能与基准](/maintenance/performance/benchmarks.html)：怎样复现实测数据。
- [性能优化方法](/maintenance/performance/optimization.html)：怎样在不改变协议语义时优化。
- [当前支持范围](/maintenance/reports/support-scope.html)：当前制品、平台和能力边界。
- [验证模型](/maintenance/reports/validation-model.html)：单元测试、固定向量、互操作和外部实现各能证明什么。
- [安全保证边界](/maintenance/reports/security-boundaries.html)：哪些结论不能由测试推出。
- [SM2 兼容策略](/maintenance/reports/sm2-compatibility.html)：密文、签名、公钥与身份字段的兼容原则。

维护文档中的命令必须能在仓库中执行。性能数字需要关联可复现 benchmark；标准结论需要关联标准编号或固定 reference；内部互操作向量不能标成外部标准向量。
