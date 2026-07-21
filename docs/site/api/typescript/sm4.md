---
title: TypeScript SM4 API
description: 说明 gmkitx SM4 全部模式、填充、AEAD、结果对象、类工厂和失败行为。
pageInfo: false
icon: lock
order: 4
category:
  - API 说明书
  - TypeScript
tag:
  - SM4
  - AEAD
  - GCM
  - CCM
---

# TypeScript SM4 API

SM4 的 key 和分组长度均为 16 字节。`gmkitx` 支持 ECB、CBC、CTR、CFB、OFB、GCM、CCM；新协议优先选择带认证的 GCM/CCM，并把 nonce、AAD 和 tag 与密文一起保存。

## 函数签名

```ts
sm4Encrypt(
  key: BytesLike,
  data: string | Uint8Array,
  options?: SM4Options,
): SM4CipherResult

sm4Decrypt(
  key: BytesLike,
  encryptedData: BytesLike | SM4CipherResult,
  options?: SM4DecryptOptions,
): string

sm4DecryptBytes(
  key: BytesLike,
  encryptedData: BytesLike | SM4CipherResult,
  options?: SM4DecryptOptions,
): Uint8Array
```

`sm4` 命名空间中的 `encrypt`、`decrypt`、`decryptBytes` 与顶层函数相同。key 字符串必须是 32 个 Hex 字符；`Uint8Array` 必须恰好 16 字节。

## 选项

```ts
interface SM4Options {
  mode?: CipherModeType;
  padding?: PaddingModeType;
  iv?: BytesLike;
  aad?: string | Uint8Array;
  tagLength?: number;
  outputFormat?: OutputFormatType;
}

interface SM4DecryptOptions extends SM4Options {
  inputFormat?: InputFormatType;
  tag?: BytesLike;
  tagFormat?: InputFormatType;
}
```

| 字段 | 默认值 | 说明 |
|:--|:--|:--|
| `mode` | `CipherMode.ECB` | 兼容默认；省略时进程内警告一次，新代码必须显式设置 |
| `padding` | `PaddingMode.PKCS7` | 只影响 ECB/CBC；流式和 AEAD 模式不填充 |
| `iv` | 无 | CBC/CTR/CFB/OFB 为 16 字节；GCM 为 12 字节；CCM 为 7–13 字节 |
| `aad` | 空字节 | 只用于 GCM/CCM；字符串按 UTF-8 |
| `tagLength` | 16 字节 | GCM 为 12–16；CCM 为 4–16 的偶数 |
| `outputFormat` | Hex | 同时控制 `ciphertext` 和 `tag` |
| `inputFormat` | 自动识别 | 只用于单独传入的字符串密文 |
| `tag`/`tagFormat` | 无/自动 | 只在未传完整 `SM4CipherResult` 时使用 |

## 模式矩阵

<ApiTable label="TypeScript SM4 模式参数与使用边界" min-width="56rem">

| mode | IV/nonce | padding | 认证 tag | 适用边界 |
|:--|:--|:--|:--|:--|
| `ECB` | 无 | PKCS7/NONE/ZERO | 无 | 泄漏重复分组，只用于既有协议 |
| `CBC` | 16 字节 | PKCS7/NONE/ZERO | 无 | 需要另加 MAC；IV 不可固定复用 |
| `CTR` | 16 字节 | 忽略 | 无 | 相同 key 下计数器不可复用 |
| `CFB` | 16 字节 | 忽略 | 无 | 不提供完整性 |
| `OFB` | 16 字节 | 忽略 | 无 | 不提供完整性 |
| `GCM` | 12 字节 | 忽略 | 12–16 字节 | 新协议推荐；nonce 不可复用 |
| `CCM` | 7–13 字节 | 忽略 | 4–16 偶数字节 | nonce 长度会限制最大消息长度 |

</ApiTable>

`PaddingMode.NONE` 下 ECB/CBC 明文必须是 16 字节的倍数。`PaddingMode.ZERO` 解密会移除尾部零字节，不能无损承载以零结尾的任意二进制。

## 返回对象

```ts
interface SM4CipherResult {
  ciphertext: string;
  tag?: string;
  format: OutputFormatType;
}

type SM4GCMResult = SM4CipherResult;
type SM4CCMResult = SM4CipherResult;
type SM4AEADResult = SM4CipherResult;
```

