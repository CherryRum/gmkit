---
title: TypeScript 公共类型与工具
description: 说明 gmkitx 常量、类型、编码、随机源、环境、ASN.1、字节工具和兼容别名。
icon: toolbox
order: 1
category:
  - API Reference
  - TypeScript
tag:
  - 编码
  - RNG
  - ASN.1
  - 类型
---

# TypeScript 公共类型与工具

本页覆盖 `gmkitx` 根入口中不属于单一算法的公开导出。所有字符串和字节转换都显式说明编码；稳定协议不要依赖自动猜测。

## 公共输入类型

```ts
type BytesLike = string | Uint8Array;
type OutputFormatType = 'hex' | 'base64';
type InputFormatType = 'hex' | 'base64';
type PaddingModeType = 'pkcs7' | 'none' | 'zero';
type CipherModeType = 'ecb' | 'cbc' | 'ctr' | 'cfb' | 'ofb' | 'gcm' | 'ccm';
type SM2CipherModeType = 'C1C3C2' | 'C1C2C3';
```

`BytesLike` 中字符串的含义由具体参数决定：消息字符串通常是 UTF-8，key/IV/密文字符串通常是 Hex 或由 `inputFormat` 指定的编码。不要仅凭 TypeScript 类型推断字符串编码。

## 格式常量

| 导出 | 成员 | 用途 |
|:--|:--|:--|
| `OutputFormat` | `HEX`, `BASE64` | 控制字符串输出；对应 `OutputFormatType` |
| `InputFormat` | `HEX`, `BASE64` | 控制字符串输入；对应 `InputFormatType` |
| `PaddingMode` | `PKCS7`, `NONE`, `ZERO` | SM4 填充；对应 `PaddingModeType` |
| `CipherMode` | `ECB`, `CBC`, `CTR`, `CFB`, `OFB`, `GCM`, `CCM` | SM4 工作模式；对应 `CipherModeType` |
| `SM2CipherMode` | `C1C3C2`, `C1C2C3` | SM2 密文排列；对应 `SM2CipherModeType` |
| `OID` | `SM2`, `SM2_SM3`, `SM3`, `SM4`, `EC_PUBLIC_KEY` | 算法标识；历史 EC OID 只用于识别兼容产物 |
| `DEFAULT_USER_ID` | `1234567812345678` | SM2 兼容默认身份；空字符串也回落到该值 |

`PaddingMode.ZERO` 无法区分原文末尾零字节和填充，不能用于需要无损恢复任意二进制的全新协议。`CipherMode.ECB` 只为兼容保留。

## Hex、Base64 与 UTF-8

| 签名 | 返回 | 失败条件 |
|:--|:--|:--|
| `hexToBytes(hex: string): Uint8Array` | Hex 解码后的字节 | 奇数长度、非 Hex 字符 |
| `bytesToHex(bytes: Uint8Array): string` | 小写 Hex | 参数不是字节数组 |
| `base64ToBytes(base64: string): Uint8Array` | RFC 4648 Base64 字节 | 非法字符、长度或非规范填充 |
| `bytesToBase64(bytes: Uint8Array): string` | 标准 Base64 | 参数不是字节数组 |
| `stringToBytes(str: string): Uint8Array` | UTF-8 字节 | 注入 codec 违反约定 |
| `bytesToString(bytes: Uint8Array): string` | UTF-8 文本 | 任意二进制可能产生替换字符 |

```ts
import {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  hexToBytes,
  stringToBytes,
} from 'gmkitx';

const bytes = hexToBytes('00ff8041');
if (bytesToHex(bytes) !== '00ff8041') throw new Error('Hex round-trip failed');
if (bytesToBase64(bytes) !== 'AP+AQQ==') throw new Error('Base64 mismatch');
if (bytesToHex(base64ToBytes('AP+AQQ==')) !== '00ff8041') {
  throw new Error('Base64 round-trip failed');
}
if (bytesToHex(stringToBytes('国密')) !== 'e59bbde5af86') {
  throw new Error('UTF-8 mismatch');
}
```

## 统一输入输出

```ts
normalizeInput(data: string | Uint8Array): Uint8Array
decodeInput(data: BytesLike, inputFormat: InputFormatType = 'hex'): Uint8Array
encodeOutput(bytes: Uint8Array, outputFormat: OutputFormatType = 'hex'): string
autoDecodeString(str: string): Uint8Array
isHexString(str: string): boolean
isBase64String(str: string): boolean
```

| API | 精确语义 |
|:--|:--|
| `normalizeInput` | 字符串按 UTF-8；`Uint8Array` 原样返回，不猜 Hex |
| `decodeInput` | 字节原样返回；字符串严格按显式格式解码，默认 Hex |
| `encodeOutput` | 默认小写 Hex，可指定标准 Base64 |
| `autoDecodeString` | 先尝试 Hex，再尝试 Base64；都不匹配时抛错 |
| `isHexString` | 非空、偶数长度且仅含 Hex 字符时为 true |
| `isBase64String` | 非空且是规范 Base64 时为 true |

```ts
import { InputFormat, OutputFormat, decodeInput, encodeOutput } from 'gmkitx';

const bytes = decodeInput('AP+AQQ==', InputFormat.BASE64);
if (encodeOutput(bytes, OutputFormat.HEX) !== '00ff8041') {
  throw new Error('encoding mismatch');
}
```

