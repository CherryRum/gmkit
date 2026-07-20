---
title: SM3 密码杂凑算法
description: 对照 Java 与 TypeScript 的 SM3 摘要、HMAC、输出编码和增量状态能力。
icon: fingerprint
order: 2
category: [算法]
tag: [SM3, HMAC, 摘要]
---

# SM3 密码杂凑算法

SM3 接收字节序列并输出 256-bit 摘要。Java 与 TypeScript 都提供一次性摘要和 HMAC-SM3；只有 TypeScript `SM3` 类提供可持续 `update()` 的增量状态。

完整函数、重载、状态与错误说明分别见 [TypeScript SM3 API](/api/typescript/sm3.html) 与 [Java SM3 API](/api/java/sm3.html)。

## API 选择

| 用途 | TypeScript | Java |
|:--|:--|:--|
| 一次性摘要 | `sm3Digest(data, options?)` | `SM3.digest*` 或 `SM3Util.digest*` |
| HMAC-SM3 | `sm3Hmac(key, data, options?)` | `SM3.hmac*` 或 `SM3Util.hmac*` |
| 增量摘要 | `new SM3().update(...).digest()` | 当前主包没有增量 SM3 公共状态机 |
| 输出格式 | `SM3Options.outputFormat`：hex/Base64 | `byte[]`、`digestHex`、`digestBase64` 明确选择 |

TypeScript 还提供 `sm3` 命名空间和 `SM3.digest`/`SM3.hmac` 静态方法。Java `SM3` 是无状态对象入口，`SM3Util` 提供同语义静态方法；不要从类名推断 Java 对象支持 `update()`。

## 输入输出

- 字符串按 UTF-8 转换；协议帧、文件块和压缩数据直接传 `Uint8Array` 或 `byte[]`。
- Hex 为小写 64 字符；Base64 为 32 字节摘要的标准编码。
- 摘要不是加密，也不证明发送者身份。需要共享密钥认证时使用 HMAC-SM3。
- HMAC 的字符串 key 也按 UTF-8；hex key 必须先解码成字节，不能把 hex 字面量当口令使用。

## SM3 固定向量

下面验证 GM/T 0004-2012 中 `abc` 的摘要。

<details open class="language-entry">
<summary><strong>TypeScript</strong></summary>

```ts
import { OutputFormat, sm3Digest } from 'gmkitx';

const expected = '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0';
const hex = sm3Digest('abc');
const base64 = sm3Digest('abc', { outputFormat: OutputFormat.BASE64 });
if (hex !== expected) throw new Error(`SM3 vector mismatch: ${hex}`);
if (base64 !== 'Zsfw9GLu7dnR8tRr3BDk4kFnyHXP9/KinX2gK49LqOA=') {
  throw new Error(`SM3 Base64 vector mismatch: ${base64}`);
}
```

</details>

<details class="language-entry">
<summary><strong>Java</strong></summary>

```java
import cn.gmkit.sm3.SM3Util;

String expected = "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0";
String actual = SM3Util.digestHex("abc");
if (!expected.equals(actual)) {
    throw new IllegalStateException("SM3 vector mismatch: " + actual);
}
if (!"Zsfw9GLu7dnR8tRr3BDk4kFnyHXP9/KinX2gK49LqOA=".equals(
        SM3Util.digestBase64("abc"))) {
    throw new IllegalStateException("SM3 Base64 vector mismatch");
}
```

</details>

空输入的固定摘要为 `1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b`。空消息是合法摘要输入；Java HMAC API 会拒绝 `null` key 或消息，但空数组是否符合业务协议仍应由调用方决定。

## HMAC-SM3 固定向量

该 case 固定 UTF-8 key `secret-key` 与消息 `hmac-payload`，并由 Java Bouncy Castle 与 TypeScript 测试共同验证。

<details open class="language-entry">
<summary><strong>TypeScript</strong></summary>

```ts
import { sm3Hmac } from 'gmkitx';

const actual = sm3Hmac('secret-key', 'hmac-payload');
const expected = 'b57fb50bbc8ad6f9b11129cf1ec67cf0c658f0d4b597ae3f05a64eaa4a22d312';
if (actual !== expected) throw new Error(`HMAC-SM3 mismatch: ${actual}`);
```

</details>

<details class="language-entry">
<summary><strong>Java</strong></summary>

```java
import cn.gmkit.core.Texts;
import cn.gmkit.sm3.SM3Util;

String actual = SM3Util.hmacHex(Texts.utf8("secret-key"), "hmac-payload");
String expected = "b57fb50bbc8ad6f9b11129cf1ec67cf0c658f0d4b597ae3f05a64eaa4a22d312";
if (!expected.equals(actual)) throw new IllegalStateException("HMAC-SM3 mismatch: " + actual);
```

</details>

验证 MAC 时使用 [公共能力](/api/common.html#敏感值比较) 中的比较函数，不使用普通字符串逐字符提前返回的自定义逻辑。JavaScript/JIT 无法给出严格恒时保证，TS `constantTimeEqual` 只避免显式按内容提前退出。

## TypeScript 增量摘要

`SM3.update()` 接受字符串或字节并返回当前实例。`digest()` 输出后自动重置，`reset()` 可主动丢弃当前状态，`setOutputFormat()` 只改变后续输出编码。

```ts
import { SM3, sm3Digest } from 'gmkitx';

const chunks = ['a'.repeat(31), 'b'.repeat(80), 'c'.repeat(7)];
const state = new SM3();
for (const chunk of chunks) state.update(chunk);
if (state.digest() !== sm3Digest(chunks.join(''))) {
  throw new Error('incremental SM3 mismatch');
}
if (state.update('abc').digest() !== sm3Digest('abc')) {
  throw new Error('SM3 state was not reset after digest');
}
```

单个实例不是并发容器。异步任务应各自创建状态，避免不同消息的 chunk 交叉写入。

## 使用边界

- 用户密码存储不能使用一次 SM3；选择带 salt 和成本参数的专用密码哈希。
- 不要构造 `SM3(secret || message)` 代替 HMAC，该结构可能受到长度扩展类问题影响。
- 普通摘要不提供机密性和来源认证。加密数据应使用带认证的加密协议，或按协议组合加密与 MAC。
- HMAC key 应来自安全随机源或经审查的 KDF，不要直接使用短口令。

## 验证依据

- `packages/ts/test/sm3.test.ts`
- `packages/java/gmkit/src/test/java/cn/gmkit/sm3/SM3StandardVectorsTest.java`
- `packages/java/gmkit/src/test/java/cn/gmkit/sm3/SM3ContractsTest.java`
- [共享互操作向量](/standards/interop-vectors)
