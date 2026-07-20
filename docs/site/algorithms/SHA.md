---
title: SHA 系列密码杂凑算法
icon: fingerprint
order: 6
category: [算法]
tag: [SHA-1, SHA-256, SHA-384, SHA-512, HMAC]
---

# SHA 系列密码杂凑算法

`gmkitx` 提供 SHA-1、SHA-256、SHA-384、SHA-512 与 HMAC-SHA-256/384/512。Java 主包没有 `cn.gmkit.sha` 封装，Java 应直接使用 JDK `MessageDigest` 和 `Mac`。当前两端示例都不包含 SHA-224 或 HMAC-SHA-1 公共入口。

完整函数、选项、增量类和 SHA-1 弃用边界见 [TypeScript SHA API](/api/typescript/sha.html)。

## TypeScript API

| 算法 | 一次性函数 | 增量类 | HMAC |
|:--|:--|:--|:--|
| SHA-1 | `sha1` | `SHA1` | 不提供 |
| SHA-256 | `sha256` | `SHA256` | `hmacSha256` |
| SHA-384 | `sha384` | `SHA384` | `hmacSha384` |
| SHA-512 | `sha512` | `SHA512` | `hmacSha512` |

一次性函数接收字符串或 `Uint8Array`，`SHAOptions.outputFormat` 默认为 hex，可选 Base64。增量类提供 `update`、`digest`、`reset`、`setOutputFormat`、`getOutputFormat`；`digest()` 后自动建立新状态，可继续处理下一条消息。

## `abc` 固定向量

| 算法 | Hex 摘要 |
|:--|:--|
| SHA-1 | `a9993e364706816aba3e25717850c26c9cd0d89d` |
| SHA-256 | `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad` |
| SHA-384 | `cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7` |
| SHA-512 | `ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f` |

<details open class="language-entry">
<summary><strong>TypeScript</strong></summary>

```ts
import { sha1, sha256, sha384, sha512 } from 'gmkitx';

const expected = {
  sha1: 'a9993e364706816aba3e25717850c26c9cd0d89d',
  sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  sha384: 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed' +
    '8086072ba1e7cc2358baeca134c825a7',
  sha512: 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
    '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
};
if (sha1('abc') !== expected.sha1 || sha256('abc') !== expected.sha256 ||
    sha384('abc') !== expected.sha384 || sha512('abc') !== expected.sha512) {
  throw new Error('SHA vector mismatch');
}
```

</details>

<details class="language-entry">
<summary><strong>Java JDK SHA-256</strong></summary>

```java
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

byte[] digest = MessageDigest.getInstance("SHA-256")
    .digest("abc".getBytes(StandardCharsets.UTF_8));
StringBuilder hex = new StringBuilder();
for (byte value : digest) hex.append(String.format("%02x", value & 0xff));
String expected = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
if (!expected.equals(hex.toString())) throw new IllegalStateException("SHA-256 mismatch");
```

</details>

## HMAC-SHA-256 固定向量

下面使用 RFC 4231 test case 1。key 是 20 个 `0x0b` 字节，不是字符串 `"0b0b..."`。

<details open class="language-entry">
<summary><strong>TypeScript</strong></summary>

```ts
import { hexToBytes, hmacSha256 } from 'gmkitx';

const actual = hmacSha256(hexToBytes('0b'.repeat(20)), 'Hi There');
const expected = 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7';
if (actual !== expected) throw new Error(`HMAC-SHA-256 mismatch: ${actual}`);
```

</details>

<details class="language-entry">
<summary><strong>Java JDK HMAC-SHA-256</strong></summary>

```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

byte[] key = new byte[20];
Arrays.fill(key, (byte) 0x0b);
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(key, "HmacSHA256"));
byte[] output = mac.doFinal("Hi There".getBytes(StandardCharsets.US_ASCII));
StringBuilder hex = new StringBuilder();
for (byte value : output) hex.append(String.format("%02x", value & 0xff));
String expected = "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7";
if (!expected.equals(hex.toString())) throw new IllegalStateException("HMAC mismatch");
```

</details>

## 增量摘要

```ts
import { SHA256, sha256 } from 'gmkitx';

const state = new SHA256();
state.update('a').update(Uint8Array.of(0x62, 0x63));
if (state.digest() !== sha256('abc')) throw new Error('incremental SHA-256 mismatch');
if (state.update('abc').digest() !== sha256('abc')) {
  throw new Error('SHA state was not reset after digest');
}
```

不同异步任务不要共享同一增量实例。需要对同一摘要返回两种编码时，应保留原始摘要字节或重新计算，不能连续调用两次 `digest()` 期待第二次返回第一次结果。

## 安全选择

- SHA-1 已存在实际碰撞攻击，只用于协议明确要求的历史兼容，不用于新签名、证书或抗碰撞设计。
- 普通 SHA 不是密码存储算法；用户密码使用 Argon2id、scrypt、bcrypt 等专用方案。
- 普通摘要不认证发送者；共享密钥协议使用 HMAC，并固定消息 canonicalization 和编码。
- HMAC key 使用原始随机字节或 KDF 输出。验证时使用 [敏感值比较](/api/common.html#敏感值比较)。

## 验证依据

- FIPS PUB 180-4
- RFC 4231
- `packages/ts/test/sha.test.ts`
- Java 示例由 JDK 标准 Provider 执行，不属于 `cn.gmkit:gmkit` API。
