---
title: 开始使用
description: 从运行环境、开发语言和业务目标出发，选择 GMKit 的最短接入路径。
pageInfo: false
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

<p class="doc-kicker">从能运行，到能正确设计协议</p>

GMKit 当前以 `0.10.1` 版本发布 Java 和 TypeScript 两套独立制品。第一次接入不需要先读完全部算法或 API；先选择运行环境，完成固定向量自检，再把业务所需的编码、模式和安全字段写成明确协议。

<div class="doc-path-grid">
  <a class="doc-path-card" href="/guide/typescript.html">
    <span class="doc-path-label">浏览器 / Node.js</span>
    <strong>TypeScript 快速入门</strong>
    <small>安装 gmkitx，检查随机源，完成 SM2、SM3、SM4 最小闭环。</small>
  </a>
  <a class="doc-path-card" href="/guide/java.html">
    <span class="doc-path-label">Java 8+</span>
    <strong>Java 快速入门</strong>
    <small>引入 Maven 制品，选择实例式或静态式入口，按需启用 SM9。</small>
  </a>
  <a class="doc-path-card" href="/guide/about-guomi.html">
    <span class="doc-path-label">协议设计</span>
    <strong>选择算法与模式</strong>
    <small>固定 userId、编码、密文排列、IV/nonce、AAD、tag 和失败语义。</small>
  </a>
  <a class="doc-path-card" href="/guide/security.html">
    <span class="doc-path-label">上线检查</span>
    <strong>确认安全边界</strong>
    <small>检查随机源、密钥生命周期、认证失败和运行环境限制。</small>
  </a>
</div>

## 建议的首次接入顺序

<ol class="doc-steps">
  <li><strong>5 分钟：环境自检</strong><span>安装精确版本并运行 SM3 <code>abc</code> 固定向量，确认依赖和编码链路正常。</span></li>
  <li><strong>10 分钟：业务闭环</strong><span>按目标语言完成一次签名验签或认证加密往返，并验证篡改输入一定失败。</span></li>
  <li><strong>协议固化</strong><span>把 mode、padding、userId、IV/nonce、AAD、tag、Hex/Base64 与版本写入协议，不依赖自动猜测。</span></li>
  <li><strong>上线评审</strong><span>确认密钥来源、轮换、日志脱敏、错误响应和目标环境安全能力。</span></li>
</ol>

## 按角色阅读

| 角色或任务 | 第一站 | 接下来 |
|:--|:--|:--|
| 前端、Node.js、小程序 | [TypeScript 快速入门](/guide/typescript.html) | [TypeScript API 说明书](/api/typescript/) |
| Java 服务端 | [Java 快速入门](/guide/java.html) | [Java API 说明书](/api/java/) |
| Java 使用 SM9 | [Java 快速入门](/guide/java.html#按需启用-sm9) | [Java SM9 API](/api/java/sm9.html) |
| 设计跨语言报文 | [算法选择与协议设计](/guide/about-guomi.html) | [公共输入约定](/api/common.html) |
| 排查验签或解密失败 | [常见问题与故障排查](/guide/troubleshooting.html) | 对应语言的算法 API 页 |
| 维护或发布新包 | [扩展包接入](/extensions/) | [项目维护](/maintenance/) |

## 文档分层

- **快速入门**回答“怎样安装并完成第一个可验证调用”。
- **算法页**回答“协议字段如何选择，两种语言有哪些差异”。
- **语言 API 说明书**回答“每个公共入口怎样调用、默认值和错误是什么”。
- **TypeDoc/Javadoc**回答“当前版本的逐成员精确签名是什么”。
- **维护与扩展**回答“怎样新增包、版本、文档、测试和不可变 Reference”。

::: warning 发布状态
当前 `0.x` 版本允许在变更记录和迁移说明中调整接口。项目尚未完成独立第三方安全审计；固定向量、单元测试和互操作测试不能替代业务协议评审、密码产品认证或目标环境安全评估。
:::
