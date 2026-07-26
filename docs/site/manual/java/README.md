---
title: Java 使用手册
description: 按安装、核心类型、密码任务和本地资源学习 GMKit Java 0.10.1 的推荐调用方式。
pageInfo: false
contributors: false
editLink: false
icon: coffee
category:
  - 使用手册
  - Java
tag:
  - Maven
  - Java 8
  - Bouncy Castle
---

# Java 使用手册

本手册面向 `cn.gmkit:gmkit:0.10.1` 和 `cn.gmkit:gmkit-sm9:0.10.1`。SM2、SM4 示例使用实例入口，SM3 使用 `SM3Util`，ZUC 使用静态入口，SM9 通过 `SM9` 门面调用。

## 开始前

- 主包最低支持 Java 8，Bouncy Castle 由 Maven 解析。
- 文本消息默认使用 UTF-8；协议字段使用 `InputFormat`、`OutputFormat` 或显式 codec。
- 容器应用应由启动层决定 Provider 注册策略，并向算法实例传入 `GmSecurityContext`。
- SM9 只在需要时增加独立依赖，所有持有本地句柄的对象都用 try-with-resources。

## 章节

<div class="doc-path-grid">
  <a class="doc-path-card" href="/manual/java/core.html"><span class="doc-path-label">基础</span><strong>核心类型与错误</strong><small>编码、字节、Provider、安全上下文和异常分类。</small></a>
  <a class="doc-path-card" href="/manual/java/sm2.html"><span class="doc-path-label">常用</span><strong>SM2</strong><small>标准 Z 签名、加解密、格式转换和密钥交换。</small></a>
  <a class="doc-path-card" href="/manual/java/sm3.html"><span class="doc-path-label">常用</span><strong>SM3</strong><small>摘要、HMAC、String、byte[] 和 Charset。</small></a>
  <a class="doc-path-card" href="/manual/java/sm4.html"><span class="doc-path-label">常用</span><strong>SM4</strong><small>GCM、AAD、tag、二进制解密和其他模式。</small></a>
  <a class="doc-path-card" href="/manual/java/zuc.html"><span class="doc-path-label">协议指定时使用</span><strong>ZUC</strong><small>密钥流、EEA3、EIA3 和长度单位。</small></a>
  <a class="doc-path-card" href="/manual/java/sm9.html"><span class="doc-path-label">高级</span><strong>SM9</strong><small>平台检查、KGC、身份私钥、IBE、PEM 和句柄。</small></a>
  <a class="doc-path-card" href="/manual/java/hybrid.html"><span class="doc-path-label">高级</span><strong>SM2 + SM4</strong><small>会话 key、GCM 载荷、篡改失败和序列化边界。</small></a>
</div>

## 推荐入口

<ApiTable label="Java 推荐入口" min-width="68rem">

| 任务 | 使用入口 | 原因 |
|:--|:--|:--|
| SM2 | `new SM2(context)` | 明确 Provider 和随机源，签名使用标准 Z |
| SM3 | `SM3Util` | 摘要与 HMAC 是一次性无状态操作 |
| SM4 | `new SM4(context)` | 与 SM2 共用安全上下文，选项集中在 `SM4Options` |
| ZUC | `ZUC` | 当前公开操作均为静态方法 |
| SM9 | `SM9` + 句柄类型 | 门面执行运算，密钥与流式签名对象负责资源生命周期 |

</ApiTable>

