---
title: TypeScript ZUC API
description: 说明 gmkitx ZUC-128、字节与字长度、EEA3、EIA3、ZUC 类和底层状态。
pageInfo: false
contributors: false
editLink: false
icon: signal
order: 5
category:
  - API 说明书
  - TypeScript
tag:
  - ZUC
  - EEA3
  - EIA3
---

# TypeScript ZUC API

`gmkitx` 当前实现 ZUC-128、3GPP 128-EEA3 和 128-EIA3，不支持 ZUC-256。ZUC 是流密码，普通 `zucEncrypt`/`zucDecryptBytes` 不提供完整性保护。

EEA3/EIA3 面向明确采用 3GPP 参数的通信协议；普通应用若只需要认证加密，应优先选择 SM4-GCM/CCM，而不是自行组合 ZUC 与 MAC。

## 通用加解密

```ts
interface ZUCOptions {
  outputFormat?: OutputFormatType;
}

interface ZUCDecryptOptions {
  inputFormat?: InputFormatType;
}

zucEncrypt(
  key: BytesLike,
  iv: BytesLike,
  plaintext: string | Uint8Array,
  options?: ZUCOptions,
): string

zucDecrypt(
  key: BytesLike,
  iv: BytesLike,
  ciphertext: BytesLike,
  options?: ZUCDecryptOptions,
): string

zucDecryptBytes(
  key: BytesLike,
  iv: BytesLike,
  ciphertext: BytesLike,
  options?: ZUCDecryptOptions,
): Uint8Array
```

key 和 IV 必须各为 16 字节；字符串必须是恰好 32 个 Hex 字符，可带 `0x` 前缀。明文字符串按 UTF-8，默认密文输出为小写 Hex；解密字符串省略格式时优先识别 Hex，再识别 Base64。

```ts
import {
  InputFormat,
  OutputFormat,
  zucDecryptBytes,
  zucEncrypt,
} from 'gmkitx';

const key = '000102030405060708090a0b0c0d0e0f';
const iv = '101112131415161718191a1b1c1d1e1f';
const plaintext = Uint8Array.of(0x00, 0xff, 0x80, 0x41);
const ciphertext = zucEncrypt(key, iv, plaintext, {
  outputFormat: OutputFormat.BASE64,
});
const decrypted = zucDecryptBytes(key, iv, ciphertext, {
  inputFormat: InputFormat.BASE64,
});
if (decrypted.some((value, index) => value !== plaintext[index])) {
  throw new Error('ZUC binary round-trip failed');
}
```

相同 key 下复用 IV 会复用密钥流并泄漏明文关系。上层协议必须保证 IV 唯一，并另外提供 MAC 或 AEAD 保护。

## 密钥流 API 与长度单位

```ts
zucKeystream(
  key: BytesLike,
  iv: BytesLike,
  length: number,
): string

zucKeystreamWords(
  key: BytesLike,
  iv: BytesLike,
  length: number,
): string

zucGenerateKeystream(
  key: string | Uint8Array,
  iv: string | Uint8Array,
  length: number,
): Uint32Array
```

| API | `length` 单位 | 返回值 |
|:--|:--|:--|
| `zucKeystream` | byte | 恰好 `length * 2` 个小写 Hex 字符 |
| `zucKeystreamWords` | 32-bit word | 每个 word 按大端拼接的 Hex |
| `zucGenerateKeystream` | 32-bit word | 原始 `Uint32Array` |

三个长度都必须是非负安全整数。`zucKeystream` 和 `zucKeystreamWords` 固定返回 Hex，不接受输出格式选项。

