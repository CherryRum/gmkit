---
title: SM2 椭圆曲线公钥密码算法
icon: key
order: 1
category: [国密算法]
tag: [SM2, 加密, 签名, 密钥交换]
---

# SM2 椭圆曲线公钥密码算法

GMKitX 提供 SM2 密钥生成、公钥派生与压缩、加解密、签名验签和密钥交换。实现仅接受标准 SM2 曲线。固定行为以 [GM/T 0009 实现边界](/standards/GMT-0009-COMPLIANCE) 和共享向量为准，本文不构成产品认证声明。

## 协议边界

| 项目 | 当前行为 |
|:--|:--|
| 私钥 | 32 字节标量，hex 或 `Uint8Array` |
| 公钥 | 非压缩 `04 || x || y`（65 字节）或压缩 `02/03 || x`（33 字节） |
| 密文排列 | 默认 `C1C3C2`，支持 `C1C2C3` |
| 签名 | 默认 raw `r || s`（64 字节），支持 ASN.1 DER |
| userId | 省略或传 `''` 都回落到 `DEFAULT_USER_ID`，用于兼容旧版本 |
| 文本 | 字符串按 UTF-8 编码；任意二进制使用 `Uint8Array` 和 `sm2DecryptBytes` |

SM2 加密与签名含随机数，正常情况下每次结果不同。测试应验证解密、验签和篡改拒绝，不应比较随机密文或签名的完整字面值。

## 密钥与公钥格式

```ts
import {
  sm2CompressPublicKey,
  sm2DecompressPublicKey,
  sm2GenerateKeyPair,
  sm2GetPublicKeyFromPrivateKey,
} from 'gmkitx';

const { privateKey, publicKey } = sm2GenerateKeyPair();
const compressed = sm2CompressPublicKey(publicKey);

if (privateKey.length !== 64 || publicKey.length !== 130 || compressed.length !== 66) {
  throw new Error('unexpected SM2 key encoding');
}
if (sm2GetPublicKeyFromPrivateKey(privateKey) !== publicKey) {
  throw new Error('SM2 public/private key mismatch');
}
if (sm2DecompressPublicKey(compressed) !== publicKey) {
  throw new Error('SM2 public key compression round-trip failed');
}
```

公钥压缩只改变点的编码，不改变密钥本身。协议必须明确接收哪一种表示，不能通过字符串长度猜测其他 ASN.1/PEM 格式。

## 加密与二进制解密

```ts
import {
  InputFormat,
  OutputFormat,
  SM2CipherMode,
  sm2DecryptBytes,
  sm2Encrypt,
  sm2GenerateKeyPair,
} from 'gmkitx';

const { privateKey, publicKey } = sm2GenerateKeyPair();
const input = Uint8Array.of(0x00, 0xff, 0x80, 0x41);
const cipher = sm2Encrypt(publicKey, input, {
  mode: SM2CipherMode.C1C3C2,
  outputFormat: OutputFormat.BASE64,
});
const output = sm2DecryptBytes(privateKey, cipher, {
  mode: SM2CipherMode.C1C3C2,
  inputFormat: InputFormat.BASE64,
});

if (output.length !== input.length || output.some((value, i) => value !== input[i])) {
  throw new Error('SM2 binary round-trip failed');
}
```

解密会验证 C3。密文损坏、密钥不匹配或格式不合法时必须视为失败，不要捕获异常后继续使用空明文。

## 签名与 userId

```ts
import {
  InputFormat,
  OutputFormat,
  sm2GenerateKeyPair,
  sm2Sign,
  sm2Verify,
} from 'gmkitx';

const { privateKey, publicKey } = sm2GenerateKeyPair();
const message = 'GMKit release signature check';
const userId = 'gmkit-release-v1';
const signature = sm2Sign(privateKey, message, {
  userId,
  signatureFormat: 'der',
  outputFormat: OutputFormat.BASE64,
});

if (!sm2Verify(publicKey, message, signature, {
  userId,
  signatureFormat: 'der',
  inputFormat: InputFormat.BASE64,
})) {
  throw new Error('SM2 signature verification failed');
}
if (sm2Verify(publicKey, `${message}!`, signature, {
  userId,
  signatureFormat: 'der',
  inputFormat: InputFormat.BASE64,
})) {
  throw new Error('SM2 accepted a modified message');
}
```

签名端和验签端必须固定相同的 `userId` 与签名格式。`skipZComputation` 仅用于明确要求“直接签消息摘要”的旧系统互操作，不是标准 SM2 签名默认流程，新协议不要启用。

## 密钥交换

`sm2KeyExchange` 实现 SM2 双方密钥协商，不等同于普通 ECDH。调用方需要分别维护双方静态密钥和临时密钥，并核对确认标签。详细字段以 `SM2KeyExchangeParams` 类型为准，测试覆盖位于 `packages/ts/test/sm2.test.ts`。

密钥交换协议必须明确：双方角色、userId、派生长度、静态/临时公钥编码和确认标签传输顺序。不要只交换公钥后忽略确认标签。

## 随机数

密钥生成、加密和签名依赖安全随机数。默认 `warn` 策略在缺少 CSPRNG 时为旧小程序兼容而警告降级；生产环境应注入平台安全随机源或启用严格模式：

```ts
import { configureRNG, setCustomRNG } from 'gmkitx';

configureRNG('strict');
// 受限环境可通过 setCustomRNG((length) => platformSecureRandom(length)) 注入安全源。
```

详见[安全边界](/guide/security)。

## 验证

```bash
npm test -w packages/ts -- sm2
npm run parity
```

- [GM/T 0009 快速参考](/standards/GMT-0009-快速参考)
- [Java 同源实现](/dev/JAVA-LIBRARY.zh-CN)
- [跨语言互操作向量](/dev/INTEROP_VECTORS)
