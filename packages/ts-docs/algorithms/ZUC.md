---
title: ZUC 祖冲之序列密码算法
icon: stream
order: 4
category:
  - 国密算法
tag:
  - ZUC
  - EEA3
  - EIA3
---

# ZUC 祖冲之序列密码算法

GMKitX 实现 ZUC-128 密钥流，以及 3GPP 128-EEA3 机密性算法和 128-EIA3 完整性算法。当前不支持 ZUC-256。

## API 边界

| API | 语义 | 返回值 |
|:--|:--|:--|
| `zucKeystream(key, iv, length)` | 生成指定**字节数**的 ZUC-128 密钥流 | hex 字符串 |
| `zucKeystreamWords(key, iv, words)` | 生成指定 32-bit 字数量的密钥流 | hex 字符串 |
| `zucEncrypt(key, iv, data, options?)` | 通用 ZUC 流加密 | hex/base64 字符串 |
| `zucDecrypt(key, iv, cipher, options?)` | 解密并按 UTF-8 返回文本 | 字符串 |
| `zucDecryptBytes(key, iv, cipher, options?)` | 解密为原始字节 | `Uint8Array` |
| `eea3(key, count, bearer, direction, bitLength)` | 兼容旧 API，返回向上取整到 32-bit 字边界的 EEA3 密钥流 | hex 字符串 |
| `eea3Encrypt(key, count, bearer, direction, message, bitLength?)` | 按 3GPP 消息比特长度加密 | hex 字符串 |
| `eia3(key, count, bearer, direction, message, bitLength?)` | 计算 32-bit MAC-I | 8 个 hex 字符 |

key 和通用 ZUC IV 必须是 16 字节。`bearer` 范围是 0-31，`direction` 只能是 0 或 1；`bitLength` 是消息的有效比特数，不能超过输入字节实际承载的比特数。非整字节 EEA3 输出的末尾未使用低位会清零。

## API 选择

- 只需要固定长度密钥流时使用 `zucKeystream`；协议以 32-bit 字计数时使用 `zucKeystreamWords`。
- 加解密普通字节数据时使用 `zucEncrypt` 和 `zucDecryptBytes`，不要对二进制结果做 UTF-8 解码。
- 3GPP 机密性处理使用 `eea3Encrypt`；旧 `eea3` 返回的是字对齐密钥流，不直接接收消息。
- 3GPP 完整性处理使用 `eia3`。EEA3 和 EIA3 的 IV 构造不同，不能自行混用。

## 通用流加密

```ts
import { zucDecryptBytes, zucEncrypt } from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210';
const iv = 'fedcba98765432100123456789abcdef';
const input = Uint8Array.of(0x00, 0xff, 0x80, 0x41);
const cipher = zucEncrypt(key, iv, input);
const output = zucDecryptBytes(key, iv, cipher);

if (output.length !== input.length || output.some((value, i) => value !== input[i])) {
  throw new Error('ZUC binary round-trip failed');
}
```

ZUC 是同步流密码。同一 key/IV 会产生同一密钥流，因此同一密钥下绝不能复用 IV。`zucEncrypt` 不提供认证，通用业务通常应优先选择 SM4-GCM/CCM。

## ZUC-128 固定向量

```ts
import { zucKeystream } from 'gmkitx';

const actual = zucKeystream(
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  8,
);
const expected = '27bede74018082da';

if (actual !== expected) {
  throw new Error(`ZUC keystream vector mismatch: ${actual}`);
}
```

## 128-EEA3 标准消息加密

下面使用 3GPP TS 35.221 test set 2 的 800-bit 固定向量。`eea3` 只返回兼容密钥流；对协议消息执行标准加密应调用 `eea3Encrypt`。

```ts
import { eea3Encrypt, hexToBytes } from 'gmkitx';

const message = hexToBytes(
  '14a8ef693d678507bbe7270a7f67ff5006c3525b9807e467c4e56000ba338f5d' +
  '429559036751822246c80d3b38f07f4be2d8ff5805f5132229bde93bbbdcaf38' +
  '2bf1ee972fbf9977bada8945847a2a6c9ad34a667554e04d1f7fa2c33241bd8f' +
  '01ba220d',
);
const actual = eea3Encrypt(
  'e5bd3ea0eb55ade866c6ac58bd54302a',
  0x00056823,
  0x18,
  1,
  message,
  800,
);
const expected =
  '131d43e0dea1be5c5a1bfd971d852cbf712d7b4f57961fea3208afa8bca433f' +
  '456ad09c7417e58bc69cf8866d1353f74865e80781d202dfb3ecff7fcbc3b190' +
  'fe82a204ed0e350fc0f6f2613b2f2bca6df5a473a57a4a00d985ebad880d6f2' +
  '3864a07b01';

if (actual !== expected) {
  throw new Error(`EEA3 vector mismatch: ${actual}`);
}
```

## 128-EIA3 标准完整性标签

下面使用 3GPP TS 35.222 的 64-bit 固定向量。EIA3 IV 与 EEA3 IV 的方向位布局不同，调用方不能自行复用 EEA3 IV。

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

if (actual !== '1b3d0f74') {
  throw new Error(`EIA3 vector mismatch: ${actual}`);
}
```

## Java 对照

```java
import cn.gmkit.core.HexCodec;
import cn.gmkit.zuc.ZUC;

byte[] message = HexCodec.decodeStrict("5bad724710ba1c56", "EIA3 message");
String mac = ZUC.eia3(
    "000102030405060708090a0b0c0d0e0f",
    0x01234567,
    0x0a,
    0,
    message,
    64);
if (!"1b3d0f74".equals(mac)) {
    throw new IllegalStateException("EIA3 vector mismatch: " + mac);
}
```

Java 和 TypeScript 都消费根目录 `vectors/interop.json` 中的关键 3GPP 固定向量。COUNT 在 API 和 JSON 中表示 32-bit 整数值，不是按宿主机字节序解释的四字节数组。

## 安全注意

- 通用 ZUC 加密每次调用都从 IV 起始生成密钥流，不可对多个分片重复使用同一 key/IV。
- `zucDecrypt` 面向 UTF-8 文本；任意二进制必须使用 `zucDecryptBytes`。
- EEA3 提供机密性，不提供完整性；EIA3 是 3GPP 协议完整性算法，不应脱离协议参数管理后替代通用 HMAC。
- 不要使用简单字符串拼接或截断哈希派生 key/IV；使用经审查的 KDF 和协议定义的 nonce/counter 管理。

## 参考

- [3GPP TS 35.221 - 128-EEA3](https://www.3gpp.org/DynaReport/35221.htm)
- [3GPP TS 35.222 - 128-EIA3](https://www.3gpp.org/DynaReport/35222.htm)
