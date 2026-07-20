---
title: 快速开始
icon: play
order: 1
category:
  - 使用指南
tag:
  - 安装
  - TypeScript
---

# 快速开始

## 环境与安装

GMKitX 支持 Node.js 18 及以上版本和具备 ES2020、`TextEncoder`、`TextDecoder` 的现代浏览器。Monorepo 开发与文档构建使用 Node.js 22.12 及以上版本。

```bash
npm install gmkitx
```

安全敏感的服务端或浏览器应用建议在启动时启用严格随机源策略：

```ts
import { configureRNG, getEnvReport, hasCustomRNG } from 'gmkitx';

configureRNG('strict');
const env = getEnvReport();
if (!env.hasWebCrypto && !env.hasNodeCrypto && !hasCustomRNG()) {
  throw new Error('当前运行环境没有可用的 CSPRNG');
}
```

受限小程序环境可保留默认 `warn` 策略，但必须关注警告，并优先通过 `setCustomRNG()` 注入平台安全随机源。默认兼容降级不是密码学安全随机数。

## 最小可验证示例

```ts
import {
  CipherMode,
  PaddingMode,
  bytesToHex,
  getRandomBytes,
  sm2Decrypt,
  sm2Encrypt,
  sm2GenerateKeyPair,
  sm2Sign,
  sm2Verify,
  sm3Digest,
  sm4Decrypt,
  sm4Encrypt,
} from 'gmkitx';

const message = 'GMKitX release check';

const keyPair = sm2GenerateKeyPair();
const sm2Cipher = sm2Encrypt(keyPair.publicKey, message);
if (sm2Decrypt(keyPair.privateKey, sm2Cipher) !== message) {
  throw new Error('SM2 round-trip failed');
}

const signature = sm2Sign(keyPair.privateKey, message);
if (!sm2Verify(keyPair.publicKey, message, signature)) {
  throw new Error('SM2 signature verification failed');
}

const sm3 = sm3Digest('abc');
if (sm3 !== '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') {
  throw new Error(`SM3 vector mismatch: ${sm3}`);
}

const sm4Key = bytesToHex(getRandomBytes(16));
const nonce = bytesToHex(getRandomBytes(12));
const sm4Cipher = sm4Encrypt(sm4Key, message, {
  mode: CipherMode.GCM,
  padding: PaddingMode.NONE,
  iv: nonce,
  aad: 'example-v1',
});
const sm4Plain = sm4Decrypt(sm4Key, sm4Cipher, {
  mode: CipherMode.GCM,
  padding: PaddingMode.NONE,
  iv: nonce,
  aad: 'example-v1',
});
if (sm4Plain !== message) {
  throw new Error('SM4-GCM round-trip failed');
}
```

## 导入方式

推荐使用具名导出，名称能直接表达算法归属，也便于 tree-shaking：

```ts
import { sm2Encrypt, sm3Digest, sm4Encrypt } from 'gmkitx';
```

需要统一组织调用时可以使用算法命名空间：

```ts
import { sm2, sm3, sm4, zuc, sha } from 'gmkitx';

const hash = sm3.digest('message');
const shaHash = sha.sha256('message');
```

旧的 `sign`、`digest`、`generateKeyPair` 等无算法前缀名称仍保留，但已弃用。新代码不要继续依赖这些别名。

## 文本与二进制

字符串输入统一按 UTF-8 编码。解密任意二进制数据时使用字节 API：

- `sm2DecryptBytes`
- `sm4DecryptBytes`
- `zucDecryptBytes`

文本解密 API 会执行 UTF-8 解码，不能无损表示任意字节序列。

## 下一步

- [安全边界](/guide/security)：上线前必须确认的随机源、密钥、nonce 和认证要求。
- [API 清单](/typescript/api-surface)：当前公开导出与兼容别名。
- [共享测试向量](/standards/interop-vectors)：Java/TypeScript 互操作验证方式。
- [算法文档](/algorithms/SM2)：逐算法参数与固定向量。
