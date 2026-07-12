---
title: 导入与分发方式
icon: download
order: 2
category: [开发指南]
tag: [ESM, CommonJS, IIFE, Tree-shaking]
---

# 导入与分发方式

GMKitX 从同一个公共入口输出 ESM、CommonJS、IIFE 和类型声明。新项目优先具名 ESM 导入；无算法前缀旧名只为兼容保留。

## ESM 具名导入

```ts
import {
  CipherMode,
  sm2GenerateKeyPair,
  sm3Digest,
  sm4Decrypt,
  sm4Encrypt,
} from 'gmkitx';

const keys = sm2GenerateKeyPair();
const hash = sm3Digest('abc');
const key = '0123456789abcdeffedcba9876543210';
const iv = '000102030405060708090a0b0c0d0e0f';
const result = sm4Encrypt(key, 'message', { mode: CipherMode.CBC, iv });
const plain = sm4Decrypt(key, result, { mode: CipherMode.CBC, iv });
```

`sm4Encrypt` 始终返回 `SM4CipherResult`，密文是 `result.ciphertext`；GCM/CCM 还返回 `result.tag`。把整个 result 传给 `sm4Decrypt` 可以保留标签信息。

## 算法命名空间

```ts
import { sha, sm2, sm3, sm4, zuc } from 'gmkitx';

const keys = sm2.generateKeyPair();
const sm3Hex = sm3.digest('message');
const sha256Hex = sha.sha256('message');
```

命名空间是顶层导出对象，不是独立 package subpath；当前 `exports` 只开放 `gmkitx` 和 `gmkitx/package.json`，不要写 `import ... from 'gmkitx/sm2'`。

## CommonJS

```js
const { sm3Digest, sm4Encrypt } = require('gmkitx');

const hash = sm3Digest('abc');
if (hash !== '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') {
  throw new Error(`SM3 vector mismatch: ${hash}`);
}
```

## 动态导入

```ts
async function digestOnDemand(input: string) {
  const { sm3Digest } = await import('gmkitx');
  return sm3Digest(input);
}
```

## 浏览器 IIFE

生产页面固定精确版本，不使用浮动 `latest`：

```html
<script src="https://unpkg.com/gmkitx@0.10.0-preview.1/dist/index.global.js"></script>
<script>
  const actual = GMKit.sm3Digest('abc');
  const expected = '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0';
  if (actual !== expected) throw new Error(`SM3 vector mismatch: ${actual}`);
</script>
```

发布前 IIFE 全局名与文件路径由 `tsup.config.ts` 和 pack 审计确认。CDN 加载还应使用 CSP/SRI 与可信供应链策略；预发布版本不应作为长期生产依赖。

## 兼容旧名

`generateKeyPair`、`sign`、`verify`、`digest`、`hmac` 等旧名继续导出并标记 deprecated。升级不会因这些入口被删除而直接中断；新代码使用 `sm2GenerateKeyPair`、`sm2Sign`、`sm3Digest` 等明确名称。

## 验证分发格式

```bash
npm run build -w packages/ts
npm run audit:pack -w packages/ts
node packages/ts-docs/examples/node/gmkit-release.mjs
```

- [公开 API 清单](/dev/API-SURFACE.zh-CN)
- [发布流程](/dev/PUBLISHING)
