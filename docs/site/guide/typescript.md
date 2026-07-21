---
title: TypeScript 快速入门
description: 安装 gmkitx，完成环境自检、SM2 签名、SM3 摘要和 SM4-GCM 认证加密。
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

本页面向浏览器、Node.js 和兼容 JavaScript 宿主。公共 API 只从 `gmkitx` 根入口导入；不要依赖 `dist/*` 或仓库 `src/*` 深度路径。

## 安装

```bash
npm install gmkitx@0.10.1
```

包支持 Node.js 18+，同时发布 ESM、CommonJS、浏览器 IIFE 和 TypeScript 声明。Monorepo 的开发与文档构建基线是 Node.js 22.12+，这不改变发布包的 Node.js 18 消费边界。

<!-- code-reference -->
```ts
// ESM / TypeScript，推荐
import { sm3Digest } from 'gmkitx';

// CommonJS
const { sm3Digest: sm3DigestCjs } = require('gmkitx');
```

## 1. 固定向量自检

<!-- code-sample id="guide-typescript-02" steps="计算摘要|固定向量断言" -->
```ts
import { sm3Digest } from 'gmkitx';

// 1. 计算摘要：使用标准输入 abc 计算 SM3。
const actual = sm3Digest('abc');
const expected = '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0';

// 2. 固定向量断言：摘要必须与标准结果完全一致。
if (actual !== expected) {
  throw new Error(`SM3 vector mismatch: ${actual}`);
}
```

这一步验证包入口、UTF-8 和确定性算法结果。它不验证随机源，也不能替代后续的签名和认证加密测试。

## 2. 检查安全随机源

<!-- code-sample id="guide-typescript-03" steps="启用严格随机策略|检查环境" -->
```ts
import { configureRNG, getEnvReport, hasCustomRNG } from 'gmkitx';

// 1. 启用严格随机策略：没有安全随机源时直接失败。
configureRNG('strict');

// 2. 检查环境：Web Crypto、Node Crypto、自定义随机源至少可用一个。
const env = getEnvReport();
if (!env.hasWebCrypto && !env.hasNodeCrypto && !hasCustomRNG()) {
  throw new Error('当前运行环境没有可用的 CSPRNG');
}
```

受限平台应通过 `setCustomRNG()` 注入平台保证的安全随机源。不要在生产环境使用固定种子、测试 RNG 或 `Math.random()`。

## 3. 签名与认证加密闭环

<!-- code-sample id="guide-typescript-04" steps="准备输入|生成 SM2 密钥对|SM2 签名|SM2 验签|SM2 篡改断言|准备 SM4-GCM 参数|SM4-GCM 加密|SM4-GCM 解密|成功断言|构造篡改密文|失败断言" -->
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

// 1. 准备输入：正常订单、篡改订单和签名身份必须明确区分。
const message = 'order=GMKIT-DEMO-0001&amount=88.00';
const changedMessage = 'order=GMKIT-DEMO-0001&amount=99.00';
const userId = 'merchant@gmkit.cn';

// 2. 生成 SM2 密钥对：私钥签名，公钥验签。
const keys = sm2GenerateKeyPair();

// 3. SM2 签名：userId 参与 Z 值计算，签名编码固定为 DER。
const signature = sm2Sign(keys.privateKey, message, {
  userId,
  signatureFormat: 'der',
});

// 4. SM2 验签：原消息和相同 userId 必须验证成功。
if (!sm2Verify(keys.publicKey, message, signature, {
  userId,
  signatureFormat: 'der',
})) {
  throw new Error('SM2 verification failed');
}

// 5. SM2 篡改断言：金额变化后必须验证失败。
if (sm2Verify(keys.publicKey, changedMessage, signature, {
  userId,
  signatureFormat: 'der',
})) {
  throw new Error('tampered order must not verify');
}

// 6. 准备 SM4-GCM 参数：每次加密使用新的 16 字节密钥和 12 字节 nonce。
const key = bytesToHex(getRandomBytes(16));
const nonce = bytesToHex(getRandomBytes(12));
const options = {
  mode: CipherMode.GCM,
  padding: PaddingMode.NONE,
  iv: nonce,
  aad: 'tenant=demo;schema=1',
} as const;

// 7. SM4-GCM 加密：结果包含 ciphertext 和认证 tag。
const encrypted = sm4Encrypt(key, message, options);

// 8. SM4-GCM 解密：必须使用相同的 nonce 与 AAD。
const decrypted = sm4Decrypt(key, encrypted, options);

// 9. 成功断言：解密结果必须等于原文，且 tag 不得缺失。
if (decrypted !== message) {
  throw new Error('SM4-GCM round-trip failed');
}
if (!encrypted.tag) {
  throw new Error('SM4-GCM result is missing its tag');
}

// 10. 构造篡改密文：只修改 tag，其他参数保持不变。
const tampered = {
  ...encrypted,
  tag: `${encrypted.tag[0] === '0' ? '1' : '0'}${encrypted.tag.slice(1)}`,
};
let rejected = false;

// 11. 失败断言：认证失败必须抛错，不能返回未认证明文。
try {
  sm4Decrypt(key, tampered, options);
} catch {
  rejected = true;
}
if (!rejected) {
  throw new Error('tampered GCM tag must be rejected');
}
```

这段代码同时验证正向往返和错误 tag：认证失败时必须抛错，不能返回明文。协议中应同时保存或传输 nonce、AAD 约定、tag、编码和版本；相同 SM4 key 下不得重用 GCM nonce。

## 导入方式怎么选

<ApiTable label="TypeScript 导入方式" min-width="64rem">

| 方式 | 适用场景 | 示例 |
|:--|:--|:--|
| 具名导出 | 默认选择，归属明确且利于 tree-shaking | `sm2Sign`、`sm3Digest` |
| 算法命名空间 | 需要统一注入或分组管理 | `sm2.sign`、`sm4.encrypt` |
| 类 | 保存密钥/配置或使用增量状态 | `SM2`、`SM3`、`SM4`、`SHA256` |
| 默认导出 | IIFE/UMD 和旧整体导入兼容 | `GMKit.sm3Digest` |

</ApiTable>

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
