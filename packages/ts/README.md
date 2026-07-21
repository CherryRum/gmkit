# GMKitX

`gmkitx` 是 GMKit 的 TypeScript/JavaScript 包，提供 SM2、SM3、SM4、ZUC、SHA 和 HMAC。公共 API 的参数、默认值、编码、异常、安全边界和可运行示例统一维护在 [TypeScript API 说明书](https://gmkit.cn/api/typescript/)。

> 当前 `0.x` 版本是公开测试版，尚未完成独立第三方安全审计。生产接入前请评估密钥管理、随机源、nonce、协议编码和合规要求。

## 安装

```bash
npm install gmkitx
```

运行环境为 Node.js 18+ 或具备 ES2020、`TextEncoder`、`TextDecoder` 的现代浏览器。包同时提供 ESM、CommonJS、IIFE 和类型声明；新代码推荐从包根入口使用具名导出，不要深度导入 `dist/*` 或 `src/*`。

## 快速开始

```ts
import {
  CipherMode,
  SM2,
  SM4,
  configureRNG,
  sm3Digest,
} from 'gmkitx';

// 安全环境建议禁止退回非密码学随机源。
configureRNG('strict');

const message = 'order=GMKIT-DEMO-0001&amount=88.00';
const changedMessage = 'order=GMKIT-DEMO-0001&amount=99.00';
const userId = 'merchant@gmkit.cn';
const aad = 'tenant=demo;schema=1';

const sm2 = SM2.generateKeyPair();
const signature = sm2.sign(message, {
  signatureFormat: 'der',
  userId,
});
if (!sm2.verify(message, signature, {
  signatureFormat: 'der',
  userId,
})) {
  throw new Error('SM2 verification failed');
}
if (sm2.verify(changedMessage, signature, { signatureFormat: 'der', userId })) {
  throw new Error('tampered order must not verify');
}

const sm4 = SM4.GCM(
  '0123456789abcdeffedcba9876543210',
  '000102030405060708090a0b',
);
const encrypted = sm4.encrypt(message, {
  mode: CipherMode.GCM,
  aad,
});
if (sm4.decrypt(encrypted, { aad }) !== message) {
  throw new Error('SM4-GCM round-trip failed');
}

if (sm3Digest('abc') !==
    '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') {
  throw new Error('SM3 vector mismatch');
}
```

## 文档

- [TypeScript API 说明书](https://gmkit.cn/api/typescript/)：按 common、SM2、SM3、SM4、ZUC、SHA 分页说明全部公共导出。
- [已发布版本签名索引](https://gmkit.cn/api/#已发布版本签名索引)：核对与 npm 制品相同版本的逐成员签名。
- [跨语言算法与协议](https://gmkit.cn/algorithms/)：Java/TypeScript 默认值和协议差异。
- [安全边界](https://gmkit.cn/guide/security.html)：上线前检查随机源、密钥、IV/nonce、认证和错误处理。

## 本地验证

```bash
npm ci
npm run verify -w packages/ts
```

Apache License 2.0，见 [LICENSE](LICENSE)。第三方版权与许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
