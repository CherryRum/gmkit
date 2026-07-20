---
title: SHA 系列密码杂凑算法
icon: fingerprint
order: 5
category: [国际算法]
tag: [SHA-1, SHA-256, SHA-384, SHA-512, HMAC]
---

# SHA 系列密码杂凑算法

GMKitX 提供 SHA-1、SHA-256、SHA-384、SHA-512 及 HMAC-SHA-256/384/512。**不提供 SHA-224**。SHA-1 只保留旧协议兼容，新设计使用 SHA-256 或更高版本。

## 固定向量

```ts
import { sha256, sha512 } from 'gmkitx';

const sha256Actual = sha256('abc');
const sha512Actual = sha512('abc');

if (sha256Actual !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') {
  throw new Error(`SHA-256 vector mismatch: ${sha256Actual}`);
}
if (sha512Actual !==
  'ddaf35a193617abacc417349ae204131' +
  '12e6fa4e89a97ea20a9eeee64b55d39a' +
  '2192992a274fc1a836ba3c23a3feebbd' +
  '454d4423643ce80e2a9ac94fa54ca49f') {
  throw new Error(`SHA-512 vector mismatch: ${sha512Actual}`);
}
```

## HMAC 固定向量

```ts
import { hmacSha256, hexToBytes } from 'gmkitx';

const actual = hmacSha256(
  hexToBytes('0b'.repeat(20)),
  'Hi There',
);
const expected = 'b0344c61d8db38535ca8afceaf0bf12b' +
  '881dc200c9833da726e9376c2e32cff7';
if (actual !== expected) {
  throw new Error(`HMAC-SHA-256 vector mismatch: ${actual}`);
}
```

HMAC key 是原始密钥字节，不是 hex 文本时应传 `Uint8Array`。签名 token、Webhook 或协议消息时，双方必须固定输入字节序列和 canonicalization 规则。

## 类 API

`SHA1`、`SHA256`、`SHA384`、`SHA512` 提供对象式入口。对于一次性摘要优先使用具名函数；需要流式处理时使用类 API，并用单测核对分块与一次性结果一致。

## 安全选择

| 用途 | 建议 |
|:--|:--|
| 新协议摘要 | SHA-256/384/512 |
| 有密钥消息认证 | HMAC-SHA-256/384/512 |
| 旧协议校验 | 仅在协议强制时使用 SHA-1，不用于签名和抗碰撞设计 |
| 用户密码存储 | 不使用普通 SHA；选择 Argon2id、scrypt 或 bcrypt |

摘要不是加密，普通摘要也不证明发送者身份。安全敏感场景还需明确密钥管理、消息编码和比较方式。

## 验证

```bash
npm test -w packages/ts -- sha
```

- [国际算法边界](/integrations/web-crypto)
- [安全边界](/guide/security)
