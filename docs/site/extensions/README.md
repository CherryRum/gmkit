---
title: 扩展包
description: 说明 GMKit 独立扩展包的边界、登记状态、文档入口和从提案到发布的接入流程。
icon: puzzle
category:
  - 扩展包
tag:
  - 扩展
  - 包目录
  - 发布
---

# 扩展包

GMKit 可以在不扩大密码核心包依赖的前提下，增加日期、节假日、农历或其他独立工具能力。本节定义接入机制，不代表这些示例扩展已经实现或发布。

## 当前状态

当前 `catalog/packages.json` 只登记已经发布并具有稳定 tag 的 `gmkitx` 和 GMKit Java。计划中、实验中或没有可验证制品的能力不得提前加入发布目录，也不能出现在首页“当前发布包”表格中。

## 设计原则

| 原则 | 要求 |
|:--|:--|
| 制品隔离 | 使用独立 npm/Maven 坐标；核心算法用户不应下载无关依赖或数据 |
| 版本隔离 | 每个包使用独立 tag 前缀和不可变版本签名路径 |
| 文档齐备 | 同时提供快速入门、手写说明书、生成签名索引、错误与数据边界 |
| 可验证 | 最小示例可执行；外部数据需记录来源、版本、许可证和更新时间 |
| 生命周期明确 | 只有已发布包进入目录；弃用时保留迁移路径与历史版本签名 |
| 不夸大结论 | 目录登记、测试通过和数据导入都不等同于认证或永久准确 |

## 接入路径

<div class="doc-path-grid">
  <a class="doc-path-card" href="/extensions/package-contract.html">
    <span class="doc-path-label">开发与发布</span>
    <strong>扩展包接入契约</strong>
    <small>确定目录结构、制品边界、catalog 字段、版本 tag、测试和生命周期。</small>
  </a>
  <a class="doc-path-card" href="/extensions/documentation-checklist.html">
    <span class="doc-path-label">文档与示例</span>
    <strong>文档交付清单</strong>
    <small>按统一模板补齐入口、元数据、说明书、示例、导航、链接和版本快照。</small>
  </a>
  <a class="doc-path-card" href="/maintenance/publishing.html">
    <span class="doc-path-label">正式发布</span>
    <strong>发布流程</strong>
    <small>同步制品版本、变更记录、tag、版本签名索引和站点部署。</small>
  </a>
  <a class="doc-path-card" href="/maintenance/reports/validation-model.html">
    <span class="doc-path-label">声明能力</span>
    <strong>验证证据模型</strong>
    <small>区分单元测试、固定数据、第三方互操作、审计和认证各自能证明什么。</small>
  </a>
</div>

新增扩展前先阅读[架构说明](/maintenance/architecture.html)。若能力应直接属于现有密码包，应更新对应语言 API 说明书和公共覆盖映射，而不是为规避兼容性规则创建扩展包。
