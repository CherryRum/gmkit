---
title: 快速开始总览
description: 在接入 GMKit 前完成语言选择、环境确认、固定向量自检和协议字段检查。
icon: route
order: 2
category:
  - 使用指南
tag:
  - 安装
  - 环境检查
  - 接入流程
---

# 快速开始总览

GMKit 的 Java 与 TypeScript 制品独立发布。两端可以通过共享向量核对协议字段，但包名、函数签名、异常类型和运行时依赖并不相同。

## 先做三个选择

| 问题 | 选择 |
|:--|:--|
| 代码运行在哪里？ | 浏览器、Node.js、小程序进入 [TypeScript 快速入门](/guide/typescript.html)；JVM 服务进入 [Java 快速入门](/guide/java.html) |
| 要解决什么问题？ | 签名/公钥加密看 SM2；摘要/HMAC 看 SM3；认证加密看 SM4-GCM/CCM；3GPP 场景看 ZUC；Java 标识密码看 SM9 |
| 是否需要跨语言互操作？ | 需要时先固定协议字段，再使用 [共享互操作向量](/standards/interop-vectors.html) 验证，不从相似 API 名称推断兼容 |

## 运行环境矩阵

| 环境 | 制品 | 最低基线 | 额外检查 |
|:--|:--|:--|:--|
| Node.js | `gmkitx@0.10.1` | Node.js 18 | ESM/CJS 入口、安全随机源 |
| 现代浏览器 | `gmkitx@0.10.1` | ES2020、TextEncoder/TextDecoder | Web Crypto、CSP、XSS 与密钥暴露 |
| 受限小程序 | `gmkitx@0.10.1` | 兼容 ES2020 语义 | 注入平台 CSPRNG，必要时注入 UTF-8 codec |
| Java 服务 | `cn.gmkit:gmkit:0.10.1` | Java 8 | Bouncy Castle Provider、SecureRandom |
| Java + SM9 | `cn.gmkit:gmkit-sm9:0.10.1` | Java 8 + 受支持平台 | JNI/GmSSL 可用性和句柄关闭 |

## 第一个验收标准

接入完成不能只以“可以 import”或“没有抛异常”为准。至少同时满足：

1. SM3 `abc` 固定向量得到 `66c7f0f4...8f4ba8e0`。
2. 一次随机操作能够往返或验签成功。
3. 修改消息、AAD、tag 或签名后，认证一定失败。
4. 文本与任意二进制分别走 UTF-8 API 和字节 API。
5. 使用的依赖版本、mode、编码和身份字段已经写入应用协议或配置。

## 选择语言

<div class="doc-path-grid doc-path-grid-compact">
  <a class="doc-path-card" href="/guide/typescript.html">
    <span class="doc-path-label">gmkitx 0.10.1</span>
    <strong>TypeScript / JavaScript</strong>
    <small>具名导出、命名空间、类、ESM/CJS/IIFE、RNG 与二进制 API。</small>
  </a>
  <a class="doc-path-card" href="/guide/java.html">
    <span class="doc-path-label">cn.gmkit 0.10.1</span>
    <strong>Java</strong>
    <small>Maven、实例式/静态式 API、Provider、安全上下文、SM9 native。</small>
  </a>
</div>

## 上线前的下一步

- [算法选择与协议设计](/guide/about-guomi.html)：确定算法、模式和跨端字段。
- [安全边界](/guide/security.html)：检查密钥、nonce、认证和运行环境。
- [常见问题与故障排查](/guide/troubleshooting.html)：排查安装、编码、验签和 AEAD 错误。
- [公共输入约定](/api/common.html)：统一 Hex、Base64、UTF-8、随机源和异常语义。
