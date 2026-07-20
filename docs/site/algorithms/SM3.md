---
title: SM3 密码杂凑算法
icon: fingerprint
order: 2
category: [国密算法]
tag: [SM3, HMAC, 摘要]
---

# SM3 密码杂凑算法

SM3 接收任意长度字节输入并输出 256-bit 摘要。摘要提供完整性指纹，不提供加密或身份认证；有密钥的消息认证应使用 HMAC-SM3。

## 固定向量

```ts
import { OutputFormat, sm3Digest } from 'gmkitx';

const hex = sm3Digest('abc');
const base64 = sm3Digest('abc', { outputFormat: OutputFormat.BASE64 });

if (hex !== '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') {
  throw new Error(`SM3 vector mismatch: ${hex}`);
}
if (base64 !== 'Zsfw9GLu7dnR8tRr3BDk4kFnyHXP9/KinX2gK49LqOA=') {
  throw new Error(`SM3 Base64 vector mismatch: ${base64}`);
}
```

字符串按 UTF-8 编码。文件、压缩数据和协议帧应直接传 `Uint8Array`，避免隐式文本转换。

## 增量摘要

`SM3` 类维护真实增量状态，适合分块读取文件，不需要把整个输入拼到内存中：

```ts
import { SM3 } from 'gmkitx';

const hash = new SM3();
hash.update('a').update(Uint8Array.of(0x62, 0x63));
const actual = hash.digest();

if (actual !== '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') {
  throw new Error(`incremental SM3 mismatch: ${actual}`);
}
```

调用 `digest()` 后实例会自动重置，可以继续 `update()` 计算下一条独立消息。自动重置属于当前公开行为；并发任务仍应各自创建实例，避免分块数据交叉写入同一状态。

```ts
const reusable = new SM3();
const first = reusable.update('abc').digest();
const second = reusable.update('abc').digest();
if (first !== second) {
  throw new Error('SM3 digest 后没有按约定重置状态');
}
```

## HMAC-SM3

```ts
import { sm3Hmac } from 'gmkitx';

const key = Uint8Array.from({ length: 32 }, (_, index) => index);
const mac = sm3Hmac(key, 'authenticated message');
if (!/^[0-9a-f]{64}$/.test(mac)) {
  throw new Error(`invalid HMAC-SM3 output: ${mac}`);
}
```

HMAC key 应来自安全随机源或经审查的密钥派生流程，不要使用短口令直接作为 key。验证 MAC 时应使用恒时比较能力；本库 `constantTimeEqual` 在 JavaScript 能力范围内尽力减少早退，但运行时无法保证严格常量时间。

## 不适合的用途

- **用户密码存储**：普通 SM3 太快，不能抵抗离线暴力破解。使用 Argon2id、scrypt 或 bcrypt，并按其规范生成 salt 和成本参数。
- **数据加密**：摘要不可逆，但不是加密。需要机密性时使用 SM4-GCM/CCM 等认证加密。
- **无密钥身份认证**：攻击者可以重新计算普通摘要；需要 HMAC 或数字签名。
- **长度扩展敏感协议**：不要设计 `SM3(secret || message)`，使用 HMAC-SM3。

## Java 对照与验证

```java
import cn.gmkit.sm3.SM3Util;

String actual = SM3Util.digestHex("abc");
if (!"66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0".equals(actual)) {
    throw new IllegalStateException("SM3 vector mismatch: " + actual);
}
```

```bash
npm test -w packages/ts -- sm3
npm run parity
```

- [安全边界](/guide/security)
- [Go 对接](/integrations/go)
- [Python 对接](/integrations/python)
- [Rust 对接](/integrations/rust)
