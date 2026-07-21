---
title: TypeScript SM2 API
description: 说明 gmkitx SM2 密钥、压缩公钥、加解密、raw/DER 签名和密钥交换。
pageInfo: false
contributors: false
editLink: false
icon: key
order: 2
category:
  - API 说明书
  - TypeScript
tag:
  - SM2
  - 加密
  - 签名
  - 密钥交换
---

# TypeScript SM2 API

`gmkitx` 的 SM2 API 覆盖密钥生成、公钥派生与压缩、加解密、签名验签和密钥交换。新代码优先使用 `sm2*` 顶层函数；需要持有密钥时使用 `SM2` 类。

SM2 适合签名、小体积密钥材料加密和标准密钥交换，不适合直接加密文件或大段业务数据。大数据应使用 SM4-GCM/CCM，再用 SM2 保护会话密钥，并由上层协议固定字段编码。

## 入口选择

| 场景 | 推荐入口 |
|:--|:--|
| 一次性调用 | `sm2GenerateKeyPair`、`sm2Encrypt`、`sm2Sign` 等顶层函数 |
| 统一注入算法模块 | `sm2.generateKeyPair`、`sm2.encrypt`、`sm2.SM2` |
| 实例持有公钥/私钥 | `SM2` |
| 格式转换 | `sm2CompressPublicKey`、`sm2DecompressPublicKey` 及 [ASN.1 工具](/api/typescript/common.html#asn-1-与-sm2-签名) |

无前缀的 `generateKeyPair`、`sign`、`verify` 等名称是弃用兼容别名。

## 密钥类型与编码

```ts
interface KeyPair {
  publicKey: string;
  privateKey: string;
}

sm2GenerateKeyPair(compressed?: boolean): KeyPair
sm2GetPublicKeyFromPrivateKey(
  privateKey: BytesLike,
  compressed?: boolean,
): string
sm2CompressPublicKey(publicKey: BytesLike): string
sm2DecompressPublicKey(publicKey: BytesLike): string
```

| 项目 | 编码和长度 |
|:--|:--|
| 私钥 | 32 字节标量；字符串为 64 个 Hex 字符，可接受 `0x` 前缀；短 Hex 会左侧补零 |
| 非压缩公钥 | 65 字节，`04 \|\| x \|\| y`，即 130 个 Hex 字符 |
| 压缩公钥 | 33 字节，`02/03 \|\| x`，即 66 个 Hex 字符 |
| 默认公钥形式 | `compressed` 省略或为 false 时返回非压缩公钥 |

公钥解析会校验点是否位于标准 SM2 曲线上。传入同时包含公私钥的 `SM2` 构造参数时，两者必须匹配。

```ts
import {
  sm2CompressPublicKey,
  sm2DecompressPublicKey,
  sm2GenerateKeyPair,
  sm2GetPublicKeyFromPrivateKey,
} from 'gmkitx';

const keys = sm2GenerateKeyPair();
if (sm2GetPublicKeyFromPrivateKey(keys.privateKey) !== keys.publicKey) {
  throw new Error('public key derivation failed');
}

const compressed = sm2CompressPublicKey(keys.publicKey);
if (compressed.length !== 66) throw new Error('compressed key length mismatch');
if (sm2DecompressPublicKey(compressed) !== keys.publicKey) {
  throw new Error('public key round-trip failed');
}
```

## 加密与解密

```ts
interface SM2EncryptOptions {
  mode?: SM2CipherModeType;
  outputFormat?: OutputFormatType;
}

interface SM2DecryptOptions {
  mode?: SM2CipherModeType;
  inputFormat?: InputFormatType;
}

sm2Encrypt(
  publicKey: BytesLike,
  data: string | Uint8Array,
  options?: SM2EncryptOptions,
): string

sm2Decrypt(
  privateKey: BytesLike,
  encryptedData: BytesLike,
  options?: SM2DecryptOptions,
): string

sm2DecryptBytes(
  privateKey: BytesLike,
  encryptedData: BytesLike,
  options?: SM2DecryptOptions,
): Uint8Array
```

| 选项 | 默认值 | 说明 |
|:--|:--|:--|
| `mode`（加密） | `SM2CipherMode.C1C3C2` | 可选 `C1C3C2` 或兼容用 `C1C2C3` |
| `mode`（解密） | 自动尝试 | 省略时先尝试 C1C3C2，再尝试 C1C2C3；协议中仍建议显式传值 |
| `outputFormat` | `OutputFormat.HEX` | 加密结果为小写 Hex 或 Base64 |
| `inputFormat` | 自动识别 | 字符串优先识别 Hex，再识别 Base64；字节不解码 |

`sm2Decrypt` 会把明文字节按 UTF-8 解码。图片、压缩数据、协议包等任意二进制必须使用 `sm2DecryptBytes`。

```ts
import {
  InputFormat,
  OutputFormat,
  SM2CipherMode,
  sm2DecryptBytes,
  sm2Encrypt,
  sm2GenerateKeyPair,
} from 'gmkitx';

const keys = sm2GenerateKeyPair();
const plaintext = Uint8Array.of(0x00, 0xff, 0x80, 0x41);
const ciphertext = sm2Encrypt(keys.publicKey, plaintext, {
  mode: SM2CipherMode.C1C3C2,
  outputFormat: OutputFormat.BASE64,
});
const decrypted = sm2DecryptBytes(keys.privateKey, ciphertext, {
  mode: SM2CipherMode.C1C3C2,
  inputFormat: InputFormat.BASE64,
});
if (decrypted.some((value, index) => value !== plaintext[index])) {
  throw new Error('SM2 binary round-trip failed');
}
```

加密拒绝空明文。非法私钥、公钥、密文前缀、密文长度或 C3 完整性校验失败都会抛出 `Error`，不会返回部分明文。

## 签名与验签

```ts
type SM2SignatureFormat = 'raw' | 'der';
type SM2SignatureInputFormat = 'raw' | 'der' | 'auto';

interface SignOptions {
  signatureFormat?: SM2SignatureFormat;
  outputFormat?: OutputFormatType;
  userId?: string;
  curveParams?: SM2CurveParams;
  skipZComputation?: boolean;
}

interface VerifyOptions {
  signatureFormat?: SM2SignatureInputFormat;
  inputFormat?: InputFormatType;
  userId?: string;
  curveParams?: SM2CurveParams;
  skipZComputation?: boolean;
}

sm2Sign(
  privateKey: BytesLike,
  data: string | Uint8Array,
  options?: SignOptions,
): string

sm2Verify(
  publicKey: BytesLike,
  data: string | Uint8Array,
  signature: BytesLike,
  options?: VerifyOptions,
): boolean
```

| 选项 | 默认值 | 约束 |
|:--|:--|:--|
| `signatureFormat`（签名） | `raw` | raw 为 64 字节 `r \|\| s`；DER 为可变长度 SEQUENCE |
| `signatureFormat`（验签） | `raw` | 只有显式传 `auto` 才自动识别 |
| `outputFormat` | `hex` | raw/DER 字节外层再编码成 Hex 或 Base64 |
| `inputFormat` | 自动识别 | 字符串优先 Hex；跨系统调用建议显式传 |
| `userId` | `DEFAULT_USER_ID` | 省略或空字符串都使用 `1234567812345678` |
| `skipZComputation` | false | 已弃用。`true` 仅用于迁移采用 `SM3(M)` 的旧协议 |

默认签名计算 `e = SM3(Z || M)`，其中 Z 绑定 user ID、曲线参数和公钥。签名端和验签端必须使用相同的 user ID、消息字节和签名格式。消息被篡改、user ID 不一致或签名数学上无效时返回 `false`；格式、范围或密钥非法会抛错。

### 标准签名与旧 no-Z 兼容

| 路径 | e 的计算 | 使用边界 |
|:--|:--|:--|
| 标准 SM2 | `SM3(Z \|\| M)` | 默认路径；新协议和跨库互操作都应使用 |
| 旧 no-Z 兼容 | `SM3(M)` | 非标准；只迁移双方已经采用相同约定的旧协议 |

`skipZComputation: true` 不是性能选项，也不等同于“调用方传入预计算 e”。它会改用项目内部的摘要签名实现；Bouncy Castle 1.83 的标准 `SM2Signer` 没有跳过 Z 的公开选项，因此两者不能互验。TypeScript 当前没有公开的预计算 e 签名入口。

```ts
import {
  InputFormat,
  OutputFormat,
  sm2GenerateKeyPair,
  sm2Sign,
  sm2Verify,
} from 'gmkitx';

const keys = sm2GenerateKeyPair();
const message = 'order=GMKIT-DEMO-0001&amount=88.00';
const tampered = 'order=GMKIT-DEMO-0001&amount=99.00';
const signature = sm2Sign(keys.privateKey, message, {
  userId: 'merchant@gmkit.cn',
  signatureFormat: 'der',
  outputFormat: OutputFormat.BASE64,
});
const valid = sm2Verify(keys.publicKey, message, signature, {
  userId: 'merchant@gmkit.cn',
  signatureFormat: 'der',
  inputFormat: InputFormat.BASE64,
});
if (!valid) throw new Error('SM2 verification failed');
if (sm2Verify(keys.publicKey, tampered, signature, {
  userId: 'merchant@gmkit.cn',
  signatureFormat: 'der',
  inputFormat: InputFormat.BASE64,
})) {
  throw new Error('tampered message must not verify');
}
```

## 曲线参数兼容类型

```ts
interface SM2CurveParams {
  p?: string;
  a?: string;
  b?: string;
  Gx?: string;
  Gy?: string;
  n?: string;
}
```

`SM2CurveParams` 是历史兼容入口。当前底层固定使用标准 SM2 曲线：省略字段或重复声明标准参数可以工作，任何不同参数都会在签名/验签时被拒绝。不要把该类型理解为支持任意自定义曲线。

## 密钥交换

```ts
interface SM2KeyExchangeParams {
  privateKey: BytesLike;
  publicKey?: BytesLike;
  userId?: string;
  tempPrivateKey?: BytesLike;
  peerPublicKey: BytesLike;
  peerTempPublicKey: BytesLike;
  peerUserId?: string;
  isInitiator: boolean;
  keyLength?: number;
}

interface SM2KeyExchangeResult {
  tempPublicKey: string;
  sharedKey: string;
  s1?: string;
  s2?: string;
}

sm2KeyExchange(params: SM2KeyExchangeParams): SM2KeyExchangeResult
```

| 字段 | 必填 | 说明 |
|:--|:--:|:--|
| `privateKey` | 是 | 己方长期私钥 |
| `publicKey` | 否 | 省略时从私钥派生；传入时必须匹配 |
| `tempPrivateKey` | 否 | 省略时内部生成；可为测试向量显式固定 |
| `peerPublicKey` | 是 | 对方长期公钥 |
| `peerTempPublicKey` | 是 | 对方本会话临时公钥 |
| `isInitiator` | 是 | 发起方 true，响应方 false |
| `userId`/`peerUserId` | 否 | 默认兼容 ID；双方身份和顺序必须镜像 |
| `keyLength` | 否 | 派生密钥的字节数，默认 16，必须为正安全整数 |

双方应先交换临时公钥，再以相反角色调用。`sharedKey` 必须一致；确认值的传输和比对顺序应由上层协议固定。

```ts
import {
  sm2GenerateKeyPair,
  sm2KeyExchange,
} from 'gmkitx';

const alice = sm2GenerateKeyPair();
const bob = sm2GenerateKeyPair();
const aliceTemp = sm2GenerateKeyPair();
const bobTemp = sm2GenerateKeyPair();

const a = sm2KeyExchange({
  privateKey: alice.privateKey,
  publicKey: alice.publicKey,
  tempPrivateKey: aliceTemp.privateKey,
  peerPublicKey: bob.publicKey,
  peerTempPublicKey: bobTemp.publicKey,
  userId: 'Alice',
  peerUserId: 'Bob',
  isInitiator: true,
  keyLength: 32,
});
const b = sm2KeyExchange({
  privateKey: bob.privateKey,
  publicKey: bob.publicKey,
  tempPrivateKey: bobTemp.privateKey,
  peerPublicKey: alice.publicKey,
  peerTempPublicKey: aliceTemp.publicKey,
  userId: 'Bob',
  peerUserId: 'Alice',
  isInitiator: false,
  keyLength: 32,
});
if (a.sharedKey !== b.sharedKey || a.s1 !== b.s1 || a.s2 !== b.s2) {
  throw new Error('SM2 key exchange mismatch');
}
```

## `SM2` 类

```ts
new SM2(keyPair?: Partial<KeyPair>, curveParams?: SM2CurveParams)
SM2.generateKeyPair(curveParams?: SM2CurveParams): SM2
SM2.fromPrivateKey(privateKey: string, curveParams?: SM2CurveParams): SM2
SM2.fromPublicKey(publicKey: string, curveParams?: SM2CurveParams): SM2

getPublicKey(): string
getPrivateKey(): string
encrypt(data, options?): string
decrypt(encryptedData, options?): string
decryptBytes(encryptedData, options?): Uint8Array
sign(data, options?): string
verify(data, signature, options?): boolean
setCurveParams(curveParams: SM2CurveParams): void
getCurveParams(): SM2CurveParams | undefined
keyExchange(peerPublicKey, peerTempPublicKey, isInitiator, options?): SM2KeyExchangeResult
```

实例只保存密钥和曲线兼容参数，不保存一次性签名/加密状态。只有公钥的实例可加密和验签，调用 `getPrivateKey`、解密、签名或密钥交换会抛错；只有私钥的推荐构造方式是 `SM2.fromPrivateKey`，它会同步派生公钥。

```ts
import { SM2 } from 'gmkitx';

const owner = SM2.generateKeyPair();
const verifier = SM2.fromPublicKey(owner.getPublicKey());
const signature = owner.sign('class API');
if (!verifier.verify('class API', signature)) {
  throw new Error('SM2 class verification failed');
}
```

## 可执行案例

下面的成功验签与篡改失败断言直接来自文档测试。

::: details 查看测试源码
```js
<!-- @include: ../../examples/node/public-api-manual.mjs#ts-sm2-example -->
```
:::

## 相关页面

- [跨语言 SM2 协议与向量](/algorithms/SM2.html)
- [签名格式转换工具](/api/typescript/common.html#asn-1-与-sm2-签名)
