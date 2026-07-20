---
title: 导入与分发方式
icon: download
order: 2
category: [开发指南]
tag: [ESM, CommonJS, IIFE, Tree-shaking]
---

# 导入与分发方式

GMKitX 从同一个公共入口输出 ESM、CommonJS、IIFE 和类型声明。新项目优先使用具名 ESM 导入；无算法前缀旧名和默认导出只为已有项目与 CDN 场景保留。

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

if (plain !== 'message' || hash !== '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') {
  throw new Error('ESM distribution check failed');
}
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

CommonJS 同时包含具名导出和 `default` 属性。新代码应直接解构具名导出；`require('gmkitx').default` 仅用于依赖旧默认对象的调用。

## 动态导入

```ts
async function digestOnDemand(input: string) {
  const { sm3Digest } = await import('gmkitx');
  return sm3Digest(input);
}
```

## 浏览器 IIFE

生产页面固定精确版本，不使用浮动 `latest`。下面版本号必须与当前包版本同步：

```html
<script src="https://unpkg.com/gmkitx@<version>/dist/index.global.js"></script>
<script>
  const actual = GMKit.sm3Digest('abc');
  const expected = '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0';
  if (actual !== expected) throw new Error(`SM3 vector mismatch: ${actual}`);
</script>
```

将 `<version>` 替换为 npm 已发布的精确版本。IIFE 同样同时暴露具名属性和 `GMKit.default`；页面应优先调用 `GMKit.sm3Digest`。发布 fixture 会在隔离 VM 中真实执行 `dist/index.global.js`，不只检查文件是否存在。

CDN 加载还应使用 CSP、固定版本和可信供应链策略。SRI 哈希必须针对实际发布文件生成；不要把预发布版本或未经核对的第三方镜像作为长期生产依赖。

## 兼容旧名

`generateKeyPair`、`getPublicKeyFromPrivateKey`、`compressPublicKey`、`decompressPublicKey`、`sign`、`verify`、`keyExchange`、`digest`、`hmac` 继续导出并标记 deprecated。新代码使用带算法前缀的具名函数；正式删除兼容名需要 breaking release 和迁移说明。

## 验证分发格式

```bash
npm run build -w packages/ts
npm run audit:pack -w packages/ts
npm run docs:test-examples --workspace docs/site
```

`gmkit-release.mjs` 会加载 ESM、CommonJS 和 IIFE 三种真实构建产物，验证固定摘要、算法主路径、空 userId 回落及全部旧兼容别名。

- [公开 API 清单](/dev/API-SURFACE.zh-CN)
- [发布流程](/dev/PUBLISHING)