## 字节和整数工具

| 签名 | 说明 |
|:--|:--|
| `xor(a: Uint8Array, b: Uint8Array): Uint8Array` | 等长数组逐字节异或；长度不同抛错 |
| `rotl(value: number, shift: number): number` | 32-bit 循环左移并返回无符号整数 |
| `bytes4ToUint32BE(bytes: Uint8Array, offset = 0): number` | 从 offset 读取四字节大端整数 |
| `uint32ToBytes4BE(value: number): Uint8Array` | 写出四字节大端整数 |
| `constantTimeEqual(a, b): boolean` | null/undefined/长度不同返回 false；等长时扫描全部字节 |

`constantTimeEqual` 只避免源码中按内容提前退出；JavaScript JIT 和宿主运行时不保证严格恒时。它适合比较摘要、MAC 和 tag，不负责校验结构。

## 随机源与运行环境

```ts
type RNGPolicy = 'strict' | 'warn' | 'allow';

configureRNG(policy: RNGPolicy): void
setRNGPolicy(policy: RNGPolicy): void
setCustomRNG(fn: (length: number) => Uint8Array): void
clearCustomRNG(): void
hasCustomRNG(): boolean
getRandomBytes(length = 32): Uint8Array
getEnvReport(): EnvReport
```

随机源优先级为自定义 RNG、`crypto.getRandomValues`、CommonJS `node:crypto.randomBytes`、兼容降级源。默认 policy 是 `warn`：

| policy | 缺少 CSPRNG 时 |
|:--|:--|
| `strict` | 立即抛错；安全环境推荐 |
| `warn` | 警告一次后使用非安全兼容源 |
| `allow` | 静默使用非安全兼容源 |

`setRNGPolicy` 是 `configureRNG` 的兼容别名。`getRandomBytes` 只接受正安全整数；自定义 RNG 必须返回精确长度的 `Uint8Array`。

```ts
import { configureRNG, getEnvReport, setCustomRNG } from 'gmkitx';

configureRNG('strict');
const env = getEnvReport();
// 受限平台应注入自身的 CSPRNG：
// setCustomRNG((length) => platformSecureRandom(length));
if (!env.hasWebCrypto && !env.hasNodeCrypto) {
  console.warn('当前宿主需要注入安全随机源');
}
```

`EnvReport` 包含 `hasBigInt`、`hasTextEncoder`、`hasTextDecoder`、`hasWebCrypto`、`hasNodeCrypto`。它只报告能力是否存在，不检测随机数质量。

## 自定义文本编解码

```ts
type TextCodec = {
  encode(input: string): Uint8Array;
  decode(bytes: Uint8Array): string;
};

setTextCodec(codec: TextCodec): void
```

只在缺少标准 `TextEncoder`/`TextDecoder` 的宿主中注入。实现必须是 UTF-8，并正确处理代理对、非 BMP 字符和非法字节序列；不能用 `charCodeAt` 直接截成单字节。

## ASN.1 与 SM2 签名

```ts
encodeSignature(r: string | Uint8Array, s: string | Uint8Array): Uint8Array
decodeSignature(signature: Uint8Array): { r: string; s: string }
rawToDer(rawSignature: string | Uint8Array): Uint8Array
derToRaw(derSignature: Uint8Array): string
asn1ToXml(data: Uint8Array, indent = 0): string
signatureToXml(
  signature: BytesLike,
  options?: {
    signatureFormat?: 'raw' | 'der' | 'auto';
    inputFormat?: InputFormatType;
  },
): string
```

- `rawToDer` 接收 64 字节或 128 个 Hex 字符的 `r || s`。
- `derToRaw` 返回 128 个小写 Hex 字符。
- DER 解析拒绝无限长度、非最短整数/长度、截断、尾随数据和过深嵌套。
- `asn1ToXml`、`signatureToXml` 只用于诊断，不是 X.509、PKCS 或通用 XML 交换格式。

```ts
import { bytesToHex, derToRaw, rawToDer } from 'gmkitx';

const raw = `${'01'.padStart(64, '0')}${'02'.padStart(64, '0')}`;
const der = rawToDer(raw);
if (derToRaw(der) !== raw) throw new Error('signature conversion failed');
if (!bytesToHex(der).startsWith('30')) throw new Error('DER must be a SEQUENCE');
```

## 兼容别名

以下根导出仍可运行，但已标记 `@deprecated`：

| 旧名称 | 替代名称 |
|:--|:--|
| `generateKeyPair` | `sm2GenerateKeyPair` |
| `getPublicKeyFromPrivateKey` | `sm2GetPublicKeyFromPrivateKey` |
| `compressPublicKey` | `sm2CompressPublicKey` |
| `decompressPublicKey` | `sm2DecompressPublicKey` |
| `sign` | `sm2Sign` |
| `verify` | `sm2Verify` |
| `keyExchange` | `sm2KeyExchange` |
| `digest` | `sm3Digest` |
| `hmac` | `sm3Hmac` |

弃用只影响类型提示，不改变当前运行时。新代码不要继续引入这些无算法前缀的名称。

## 精确 Reference

- [工具函数与类型 TypeDoc](/api/typescript/latest/)
- [跨语言公共约定](/api/common.html)
- [API 稳定性规则](https://github.com/gmkits/gmkit/blob/main/docs/API_STABILITY.md)
