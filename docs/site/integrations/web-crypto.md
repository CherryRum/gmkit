---
title: 国际算法与 Web Crypto 边界
description: 区分浏览器 Web Crypto 的 SHA、AES、RSA 能力与 gmkitx 国密算法职责。
icon: globe
order: 8
category: [集成示例, Web Crypto]
tag: [SHA, AES-GCM, RSA-OAEP, Web Crypto]
---

# 国际算法与 Web Crypto 边界

GMKitX 只提供 SHA-1/256/384/512 和对应 HMAC；**不提供 AES、RSA、ECDSA、PBKDF2 的 gmkitx API**。浏览器和现代 Node.js 的 AES/RSA 示例应使用 Web Crypto，且不能写成看似来自 `gmkitx` 的导入。

## 能力来源

| 能力 | 实现来源 |
|:--|:--|
| SHA/HMAC-SHA | `gmkitx` 或 Web Crypto |
| AES-GCM | Web Crypto `crypto.subtle` |
| RSA-OAEP | Web Crypto `crypto.subtle` |
| SM2/SM3/SM4/ZUC | `gmkitx` |

仓库 `docs/site/examples/node/international-crypto.mjs` 会真实运行 AES-GCM 与 RSA-OAEP 往返：

```bash
node docs/site/examples/node/international-crypto.mjs
```

## AES-GCM

<!-- code-sample id="integrations-web-crypto-01" steps="准备参数|导入密钥|准备明文|AES-GCM 加密|AES-GCM 解密|成功断言" -->
```js
// 1. 准备参数：生成 256-bit AES key 原始字节。
const encoder = new TextEncoder();
const keyBytes = crypto.getRandomValues(new Uint8Array(32));

// 2. 导入密钥：限制该 CryptoKey 只能用于 AES-GCM 加解密。
const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);

// 3. 准备明文：为本次加密生成 12 字节随机 IV。
const iv = crypto.getRandomValues(new Uint8Array(12));
const plaintext = encoder.encode('authenticated payload');

// 4. AES-GCM 加密：返回 ciphertext || tag 的组合结果。
const ciphertextWithTag = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv, tagLength: 128 },
  key,
  plaintext,
);

// 5. AES-GCM 解密：使用相同 key、IV 和 tag 长度恢复明文。
const decrypted = await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv, tagLength: 128 },
  key,
  ciphertextWithTag,
);

// 6. 成功断言：解密文本必须与加密前一致。
if (new TextDecoder().decode(decrypted) !== 'authenticated payload') {
  throw new Error('AES-GCM round-trip failed');
}
```

Web Crypto 将 GCM tag 附在密文尾部。跨语言协议必须固定这个布局，或者显式拆分 tag。IV 在同一 key 下必须唯一，随机 12 字节是常见选择但仍需有碰撞与密钥轮换策略。

## RSA-OAEP

<!-- code-sample id="integrations-web-crypto-02" steps="生成密钥|准备明文|RSA-OAEP 加密|RSA-OAEP 解密|成功断言" -->
```js
// 1. 生成密钥：创建只用于 RSA-OAEP 加解密的 2048-bit 密钥对。
const keys = await crypto.subtle.generateKey(
  {
    name: 'RSA-OAEP',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  },
  false,
  ['encrypt', 'decrypt'],
);

// 2. 准备明文：RSA-OAEP 只封装短小的会话密钥数据。
const plaintext = new TextEncoder().encode('session key');

// 3. RSA-OAEP 加密：使用公钥封装会话密钥。
const ciphertext = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, keys.publicKey, plaintext);

// 4. RSA-OAEP 解密：使用匹配的私钥恢复会话密钥。
const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, keys.privateKey, ciphertext);

// 5. 成功断言：恢复结果必须与原会话密钥一致。
if (new TextDecoder().decode(decrypted) !== 'session key') {
  throw new Error('RSA-OAEP round-trip failed');
}
```

RSA-OAEP 只能加密小消息，通常用于封装随机会话密钥；大数据使用 AES-GCM/SM4-GCM 等 AEAD。签名使用 RSA-PSS 或标准要求的签名方案，不能用 RSA-OAEP。

## 密码和 KDF

用户口令不能直接当 AES key，也不能用一次 SHA/SM3 截断得到 key。口令派生应选择 Argon2id、scrypt 或在协议要求下使用足够成本的 PBKDF2，并传输 salt、算法和参数。用户密码存储优先密码哈希，不要改造成可解密 AES 密文。

## 测试边界

本页 Node fixture 在 CI 中验证 API 可运行和往返正确；它不替代 Web Crypto 实现自身的安全认证，也不证明你的密钥生命周期、nonce 管理和载荷协议正确。生产协议还需测试密文/tag/AAD 篡改均被拒绝。
