---
title: SM4 分组密码算法
icon: lock
order: 3
category: [算法]
tag: [SM4, GCM, CCM, 分组密码]
---

# SM4 分组密码算法

SM4 的密钥和分组长度均为 128 bit。Java 与 TypeScript 当前提供 ECB、CBC、CTR、CFB、OFB、GCM 和 CCM。模式、填充、IV/nonce、AAD、tag 与编码都是协议字段，不能只传密文后由接收端猜测。

## API 选择

| 用途 | TypeScript | Java |
|:--|:--|:--|
| 加密 | `sm4Encrypt(key, data, options?)` | `SM4.encrypt*` 或 `SM4Util.encrypt*` |
| 文本解密 | `sm4Decrypt`，按 UTF-8 返回字符串 | `decryptToUtf8` / `decryptToString` |
| 二进制解密 | `sm4DecryptBytes` | `decrypt` 返回 `byte[]` |
| 密钥生成 | `getRandomBytes(16)` | `SM4.generateKey` / `SM4Util.generateKey` |
| 选项 | `SM4Options`、`SM4DecryptOptions` | `SM4Options.builder()` |
| 结果 | `{ ciphertext, tag?, format }` | `SM4CipherResult` |

TS 与 Java 都保留 ECB + PKCS7 默认值用于旧调用兼容；TS 在省略 mode 时会警告一次。新协议必须显式设置 mode，不应依赖该默认值。

## 模式与参数

| 模式 | IV/nonce | 填充 | 认证标签 |
|:--|:--|:--|:--|
| ECB | 不使用 | PKCS7 / ZERO / NONE | 无 |
| CBC | 16 字节 IV | PKCS7 / ZERO / NONE | 无 |
| CTR / CFB / OFB | 16 字节 IV | 不使用，设置 NONE | 无 |
| GCM | 跨端统一使用 12 字节 nonce | NONE | 12-16 字节，默认 16 |
| CCM | 7-13 字节 nonce | NONE | 4-16 字节偶数，默认 16 |

TypeScript GCM 当前只接受 12 字节 nonce；Java 接受 12-16 字节。跨语言协议必须选双方交集，即 12 字节。`ZERO` 无法区分原文尾部零字节与填充，只用于已有协议。

## 标准分组向量

下面使用 128-bit key 和单个明文分组验证 SM4 基本分组运算，禁用填充。

<details open class="language-entry">
<summary><strong>TypeScript</strong></summary>

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

</details>

<details class="language-entry">
<summary><strong>Java</strong></summary>

```java
import cn.gmkit.core.*;
import cn.gmkit.sm4.*;

byte[] key = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "key");
byte[] input = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "plaintext");
SM4Options options = SM4Options.builder()
    .mode(SM4CipherMode.ECB).padding(SM4Padding.NONE).build();
String actual = new SM4().encrypt(key, input, options).ciphertextHex();
if (!"681edf34d206965e86b3e94f536e4246".equals(actual)) {
    throw new IllegalStateException("SM4 vector mismatch: " + actual);
}
```

</details>

## GCM 认证加密

GCM/CCM 返回密文和独立 tag。解密必须使用加密时相同的 key、nonce、AAD 和 tag 长度；tag 校验失败时不得返回部分明文。

<details open class="language-entry">
<summary><strong>TypeScript</strong></summary>

```ts
import { CipherMode, PaddingMode, sm4DecryptBytes, sm4Encrypt } from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210';
const nonce = '000102030405060708090a0b';
const aad = new TextEncoder().encode('protocol=v1');
const input = new TextEncoder().encode('authenticated payload');
const result = sm4Encrypt(key, input, {
  mode: CipherMode.GCM,
  padding: PaddingMode.NONE,
  iv: nonce,
  aad,
  tagLength: 16,
});
if (!result.tag) throw new Error('missing SM4-GCM tag');
const output = sm4DecryptBytes(key, result, {
  mode: CipherMode.GCM,
  padding: PaddingMode.NONE,
  iv: nonce,
  aad,
  tagLength: 16,
});
if (new TextDecoder().decode(output) !== 'authenticated payload') {
  throw new Error('SM4-GCM round-trip failed');
}
```

</details>

<details class="language-entry">
<summary><strong>Java</strong></summary>

```java
import cn.gmkit.core.*;
import cn.gmkit.sm4.*;

byte[] key = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "key");
byte[] nonce = HexCodec.decodeStrict("000102030405060708090a0b", "nonce");
byte[] aad = Texts.utf8("protocol=v1");
SM4Options options = SM4Options.builder()
    .mode(SM4CipherMode.GCM)
    .padding(SM4Padding.NONE)
    .iv(nonce).aad(aad).tagLength(16).build();
SM4 sm4 = new SM4();
SM4CipherResult result = sm4.encrypt(key, Texts.utf8("authenticated payload"), options);
String output = sm4.decryptToUtf8(key, result, options);
if (!"authenticated payload".equals(output)) {
    throw new IllegalStateException("SM4-GCM round-trip failed");
}
```

</details>

Java 传入整个 `SM4CipherResult` 时会把 result 中的 tag 合入解密选项；若只传密文字节，则需在 `SM4Options.tag(...)` 中显式提供 tag。TypeScript 也可以单独设置 `tag`/`tagFormat`，但直接传完整结果更不易漏字段。

## 结果与协议载荷

普通模式只产生 ciphertext；GCM/CCM 同时产生 tag。建议协议至少固定：

```json
{
  "version": 1,
  "algorithm": "SM4",
  "mode": "GCM",
  "encoding": "base64",
  "nonce": "...",
  "ciphertext": "...",
  "tag": "...",
  "tagLength": 16,
  "keyId": "non-secret-key-reference"
}
```

AAD 若来自协议头，应能在接收端无歧义重建；若是动态数据，应随载荷保存或通过上层协议固定。key 不得写入载荷。

## 密钥、IV 与错误边界

- key 必须是 16 字节。不要截断口令、时间戳、UUID 或摘要来充当 key。
- CBC 的 IV 应不可预测且每条消息唯一；CTR/CFB/OFB/GCM/CCM 在同一 key 下不得复用 IV/nonce。
- ECB 泄露相同明文分组模式，只用于固定向量或已有单块协议。
- CBC/CTR/CFB/OFB 只提供机密性；需要另行认证，或改用 GCM/CCM。
- NONE 下 ECB/CBC 输入必须是 16 字节倍数；流式与 AEAD 模式不使用分组填充。
- 非法 key/IV 长度、非法 tag 长度、缺少 tag、错误 AAD 和认证失败都会抛错；调用方不得忽略后继续处理输出。

## Java 安全上下文

`new SM4()` 使用 `GmSecurityContexts.defaults()`。需要固定 Provider 或注入 `SecureRandom` 时创建 `GmSecurityContext`，再传给 `SM4` 构造器或 `SM4Options.securityContext(...)`。Provider 注册策略见 [公共能力](/api/common.html#java-安全上下文)。

## 验证依据

- `packages/ts/test/sm4.test.ts`
- `packages/java/gmkit/src/test/java/cn/gmkit/sm4/SM4StandardVectorsTest.java`
- [共享互操作向量](/standards/interop-vectors)
- `npm run parity`
