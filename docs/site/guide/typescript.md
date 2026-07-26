---
title: TypeScript 快速入门
description: 安装 gmkitx 0.10.1，检查运行环境、严格随机源和 SM3 固定向量。
pageInfo: false
contributors: false
editLink: false
icon: code
order: 3
category:
  - 使用指南
  - TypeScript
tag:
  - gmkitx
  - Node.js
  - 浏览器
---

# TypeScript 快速入门

这一步只确认 `gmkitx 0.10.1` 能在当前环境正确加载，并具备后续密码操作需要的 UTF-8 与安全随机源。签名、加密和协议字段放在使用手册中逐项完成。

## 1. 安装固定版本

```bash
npm install gmkitx@0.10.1
```

发布包支持 Node.js 18+、ESM、CommonJS 和浏览器 IIFE；TypeScript 声明随包提供。新代码从包根入口使用具名导出，不导入 `dist/*` 或 `src/*`。

<!-- code-reference -->
```ts
// ESM / TypeScript
import { sm3Digest } from 'gmkitx';

// CommonJS
const { sm3Digest: sm3DigestCjs } = require('gmkitx');
```

浏览器脚本地址、全局对象名称、CSP 和受限宿主配置见 [TypeScript 环境与安装](/manual/typescript/)。

## 2. 运行最小验证

把下面的源码保存为 `gmkit-check.mjs`，或直接运行仓库中的同一文件。

<!-- code-sample id="guide-typescript-start" steps="检查运行环境|配置随机源|计算固定向量|非法参数断言" -->
```js
<!-- @include: ../examples/node/manual-typescript-start.mjs#manual-ts-start -->
```

```bash
node gmkit-check.mjs
```

<ApiTable label="TypeScript 最小验证结果" min-width="58rem">

| 检查项 | 通过条件 | 还没有证明什么 |
|:--|:--|:--|
| 包入口 | `gmkitx` 可导入 | bundler、CSP 和浏览器发布配置 |
| UTF-8 环境 | `TextEncoder`、`TextDecoder` 可用 | 任意二进制可以走字符串接口 |
| 严格随机源 | 能取得 12 字节随机值 | nonce 唯一性和密钥生命周期已经管理 |
| SM3 固定向量 | `abc` 得到 `66c7…a8e0` | SM2、SM4 或跨语言协议已经接通 |
| 非法长度 | `getRandomBytes(0)` 抛错 | 所有业务参数都已校验 |

</ApiTable>

## 3. 接着完成业务任务

<div class="doc-path-grid doc-path-grid-compact">
  <a class="doc-path-card" href="/manual/typescript/data.html">
    <span class="doc-path-label">先固定数据</span>
    <strong>UTF-8、字节与编码</strong>
    <small>明确字符串和 Uint8Array 的边界，固定 Hex/Base64 输入格式。</small>
  </a>
  <a class="doc-path-card" href="/manual/typescript/sm2.html">
    <span class="doc-path-label">身份与小数据</span>
    <strong>SM2 签名和加解密</strong>
    <small>使用非空 userId、DER 签名、C1C3C2 密文和 Base64 外层编码。</small>
  </a>
  <a class="doc-path-card" href="/manual/typescript/sm4.html">
    <span class="doc-path-label">业务数据</span>
    <strong>SM4-GCM 认证加密</strong>
    <small>保存 nonce、AAD、ciphertext、tag，并验证篡改一定失败。</small>
  </a>
  <a class="doc-path-card" href="/manual/typescript/digest-hmac.html">
    <span class="doc-path-label">摘要与认证</span>
    <strong>SM3、SHA 与 HMAC</strong>
    <small>区分普通摘要和带共享密钥的消息认证。</small>
  </a>
</div>

需要精确参数和默认值时查 [TypeScript API 说明书](/api/typescript/)；维护旧数据时才进入[旧系统迁移](/manual/migration.html)。

::: warning 上线边界
当前发布包尚未完成独立第三方安全审计。固定向量和示例测试不能替代密钥管理、协议评审、密码产品认证或目标环境安全评估。
:::
