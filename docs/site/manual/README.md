---
title: GMKit 使用手册
description: 从安装验证到协议接入和高级能力，按任务学习 GMKit 0.10.1 的 TypeScript 与 Java 用法。
pageInfo: false
contributors: false
editLink: false
icon: book-open
category:
  - 使用手册
tag:
  - TypeScript
  - Java
  - 任务指南
---

# GMKit 使用手册

本手册只描述已发布的 GMKit `0.10.1`。先完成五分钟快速入门，再按业务任务选择语言章节；需要逐成员签名时进入 API 说明书。

## 阅读顺序

<ol class="manual-levels">
  <li><strong>安装验证</strong><span>锁定制品版本，运行 SM3 固定向量，确认包入口和运行环境。</span></li>
  <li><strong>常用任务</strong><span>完成签名验签、认证加密、摘要与 HMAC，并验证篡改失败。</span></li>
  <li><strong>协议接入</strong><span>固定编码、userId、mode、nonce、AAD、tag 和载荷版本。</span></li>
  <li><strong>高级能力</strong><span>按需使用密钥交换、增量状态、Provider、SM9 和混合加密。</span></li>
  <li><strong>旧系统迁移</strong><span>只在维护既有数据时查阅弃用入口和自动识别行为。</span></li>
</ol>

## 选择语言

<div class="doc-path-grid">
  <a class="doc-path-card" href="/manual/typescript/">
    <span class="doc-path-label">gmkitx · 0.10.1</span>
    <strong>TypeScript 使用手册</strong>
    <small>Node.js、浏览器、显式编码、SM2、SM3、SM4、ZUC、SHA 与高级运行环境。</small>
  </a>
  <a class="doc-path-card" href="/manual/java/">
    <span class="doc-path-label">cn.gmkit · 0.10.1</span>
    <strong>Java 使用手册</strong>
    <small>Java 8、Provider、安全上下文、SM2、SM3、SM4、ZUC、SM9 和混合加密。</small>
  </a>
  <a class="doc-path-card" href="/manual/interoperability.html">
    <span class="doc-path-label">Java ↔ TypeScript</span>
    <strong>跨语言协议接入</strong>
    <small>固定 UTF-8、Base64、DER、C1C3C2、GCM 字段和协议版本。</small>
  </a>
  <a class="doc-path-card" href="/manual/migration.html">
    <span class="doc-path-label">仅维护旧系统</span>
    <strong>旧系统迁移</strong>
    <small>查询弃用别名、自动识别、no-Z、SHA-1 和旧 EEA3 入口的替代方案。</small>
  </a>
</div>

## 手册与 API 的分工

<ApiTable label="文档层级分工" min-width="62rem">

| 文档 | 用于解决的问题 | 不承担的内容 |
|:--|:--|:--|
| 快速入门 | 依赖是否安装正确 | 完整协议设计 |
| 使用手册 | 一个业务任务怎样正确完成 | 枚举全部重载 |
| API 说明书 | 参数、返回值、异常和成员签名 | 替应用选择协议 |
| 算法与标准 | 标准字段、算法边界和双语言差异 | 语言调用细节 |
| 迁移手册 | 旧入口如何替换 | 新代码的首选路径 |

</ApiTable>

手册中的随机密文和签名只检查能否解密、验签和拒绝篡改；只有公开固定向量才比较完整 Hex 结果。

