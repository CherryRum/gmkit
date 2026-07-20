---
title: ZUC 祖冲之序列密码算法
description: 对照 Java 与 TypeScript 的 ZUC-128、EEA3、EIA3 及 byte、word、bit 单位。
icon: stream
order: 4
category: [算法]
tag: [ZUC, EEA3, EIA3]
---

# ZUC 祖冲之序列密码算法

Java 与 TypeScript 都实现 ZUC-128 密钥流、3GPP 128-EEA3 机密性算法和 128-EIA3 完整性算法。当前不提供 ZUC-256。

完整函数、重载、底层状态和长度单位分别见 [TypeScript ZUC API](/api/typescript/zuc.html) 与 [Java ZUC API](/api/java/zuc.html)。

## API 与长度单位

| 用途 | TypeScript | Java | 长度单位 / 返回值 |
|:--|:--|:--|:--|
| 字节密钥流 | `zucKeystream` | `ZUC.keystream` / `keystreamHex` | length 为 byte |
| 32-bit 字密钥流 | `zucKeystreamWords` | `keystreamWords` / `keystreamWordsHex` | length 为 word；TS 高层返回 hex，Java 可返回 `int[]` |
| 原始字数组 | `zucGenerateKeystream` | `keystreamWords` | TS 返回 `Uint32Array`，Java 返回 `int[]` |
| 通用流加密 | `zucEncrypt`、`zucDecryptBytes` | `encrypt`、`decrypt` | 输入按 byte |
| 旧 EEA3 密钥流 | `eea3` | `eea3` | length 为 bit，返回向上取整到 word 的 hex |
| EEA3 消息加密 | `eea3Encrypt` | `eea3Encrypt` | bitLength 为消息有效 bit 数 |
| EIA3 MAC-I | `eia3` | `eia3` | 输出 32-bit MAC-I，8 个 hex 字符 |

TypeScript 另有 `ZUC` 对象式入口和 `ZUCState` 底层状态；Java `ZUC` 与 `ZUCUtil` 都是静态入口。跨语言代码不要把 `zucKeystreamWords` 的 hex 字符串误当成整数数组。

## 参数边界

- ZUC key 与通用 IV 均固定 16 字节，可使用字节数组或 32 个 hex 字符。
- COUNT 是 32-bit 整数；BEARER 范围为 0-31；DIRECTION 只能是 0 或 1。
- `bitLength` 不得超过输入字节实际承载的 bit 数。非整字节 EEA3 输出的末字节未使用低位会清零。
- 字符串消息按 UTF-8。3GPP 报文应直接传字节和显式 bitLength。

## ZUC-128 固定向量

零 key、零 IV 的前 8 字节密钥流应为 `27bede74018082da`。

<details open class="language-entry">
<summary><strong>TypeScript</strong></summary>

```ts
import { zucKeystream, zucKeystreamWords } from 'gmkitx';

const key = '00000000000000000000000000000000';
const iv = '00000000000000000000000000000000';
if (zucKeystream(key, iv, 8) !== '27bede74018082da') {
  throw new Error('ZUC byte stream vector mismatch');
}
if (zucKeystreamWords(key, iv, 2) !== '27bede74018082da') {
  throw new Error('ZUC word stream vector mismatch');
}
```

</details>

<details class="language-entry">
<summary><strong>Java</strong></summary>

```java
import cn.gmkit.zuc.ZUC;

String key = "00000000000000000000000000000000";
String iv = "00000000000000000000000000000000";
if (!"27bede74018082da".equals(ZUC.keystreamHex(key, iv, 8))) {
    throw new IllegalStateException("ZUC byte stream vector mismatch");
}
if (!"27bede74018082da".equals(ZUC.keystreamWordsHex(key, iv, 2))) {
    throw new IllegalStateException("ZUC word stream vector mismatch");
}
```

</details>

## 通用流加密

加密和解密都是将输入与同一密钥流异或。同一 key/IV 组合复用会泄露明文关系，调用方必须在协议层管理唯一 IV。