所有模式都返回对象，不是裸字符串。GCM/CCM 的 `tag` 必填，其他模式没有 `tag`；三个结果类型是兼容别名，认证标签字段始终叫 `tag`。

## GCM 完整示例

```ts
import {
  CipherMode,
  OutputFormat,
  hexToBytes,
  sm4DecryptBytes,
  sm4Encrypt,
} from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210';
const plaintext = hexToBytes('00112233445566778899aabbccddeeff');
const options = {
  mode: CipherMode.GCM,
  iv: '000102030405060708090a0b',
  aad: 'gmkit-api-v1',
  tagLength: 16,
  outputFormat: OutputFormat.BASE64,
} as const;

const encrypted = sm4Encrypt(key, plaintext, options);
if (!encrypted.tag || encrypted.format !== OutputFormat.BASE64) {
  throw new Error('GCM result is incomplete');
}
const decrypted = sm4DecryptBytes(key, encrypted, options);
if (decrypted.some((value, index) => value !== plaintext[index])) {
  throw new Error('SM4-GCM round-trip failed');
}
```

传入完整结果对象时，解密会按 `result.format` 解码 ciphertext 和 tag。若协议把 tag 分开保存：

```ts
const decrypted = sm4DecryptBytes(key, encrypted.ciphertext, {
  ...options,
  inputFormat: OutputFormat.BASE64,
  tag: encrypted.tag,
  tagFormat: OutputFormat.BASE64,
});
```

修改 ciphertext、AAD、nonce 或 tag 会导致解密抛出 `Error`，不会返回未经认证的明文。

## CBC 示例

```ts
import {
  CipherMode,
  PaddingMode,
  sm4Decrypt,
  sm4Encrypt,
} from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210';
const options = {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv: '000102030405060708090a0b0c0d0e0f',
} as const;
const encrypted = sm4Encrypt(key, '需要加密的文本', options);
if (sm4Decrypt(key, encrypted, options) !== '需要加密的文本') {
  throw new Error('SM4-CBC round-trip failed');
}
```

CBC 不提供完整性。接收不可信数据时必须使用 encrypt-then-MAC，或直接选择 GCM/CCM。

## `SM4` 类

```ts
new SM4(key, { mode?, padding?, iv? })

setIV(iv: BytesLike): void
getIV(): BytesLike | undefined
setMode(mode: CipherModeType): void
getMode(): CipherModeType
setPadding(padding: PaddingModeType): void
getPadding(): PaddingModeType
encrypt(data, options?): SM4CipherResult
decrypt(encryptedData, options?): string
decryptBytes(encryptedData, options?): Uint8Array

SM4.ECB(key, padding = PaddingMode.PKCS7): SM4
SM4.CBC(key, iv, padding = PaddingMode.PKCS7): SM4
SM4.CTR(key, iv): SM4
SM4.CFB(key, iv): SM4
SM4.OFB(key, iv): SM4
SM4.GCM(key, iv): SM4
SM4.CCM(key, nonce): SM4
```

实例保存 key、mode、padding 和 IV/nonce；单次调用的 `options` 会覆盖实例值，适合传入 AAD、tagLength、tag 和输出格式。

```ts
import { SM4 } from 'gmkitx';

const cipher = SM4.GCM(
  '0123456789abcdeffedcba9876543210',
  '000102030405060708090a0b',
);
const encrypted = cipher.encrypt('class API', { aad: 'header' });
if (cipher.decrypt(encrypted, { aad: 'header' }) !== 'class API') {
  throw new Error('SM4 class round-trip failed');
}
```

不要在相同 key 下反复使用实例中同一个 GCM/CTR nonce。实例不会自动轮换 IV，也不负责密钥管理。

## 错误与边界

- key、IV/nonce、tag 长度或编码非法时抛出 `Error`。
- PKCS7 解密严格校验全部填充字节。
- AEAD 缺少 tag、tag 长度不符或认证失败时抛错。
- `sm4Decrypt` 只适合 UTF-8 文本；二进制使用 `sm4DecryptBytes`。
- 结果对象不是稳定的跨语言 JSON schema；传输前应固定字段名、编码和版本。

## 相关页面

- [跨语言 SM4 模式与示例](/algorithms/SM4.html)
- [公共编码与错误约定](/api/common.html)
