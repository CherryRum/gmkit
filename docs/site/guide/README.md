---
title: 开始使用
description: 从运行环境、开发语言和业务目标出发，选择 GMKit 的最短接入路径。
pageInfo: false
contributors: false
editLink: false
icon: play
order: 1
category:
  - 开始使用
tag:
  - 快速入门
  - Java
  - TypeScript
---

# 开始使用

GMKit `0.10.1` 分别发布 TypeScript 和 Java 制品。先选语言，跑通固定向量和失败断言，再进入算法说明书确定协议字段。

<div class="quickstart-grid">
  <article class="quickstart-card">
    <code class="quickstart-artifact">gmkitx</code>
    <h2>TypeScript / JavaScript</h2>
    <p>用于浏览器、Node.js 和兼容 ES2020 的 JavaScript 运行环境。</p>
    <a class="quickstart-action" href="/guide/typescript.html">5 分钟开始 <span aria-hidden="true">→</span></a>
  </article>
  <article class="quickstart-card">
    <code class="quickstart-artifact">cn.gmkit:gmkit</code>
    <h2>Java</h2>
    <p>用于 Java 8+ 服务；SM9 按需增加独立制品。</p>
    <a class="quickstart-action" href="/guide/java.html">5 分钟开始 <span aria-hidden="true">→</span></a>
  </article>
</div>

## 四步完成首次接入

<ol class="quickstart-flow">
  <li><strong>安装</strong><span>锁定 <code>0.10.1</code>，只从 npm 或 Maven 发布入口导入。</span></li>
  <li><strong>首次运行</strong><span>完成一次 SM2 签名验签或 SM4-GCM 加解密往返。</span></li>
  <li><strong>固定向量</strong><span>用 SM3 <code>abc</code> 校验依赖、字符编码和输出格式。</span></li>
  <li><strong>失败测试</strong><span>把订单金额改为 <code>99.00</code>，确认篡改消息、AAD、tag 或签名不会通过。</span></li>
</ol>

## 跑通以后

- [算法与协议](/algorithms/)：确定 user ID、mode、padding、IV/nonce、AAD、tag 和长度单位。
- [TypeScript API 说明书](/api/typescript/)：查询 `gmkitx` 的参数、返回值和失败行为。
- [Java API 说明书](/api/java/)：查询主包、SM9 与 SM2 + SM4 混合加密接口。
- [安全边界](/guide/security.html)：上线前检查随机源、密钥生命周期、错误响应和日志脱敏。
- [故障排查](/guide/troubleshooting.html)：按依赖、编码、身份和认证参数定位问题。

::: warning 发布状态
当前 `0.x` 版本允许在变更记录和迁移说明中调整接口。项目尚未完成独立第三方安全审计；固定向量、单元测试和互操作测试不能替代业务协议评审、密码产品认证或目标环境安全评估。
:::