<details open class="language-entry">
<summary><strong>TypeScript</strong></summary>

```ts
import { zucDecryptBytes, zucEncrypt } from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210';
const iv = 'fedcba98765432100123456789abcdef';
const input = Uint8Array.of(0x00, 0xff, 0x80, 0x41);
const cipher = zucEncrypt(key, iv, input);
const output = zucDecryptBytes(key, iv, cipher);
if (output.length !== input.length || output.some((value, i) => value !== input[i])) {
  throw new Error('ZUC round-trip failed');
}
```

</details>

<details class="language-entry">
<summary><strong>Java</strong></summary>

```java
import cn.gmkit.core.HexCodec;
import cn.gmkit.zuc.ZUC;
import java.util.Arrays;

byte[] key = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "key");
byte[] iv = HexCodec.decodeStrict("fedcba98765432100123456789abcdef", "iv");
byte[] input = new byte[] {0x00, (byte) 0xff, (byte) 0x80, 0x41};
byte[] cipher = ZUC.encrypt(key, iv, input);
if (!Arrays.equals(input, ZUC.decrypt(key, iv, cipher))) {
    throw new IllegalStateException("ZUC round-trip failed");
}
```

</details>

通用 ZUC 加密不生成认证标签。业务数据如果没有独立完整性协议，优先考虑 SM4-GCM/CCM。

## 128-EEA3 固定向量

以下输入来自 3GPP TS 35.221 test set 2，消息有效长度为 800 bit。`eea3` 只返回旧兼容密钥流，真正处理消息应调用 `eea3Encrypt`。

```ts
import { eea3Encrypt, hexToBytes } from 'gmkitx';

const message = hexToBytes(
  '14a8ef693d678507bbe7270a7f67ff5006c3525b9807e467c4e56000ba338f5d' +
  '429559036751822246c80d3b38f07f4be2d8ff5805f5132229bde93bbbdcaf38' +
  '2bf1ee972fbf9977bada8945847a2a6c9ad34a667554e04d1f7fa2c33241bd8f' +
  '01ba220d',
);
const actual = eea3Encrypt('e5bd3ea0eb55ade866c6ac58bd54302a', 0x00056823, 0x18, 1, message, 800);
const expected =
  '131d43e0dea1be5c5a1bfd971d852cbf712d7b4f57961fea3208afa8bca433f' +
  '456ad09c7417e58bc69cf8866d1353f74865e80781d202dfb3ecff7fcbc3b190' +
  'fe82a204ed0e350fc0f6f2613b2f2bca6df5a473a57a4a00d985ebad880d6f2' +
  '3864a07b01';
if (actual !== expected) throw new Error('EEA3 vector mismatch');
```

同一向量由 Java `InteropComplianceTest` 读取共享 JSON 后执行，不在页面重复一份长 Java 常量。

## 128-EIA3 固定向量

```ts
import { eia3, hexToBytes } from 'gmkitx';

const actual = eia3(
  '000102030405060708090a0b0c0d0e0f',
  0x01234567,
  0x0a,
  0,
  hexToBytes('5bad724710ba1c56'),
  64,
);
if (actual !== '1b3d0f74') throw new Error(`EIA3 vector mismatch: ${actual}`);
```

EEA3 与 EIA3 的 IV 构造和用途不同，不能自行复用。EIA3 是 3GPP 协议完整性算法，不应脱离 COUNT/BEARER/DIRECTION 管理后当成通用 HMAC。

## 验证依据

- [3GPP TS 35.221 - 128-EEA3](https://www.3gpp.org/DynaReport/35221.htm)
- [3GPP TS 35.222 - 128-EIA3](https://www.3gpp.org/DynaReport/35222.htm)
- [共享互操作向量](/standards/interop-vectors)
- `packages/ts/test/zuc.test.ts`
- `packages/java/gmkit/src/test/java/cn/gmkit/zuc/ZUCStandardVectorsTest.java`
