---
title: TypeScript 快速入门
description: 安装 gmkitx，完成环境自检、SM2 签名、SM3 摘要和 SM4-GCM 认证加密。
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

本页面向浏览器、Node.js 和兼容 JavaScript 宿主。公共 API 只从 `gmkitx` 根入口导入；不要依赖 `dist/*` 或仓库 `src/*` 深度路径。

## 安装

```bash
npm install gmkitx@0.10.1
```

包支持 Node.js 18+，同时发布 ESM、CommonJS、浏览器 IIFE 和 TypeScript 声明。Monorepo 的开发与文档构建基线是 Node.js 22.12+，这不改变发布包的 Node.js 18 消费边界。

```ts
// ESM / TypeScript，推荐
import { sm3Digest } from 'gmkitx';

// CommonJS
const { sm3Digest: sm3DigestCjs } = require('gmkitx');
```

## 1. 固定向量自检

```ts
import { sm3Digest } from 'gmkitx';

const actual = sm3Digest('abc');
const expected = '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0';
if (actual !== expected) {
  throw new Error(`SM3 vector mismatch: ${actual}`);
}
```

这一步验证包入口、UTF-8 和确定性算法结果。它不验证随机源，也不能替代后续的签名和认证加密测试。

## 2. 检查安全随机源

```ts
import { configureRNG, getEnvReport, hasCustomRNG } from 'gmkitx';

configureRNG('strict');
const env = getEnvReport();
if (!env.hasWebCrypto && !env.hasNodeCrypto && !hasCustomRNG()) {
  throw new Error('当前运行环境没有可用的 CSPRNG');
}
```

受限平台应通过 `setCustomRNG()` 注入平台保证的安全随机源。不要在生产环境使用固定种子、测试 RNG 或 `Math.random()`。

## 3. 签名与认证加密闭环

```ts
import {
  CipherMode,
  PaddingMode,
  bytesToHex,
  getRandomBytes,
  sm2GenerateKeyPair,
  sm2Sign,
  sm2Verify,
  sm4Decrypt,
  sm4Encrypt,
} from 'gmkitx';

const message = 'GMKitX quick start';

const keys = sm2GenerateKeyPair();
const signature = sm2Sign(keys.privateKey, message, {
  userId: 'quick-start@example',
  signatureFormat: 'der',
});
if (!sm2Verify(keys.publicKey, message, signature, {
  userId: 'quick-start@example',
  signatureFormat: 'der',
})) {
  throw new Error('SM2 verification failed');
}

const key = bytesToHex(getRandomBytes(16));
const nonce = bytesToHex(getRandomBytes(12));
const options = {
  mode: CipherMode.GCM,
  padding: PaddingMode.NONE,
  iv: nonce,
  aad: 'gmkit-quick-start-v1',
} as const;
const encrypted = sm4Encrypt(key, message, options);
if (sm4Decrypt(key, encrypted, options) !== message) {
  throw new Error('SM4-GCM round-trip failed');
}
```

协议中必须同时保存或传输 nonce、AAD 约定、tag、编码和版本。相同 SM4 key 下不得重用 GCM nonce。

## 导入方式怎么选

| 方式 | 适用场景 | 示例 |
|:--|:--|:--|
| 具名导出 | 默认选择，归属明确且利于 tree-shaking | `sm2Sign`、`sm3Digest` |
| 算法命名空间 | 需要统一注入或分组管理 | `sm2.sign`、`sm4.encrypt` |
| 类 | 保存密钥/配置或使用增量状态 | `SM2`、`SM3`、`SM4`、`SHA256` |
| 默认导出 | IIFE/UMD 和旧整体导入兼容 | `GMKit.sm3Digest` |

旧的 `sign`、`digest`、`generateKeyPair` 等无算法前缀名称已弃用，新代码不要继续引入。

## 文本与二进制

- `string` 消息按 UTF-8 编码。
- 图片、压缩包、协议帧等任意二进制使用 `Uint8Array`。
- 二进制解密使用 `sm2DecryptBytes`、`sm4DecryptBytes` 或 `zucDecryptBytes`。
- 密钥、IV、nonce 和密文字符串的 Hex/Base64 语义以具体参数和 `InputFormat` 为准。

## 接下来

- [TypeScript API 说明书](/api/typescript/)
- [TypeScript 公共类型与工具](/api/typescript/common.html)
- [算法与协议能力](/algorithms/)
- [常见问题与故障排查](/guide/troubleshooting.html)
- [安全边界](/guide/security.html)
