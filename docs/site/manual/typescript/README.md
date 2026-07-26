---
title: TypeScript 使用手册
description: 从安装校验开始，按业务任务使用 gmkitx 0.10.1 的 SM2、SM3、SM4、ZUC 和 SHA-2。
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

本手册只描述 `gmkitx 0.10.1` 已发布行为。一次性密码操作使用带算法前缀的具名导出；类用于保存密钥、配置或增量摘要状态。

## 安装

Node.js 最低版本为 18。依赖锁定文件应与项目一同提交：

```bash
npm install gmkitx@0.10.1
```

<ApiTable label="TypeScript 加载方式" min-width="58rem">

| 环境 | 写法 | 入口文件 | 约束 |
|:--|:--|:--|:--|
| ESM / TypeScript | `import { sm3Digest } from 'gmkitx'` | `dist/index.js` | 包声明 `sideEffects: false`，支持按具名导出使用 |
| CommonJS | `const { sm3Digest } = require('gmkitx')` | `dist/index.cjs` | Node.js 18 及以上 |
| 浏览器脚本 | `GMKit.sm3Digest('abc')` | `dist/index.global.js` | 全局对象名固定为 `GMKit`，页面必须由 HTTPS 提供安全随机源 |

</ApiTable>

浏览器脚本可固定到已发布版本：

```html
<script src="https://cdn.jsdelivr.net/npm/gmkitx@0.10.1/dist/index.global.js"></script>
```

不要深度导入未写入 `exports` 的 `dist/*` 文件。稳定的包入口只有 `gmkitx` 和 `gmkitx/package.json`。

## 首次运行

先检查运行能力、启用严格随机策略，再核对一个固定向量。样例中的 12 字节随机值只验证 CSPRNG 可用；业务代码还要为每个加密协议定义 nonce 的保存和去重方式。

<!-- code-sample id="manual-ts-start" steps="检查运行环境|配置随机源|计算固定向量|非法参数断言" -->
```js
<!-- @include: ../../examples/node/manual-typescript-start.mjs#manual-ts-start -->
```

运行结果：

```text
TypeScript manual start example passed
```

## 开始前固定四条数据规则

1. 业务字符串按 UTF-8 处理；任意二进制使用 `Uint8Array`。
2. key、IV、nonce、公钥、私钥的字符串形式按各 API 规定使用 Hex。
3. 密文、签名和 tag 进入协议时，明确保存 `hex` 或 `base64`，接收端传入对应 `InputFormat`。
4. 正式环境在首次随机操作前调用 `configureRNG('strict')`。没有 CSPRNG 时让进程启动失败，不继续生成密钥、签名或 nonce。

## 按任务阅读

<div class="doc-path-grid">
  <a class="doc-path-card" href="/manual/typescript/data.html"><span class="doc-path-label">基础</span><strong>数据、编码与错误</strong><small>先固定 UTF-8、字节、Hex、Base64 和失败语义。</small></a>
  <a class="doc-path-card" href="/manual/typescript/sm2.html"><span class="doc-path-label">身份与密钥</span><strong>SM2</strong><small>签名验签、小数据加解密、公钥处理和密钥交换。</small></a>
  <a class="doc-path-card" href="/manual/typescript/digest-hmac.html"><span class="doc-path-label">摘要与认证</span><strong>SM3、SHA-2、HMAC</strong><small>固定向量、共享密钥认证和增量摘要。</small></a>
  <a class="doc-path-card" href="/manual/typescript/sm4.html"><span class="doc-path-label">业务数据</span><strong>SM4</strong><small>先完成 GCM，再按既有协议选择 CCM 或非 AEAD 模式。</small></a>
  <a class="doc-path-card" href="/manual/typescript/zuc.html"><span class="doc-path-label">协议指定</span><strong>ZUC</strong><small>密钥流、EEA3、EIA3 和 bitLength。</small></a>
  <a class="doc-path-card" href="/manual/typescript/advanced.html"><span class="doc-path-label">受限环境</span><strong>高级能力</strong><small>自定义 RNG、TextCodec、ASN.1 和低层状态。</small></a>
</div>

## 常用入口

<ApiTable label="TypeScript 常用任务入口" min-width="68rem">

| 任务 | 本手册使用的入口 | 改用类的条件 |
|:--|:--|:--|
| SM2 一次性操作 | `sm2GenerateKeyPair`、`sm2Sign`、`sm2Verify`、`sm2Encrypt`、`sm2Decrypt` | 需要在一个对象中长期持有同一密钥时使用 `SM2` |
| 摘要与 HMAC | `sm3Digest`、`sm3Hmac`、`sha256/384/512`、`hmacSha256/384/512` | 分块输入时使用 `SM3`、`SHA256/384/512` |
| SM4 | `sm4Encrypt`、`sm4Decrypt`、`sm4DecryptBytes` | 固定 key 和 mode 重复调用时使用 `SM4`；每条消息仍须使用新的 nonce |
| ZUC | `zucEncrypt`、`zucDecryptBytes`、`zucKeystream`、`zucKeystreamWords`、`eea3Encrypt`、`eia3` | 固定 key/IV 处理一段会话流时使用 `ZUC` |

</ApiTable>

旧的无前缀别名、输入自动识别、no-Z 签名、SHA-1 和旧 EEA3 密钥流入口不用于新接入，统一见[旧系统迁移](/manual/migration.html)。

## 对接完成条件

- 固定向量通过，运行环境报告符合部署要求。
- 每个外部字符串字段都有明确编码，不依赖内容猜测格式。
- 签名验签同时保存 `userId`、签名结构和外层编码。
- 认证加密同时保存 nonce、AAD 约定、ciphertext、tag、编码和 schema 版本。
- 测试覆盖正确输入、篡改输入和格式非法输入。

具体函数参数与全部重载见 [TypeScript API 说明书](/api/typescript/)。
