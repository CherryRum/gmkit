---
title: TypeScript 使用手册
description: 按安装、数据、密码任务和高级运行环境学习 gmkitx 0.10.1 的推荐调用方式。
pageInfo: false
contributors: false
editLink: false
icon: code
category:
  - 使用手册
  - TypeScript
tag:
  - gmkitx
  - Node.js
  - 浏览器
---

# TypeScript 使用手册

本手册面向 `gmkitx 0.10.1`。应用代码使用带算法前缀的具名导出；类只在需要保存配置、密钥或增量状态时使用。

## 开始前

- Node.js 最低版本为 18；浏览器需要 ES2020、`TextEncoder`、`TextDecoder` 和安全随机源。
- 消息字符串按 UTF-8 编码；key、IV、nonce 和外部密文字段必须显式声明 Hex 或 Base64。
- 正式环境调用随机操作前启用 `configureRNG('strict')`。
- 新协议不使用无算法前缀别名、默认聚合导出或自动识别输入。

## 章节

<div class="doc-path-grid">
  <a class="doc-path-card" href="/manual/typescript/data.html"><span class="doc-path-label">基础</span><strong>数据、编码与错误</strong><small>UTF-8、字节、Hex、Base64、随机源和失败语义。</small></a>
  <a class="doc-path-card" href="/manual/typescript/sm2.html"><span class="doc-path-label">常用</span><strong>SM2</strong><small>签名验签、加解密、公钥和密钥交换。</small></a>
  <a class="doc-path-card" href="/manual/typescript/digest-hmac.html"><span class="doc-path-label">常用</span><strong>摘要与 HMAC</strong><small>SM3、SHA-2、HMAC 和增量状态。</small></a>
  <a class="doc-path-card" href="/manual/typescript/sm4.html"><span class="doc-path-label">常用</span><strong>SM4</strong><small>GCM、CCM、二进制数据和非 AEAD 模式边界。</small></a>
  <a class="doc-path-card" href="/manual/typescript/zuc.html"><span class="doc-path-label">协议指定时使用</span><strong>ZUC</strong><small>密钥流、EEA3、EIA3 和 bitLength。</small></a>
  <a class="doc-path-card" href="/manual/typescript/advanced.html"><span class="doc-path-label">高级</span><strong>运行环境与低层能力</strong><small>RNG、TextCodec、ASN.1、状态复用和并发。</small></a>
</div>

## 推荐入口

<ApiTable label="TypeScript 推荐入口" min-width="68rem">

| 任务 | 使用入口 | 何时改用类 |
|:--|:--|:--|
| SM2 一次性操作 | `sm2GenerateKeyPair`、`sm2Sign`、`sm2Verify`、`sm2Encrypt`、`sm2Decrypt` | 实例需要长期持有同一密钥时使用 `SM2` |
| 摘要与 HMAC | `sm3Digest`、`sm3Hmac`、`sha256`、`hmacSha256` 等 | 分块输入时使用 `SM3` 或 `SHA256/384/512` |
| SM4 | `sm4Encrypt`、`sm4Decrypt`、`sm4DecryptBytes` | 固定 key 和 mode 重复调用时使用 `SM4`，每次仍须更新 nonce |
| ZUC | `zucEncrypt`、`zucDecryptBytes`、`eea3Encrypt`、`eia3` | 需要固定 key/IV 的对象式入口时使用 `ZUC` |

</ApiTable>