```ts
import {
  zucGenerateKeystream,
  zucKeystream,
  zucKeystreamWords,
} from 'gmkitx';

const key = '00'.repeat(16);
const iv = '00'.repeat(16);
if (zucKeystream(key, iv, 8) !== '27bede74018082da') {
  throw new Error('byte keystream vector mismatch');
}
if (zucKeystreamWords(key, iv, 2) !== '27bede74018082da') {
  throw new Error('word keystream vector mismatch');
}
const words = zucGenerateKeystream(key, iv, 2);
if (words[0] !== 0x27bede74 || words[1] !== 0x018082da) {
  throw new Error('raw word vector mismatch');
}
```

## EEA3

```ts
eea3(
  key: BytesLike,
  count: number,
  bearer: number,
  direction: number,
  length: number,
): string

eea3Encrypt(
  key: BytesLike,
  count: number,
  bearer: number,
  direction: number,
  message: string | Uint8Array,
  bitLength?: number,
): string
```

| 参数 | 范围 |
|:--|:--|
| `count` | 无符号 32-bit 整数 |
| `bearer` | 0–31 的 5-bit 整数 |
| `direction` | 0 或 1 |
| `length`/`bitLength` | 非负安全整数，单位为 bit |

`eea3` 是旧兼容密钥流入口，返回向上取整到完整 32-bit word 的 Hex。标准消息加密使用 `eea3Encrypt`：返回 `ceil(bitLength / 8)` 字节，最后一个字节未使用的低位清零。

```ts
import { eea3Encrypt } from 'gmkitx';

const encrypted = eea3Encrypt(
  '00'.repeat(16),
  0,
  0,
  0,
  Uint8Array.of(0xff),
  5,
);
if ((Number.parseInt(encrypted, 16) & 0b111) !== 0) {
  throw new Error('unused EEA3 bits must be zero');
}
```

## EIA3

```ts
eia3(
  key: BytesLike,
  count: number,
  bearer: number,
  direction: number,
  message: string | Uint8Array,
  bitLength?: number,
): string
```

返回 32-bit MAC-I，即固定 8 个小写 Hex 字符。`bitLength` 省略时认证完整消息；显式值不能超过消息字节所能容纳的 bit 数。

```ts
import { eia3, hexToBytes } from 'gmkitx';

const mac = eia3(
  '000102030405060708090a0b0c0d0e0f',
  0x01234567,
  0x0a,
  0,
  hexToBytes('5bad724710ba1c56'),
  64,
);
if (mac !== '1b3d0f74') throw new Error('EIA3 vector mismatch');
```

## `ZUC` 类

```ts
new ZUC(key: string | Uint8Array, iv: string | Uint8Array)
ZUC.ZUC128(key, iv): ZUC

setIV(iv): void
getIV(): string | Uint8Array
encrypt(plaintext, options?): string
decrypt(ciphertext, options?): string
decryptBytes(ciphertext, options?): Uint8Array
keystream(lengthInBytes: number): string

ZUC.eea3(key, count, bearer, direction, bitLength): string
ZUC.eea3Encrypt(key, count, bearer, direction, message, bitLength?): string
ZUC.eia3(key, count, bearer, direction, message, bitLength?): string
```

实例保存 key 和 IV，但不会自动更新 IV。`setIV` 只替换后续调用使用的 IV；调用方负责唯一性和生命周期。

## `ZUCState` 底层状态

```ts
new ZUCState()
initialize(key: Uint8Array, iv: Uint8Array): void
generateKeyword(): number
```

`initialize` 只接受两个 16 字节数组，`generateKeyword` 每次推进状态并返回一个无符号 32-bit word。普通业务代码优先使用高层密钥流 API；直接管理 `ZUCState` 时不得在不同消息之间复用已推进的状态。

## 可执行案例

下面的 byte/word 长度对照和非法 key 失败断言直接来自文档测试。

::: details 查看测试源码
```js
<!-- @include: ../../examples/node/public-api-manual.mjs#ts-zuc-example -->
```
:::

## 相关页面

- [跨语言 ZUC/EEA3/EIA3 参数与向量](/algorithms/ZUC.html)
- [公共编码约定](/api/typescript/common.html)
