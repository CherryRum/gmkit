---
title: SM4 分组密码算法
icon: lock
order: 3
category: [国密算法]
tag: [SM4, GCM, CCM, 分组密码]
---

# SM4 分组密码算法

SM4 的密钥和分组长度均为 128 bit。GMKitX 支持 ECB、CBC、CTR、CFB、OFB、GCM 和 CCM。模式、填充、IV/nonce、AAD 与标签长度都是协议字段，不能只传密文后依赖另一端猜测。

## 模式矩阵

| 模式 | IV/nonce | 填充 | 认证 | 建议 |
|:--|:--|:--|:--|:--|
| ECB | 无 | PKCS7/ZERO/NONE | 无 | 只用于固定向量或明确的单块兼容，不用于业务数据 |
| CBC | 16 字节 IV | PKCS7/ZERO/NONE | 无 | 需要另行认证；新协议优先 AEAD |
| CTR/CFB/OFB | 16 字节 IV | 不需要 | 无 | 绝不能在同一 key 下复用 IV |
| GCM | nonce，项目常用 12 字节 | 无 | tag 12-16 字节 | 新协议优先 |
| CCM | nonce | 无 | 偶数 tag 4-16 字节 | nonce 与消息长度受 CCM 约束 |

`ZERO` 填充无法区分明文尾部真实零字节与填充，只能用于已有协议。`PKCS5` 在当前 API 中作为 16 字节分组上的兼容命名，协议文档应写 PKCS7。

## 标准分组向量

```ts
import { CipherMode, PaddingMode, hexToBytes, sm4Encrypt } from 'gmkitx';

const result = sm4Encrypt(
  '0123456789abcdeffedcba9876543210',
  hexToBytes('0123456789abcdeffedcba9876543210'),
  { mode: CipherMode.ECB, padding: PaddingMode.NONE },
);
if (result.ciphertext !== '681edf34d206965e86b3e94f536e4246') {
  throw new Error(`SM4 vector mismatch: ${result.ciphertext}`);
}
```

`sm4Encrypt` 返回结构化结果，普通模式读取 `ciphertext`；GCM/CCM 还必须传输 `tag`。不要把整个对象隐式转成字符串。

## CBC 文本与二进制

```ts
import {
  CipherMode,
  PaddingMode,
  sm4DecryptBytes,
  sm4Encrypt,
} from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210';
const iv = '000102030405060708090a0b0c0d0e0f';
const input = Uint8Array.of(0x00, 0xff, 0x80, 0x41);
const options = { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv };
const encrypted = sm4Encrypt(key, input, options);
const output = sm4DecryptBytes(key, encrypted, options);

if (output.length !== input.length || output.some((value, i) => value !== input[i])) {
  throw new Error('SM4 CBC binary round-trip failed');
}
```

IV 必须不可预测且每条消息唯一。应与密文一起传输，但不能写死或在同一 key 下复用。

## GCM 认证加密

```ts
import { CipherMode, hexToBytes, sm4DecryptBytes, sm4Encrypt } from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210';
const iv = '000102030405060708090a0b';
const aad = new TextEncoder().encode('protocol=v1');
const input = new TextEncoder().encode('authenticated payload');
const result = sm4Encrypt(key, input, {
  mode: CipherMode.GCM,
  iv,
  aad,
  tagLength: 16,
});

if (!result.tag) throw new Error('SM4-GCM did not return a tag');
const output = sm4DecryptBytes(key, result, {
  mode: CipherMode.GCM,
  iv,
  aad,
  tagLength: 16,
  tag: result.tag,
});
if (new TextDecoder().decode(output) !== 'authenticated payload') {
  throw new Error('SM4-GCM round-trip failed');
}
```

协议载荷至少记录 `{ version, algorithm, mode, iv, ciphertext, tag, tagLength }`，AAD 若不是固定协议头也需要可重建。认证失败必须终止处理，不返回部分明文。

## 密钥管理

- key 必须是 16 字节安全随机值；不要截断用户口令、时间戳或 UUID。
- 从口令派生 key 时使用 Argon2id、scrypt 或 PBKDF2 等 KDF，并持久化 salt 与参数。
- 轮换 key 时在密文协议中携带非敏感 key id，不要把 key 放进载荷。
- JavaScript 中无法可靠清除所有复制；减少密钥生命周期和跨层传递。

## 验证

```bash
npm test -w packages/ts -- sm4
npm run parity
```

- [Java 对接](/java/guide)
- [安全边界](/guide/security)
- [性能与基准](/maintenance/performance/benchmarks)
