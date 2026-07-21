---
title: Java SM2 API
description: 说明 SM2、SM2Util、选项 Builder、密钥、签名、密文转换和密钥交换重载。
icon: key
order: 2
category:
  - API 说明书
  - Java
tag:
  - SM2
  - 加密
  - 签名
  - 密钥交换
---

# Java SM2 API

`cn.gmkit.sm2` 提供实例式 `SM2`、静态式 `SM2Util`、三个选项 Builder、密钥/密文/交换结果值对象和格式转换工具。普通业务从 `SM2` 或 `SM2Util` 开始；协议适配再使用底层格式类型。

## 常量、构造和密钥

`SM2` 与 `SM2Util` 都公开以下常量：

| 常量 | 值/含义 |
|:--|:--|
| `DEFAULT_USER_ID` | `1234567812345678`，兼容默认身份 |
| `GM_2023_USER_ID` | 已弃用。当前 Builder 会把空字符串映射为 `DEFAULT_USER_ID`，因此该常量没有独立语义 |
| `CURVE_NAME` | `sm2p256v1` |
| `SM3_DIGEST_LENGTH` | 32 字节 |

实例入口：

```java
new SM2()
new SM2(GmSecurityContext securityContext)
GmSecurityContext securityContext()

SM2KeyPair generateKeyPair()
SM2KeyPair generateKeyPair(boolean compressedPublicKey)
String getPublicKeyFromPrivateKey(String privateKeyHex, boolean compressed)
String compressPublicKey(String publicKeyHex)
String decompressPublicKey(String publicKeyHex)
```

静态入口完整变体：

```java
SM2Util.generateKeyPair()
SM2Util.generateKeyPair(boolean compressedPublicKey)
SM2Util.generateKeyPair(GmSecurityContext securityContext)
SM2Util.generateKeyPair(
    boolean compressedPublicKey,
    GmSecurityContext securityContext)
SM2Util.getPublicKeyFromPrivateKey(String privateKeyHex, boolean compressed)
SM2Util.compressPublicKey(String publicKeyHex)
SM2Util.decompressPublicKey(String publicKeyHex)
```

`SM2KeyPair` 构造和访问器：

```java
new SM2KeyPair(String publicKey, String privateKey)
String publicKey()
String privateKey()
```

私钥是 32 字节标量的 Hex。非压缩公钥为 `04 || x || y`，压缩公钥为 `02/03 || x`；公钥解析会校验曲线点。

```java
SM2 sm2 = new SM2();
SM2KeyPair keys = sm2.generateKeyPair();
String derived = sm2.getPublicKeyFromPrivateKey(keys.privateKey(), false);
if (!keys.publicKey().equals(derived)) {
    throw new IllegalStateException("public key derivation failed");
}
String compressed = sm2.compressPublicKey(keys.publicKey());
if (!keys.publicKey().equals(sm2.decompressPublicKey(compressed))) {
    throw new IllegalStateException("public key round-trip failed");
}
```

## 加密重载矩阵

默认密文排列是 `SM2CipherMode.C1C3C2`；无 mode 重载只适用于该默认值。字符串消息无 Charset 参数时按 UTF-8。

### `SM2` 实例

```java
byte[] encrypt(String publicKeyHex, byte[] data)
byte[] encrypt(String publicKeyHex, String data)
byte[] encrypt(
    String publicKeyHex, String data, Charset charset, SM2CipherMode mode)
byte[] encrypt(
    String publicKeyHex, byte[] data, SM2CipherMode mode)

String encryptHex(String publicKeyHex, byte[] data)
String encryptHex(
    String publicKeyHex, String data, SM2CipherMode mode)
String encryptHex(
    String publicKeyHex, String data, Charset charset, SM2CipherMode mode)
String encryptHex(
    String publicKeyHex, byte[] data, SM2CipherMode mode)

String encryptBase64(String publicKeyHex, byte[] data)
String encryptBase64(
    String publicKeyHex, String data, SM2CipherMode mode)
String encryptBase64(
    String publicKeyHex, String data, Charset charset, SM2CipherMode mode)
String encryptBase64(
    String publicKeyHex, byte[] data, SM2CipherMode mode)
```

### `SM2Util` 静态入口

静态入口包含以下完整变体：

| 返回形式 | 消息变体 | mode | 安全上下文变体 |
|:--|:--|:--|:--|
| `encrypt -> byte[]` | `byte[]` | 默认或显式 | `byte[] + mode + GmSecurityContext` |
| `encrypt -> byte[]` | UTF-8 `String` | 默认 | 无 |
| `encrypt -> byte[]` | `String + Charset` | 显式 | 无 |
| `encryptHex -> String` | `byte[]` | 默认或显式 | `byte[] + mode + GmSecurityContext` |
| `encryptHex -> String` | UTF-8 `String` | 显式 | 无 |
| `encryptHex -> String` | `String + Charset` | 显式 | 无 |
| `encryptBase64 -> String` | `byte[]` | 默认或显式 | `byte[] + mode + GmSecurityContext` |
| `encryptBase64 -> String` | UTF-8 `String` | 显式 | 无 |
| `encryptBase64 -> String` | `String + Charset` | 显式 | 无 |

每个 `GmSecurityContext` 变体的完整尾部参数顺序都是 `(publicKeyHex, data, mode, securityContext)`。

## 解密重载矩阵

```java
byte[] decrypt(String privateKeyHex, byte[] ciphertext)
byte[] decrypt(
    String privateKeyHex, byte[] ciphertext, SM2CipherMode mode)
byte[] decrypt(String privateKeyHex, String ciphertext)
byte[] decrypt(
    String privateKeyHex, String ciphertext, SM2CipherMode mode)

String decryptToUtf8(
    String privateKeyHex, byte[] ciphertext, SM2CipherMode mode)
String decryptToUtf8(
    String privateKeyHex, String ciphertext, SM2CipherMode mode)
String decryptToString(
    String privateKeyHex,
    byte[] ciphertext,
    Charset charset,
    SM2CipherMode mode)
```

`SM2Util` 提供完全相同参数和返回类型的静态版本。字符串密文使用 Hex/Base64 自动识别；网络协议仍应固定编码。Java 不会像 TypeScript 那样在省略 mode 时依次尝试两种排列，调用方应显式传协议 mode。

```java
SM2 sm2 = new SM2();
SM2KeyPair keys = sm2.generateKeyPair();
byte[] binary = new byte[] {0x00, (byte) 0xff, (byte) 0x80, 0x41};
String ciphertext =
    sm2.encryptBase64(keys.publicKey(), binary, SM2CipherMode.C1C3C2);
byte[] decrypted =
    sm2.decrypt(keys.privateKey(), ciphertext, SM2CipherMode.C1C3C2);
if (!java.util.Arrays.equals(binary, decrypted)) {
    throw new IllegalStateException("SM2 binary round-trip failed");
}
```

加密拒绝空明文；密钥、曲线点、编码、密文结构或 C3 校验失败抛 `GmkitException`，不会返回部分明文。

## 签名选项

### `SM2SignOptions`

```java
SM2SignOptions.builder()
    .signatureFormat(SM2SignatureFormat.RAW) // 默认 RAW
    .userId(SM2.DEFAULT_USER_ID)             // null/空字符串回落默认值
    .securityContext(GmSecurityContexts.defaults())
    .build()

SM2SignatureFormat signatureFormat()
String userId()
GmSecurityContext securityContext()
```

### `SM2VerifyOptions`

```java
SM2VerifyOptions.builder()
    .signatureFormat(SM2SignatureInputFormat.AUTO) // 默认 AUTO
    .userId(SM2.DEFAULT_USER_ID)
    .build()

SM2SignatureInputFormat signatureFormat()
String userId()
```

签名端和验签端的 user ID 与消息字节必须一致。当前 Builder 无法表达真实空 ID；传 null 或空字符串都会使用兼容默认身份。`skipZComputation(boolean)` 与对应 getter 仍为二进制兼容保留，但已经弃用，只能迁移明确采用 no-Z 约定的旧协议。

## 签名重载矩阵

### `SM2` 实例

```java
byte[] sign(String privateKeyHex, byte[] message)
byte[] sign(
    String privateKeyHex, String message, SM2SignOptions options)
byte[] sign(
    String privateKeyHex,
    String message,
    Charset charset,
    SM2SignOptions options)
byte[] sign(
    String privateKeyHex, byte[] message, SM2SignOptions options)

String signHex(
    String privateKeyHex, byte[] message, SM2SignOptions options)
String signHex(
    String privateKeyHex, String message, SM2SignOptions options)
String signHex(
    String privateKeyHex,
    String message,
    Charset charset,
    SM2SignOptions options)

String signBase64(
    String privateKeyHex, byte[] message, SM2SignOptions options)
String signBase64(
    String privateKeyHex, String message, SM2SignOptions options)
String signBase64(
    String privateKeyHex,
    String message,
    Charset charset,
    SM2SignOptions options)
```

`SM2Util` 提供除无 options 的 `sign(privateKey, byte[])` 之外的同参数静态版本。`SM2Util.signDigest` 额外提供尾部 `GmSecurityContext` 重载。

```java
SM2KeyPair keys = SM2Util.generateKeyPair();
String message = "order=GMKIT-DEMO-0001&amount=88.00";
String tampered = "order=GMKIT-DEMO-0001&amount=99.00";
SM2SignOptions signOptions = SM2SignOptions.builder()
    .signatureFormat(SM2SignatureFormat.DER)
    .userId("merchant@gmkit.cn")
    .build();
SM2VerifyOptions verifyOptions = SM2VerifyOptions.builder()
    .signatureFormat(SM2SignatureInputFormat.DER)
    .userId("merchant@gmkit.cn")
    .build();

String signature = SM2Util.signBase64(
    keys.privateKey(), message, signOptions);
if (!SM2Util.verify(
        keys.publicKey(), message, signature, verifyOptions)) {
    throw new IllegalStateException("SM2 verification failed");
}
if (SM2Util.verify(keys.publicKey(), tampered, signature, verifyOptions)) {
    throw new IllegalStateException("tampered message must not verify");
}
```

## 验签重载矩阵

```java
boolean verify(
    String publicKeyHex, byte[] message, byte[] signature)
boolean verify(
    String publicKeyHex,
    byte[] message,
    byte[] signature,
    SM2VerifyOptions options)
boolean verify(
    String publicKeyHex,
    byte[] message,
    String signature,
    SM2VerifyOptions options)
boolean verify(
    String publicKeyHex,
    String message,
    byte[] signature,
    SM2VerifyOptions options)
boolean verify(
    String publicKeyHex,
    String message,
    Charset charset,
    byte[] signature,
    SM2VerifyOptions options)
boolean verify(
    String publicKeyHex,
    String message,
    String signature,
    SM2VerifyOptions options)
```

`SM2Util` 提供后五个带 options 的静态版本；字符串签名可按形态识别 Hex/Base64，签名内部 RAW/DER 的判断由 `SM2SignatureInputFormat` 控制。验签数学上不成立返回 false，格式或参数非法可能抛异常。

## 高级签名与 e/Z

`SM2` 和 `SM2Util` 都提供：

```java
byte[] signWithoutZ(
    String privateKeyHex,
    byte[] message,
    SM2SignatureFormat signatureFormat)
byte[] signDigest(
    String privateKeyHex,
    byte[] eHash,
    SM2SignatureFormat signatureFormat)
boolean verifyWithoutZ(
    String publicKeyHex,
    byte[] message,
    byte[] signature,
    SM2SignatureInputFormat signatureFormat)
boolean verifyDigest(
    String publicKeyHex, byte[] eHash, byte[] derSignature)

byte[] computeZ(String userId, String publicKeyHex)
byte[] computeE(
    String publicKeyHex,
    byte[] message,
    String userId,
    boolean skipZComputation)
byte[] computeE(
    String publicKeyHex,
    String message,
    Charset charset,
    String userId,
    boolean skipZComputation)
byte[] computeEWithoutZ(byte[] message)
byte[] computeEWithoutZ(String message, Charset charset)
```

`SM2Util.signDigest` 另有 `(privateKeyHex, eHash, signatureFormat, securityContext)`。

| 路径 | e 的计算 | 定位 |
|:--|:--|:--|
| 标准 SM2 | `SM3(Z || M)` | 默认路径；与 Bouncy Castle `SM2Signer` 双向互操作 |
| 旧 no-Z 兼容 | `SM3(M)` | 非标准且已弃用；只迁移既有旧协议 |
| 预计算 e | 调用方直接传入 | `signDigest` / `verifyDigest` 高级接口；调用方负责摘要协议正确性 |

`signWithoutZ`、`verifyWithoutZ`、`computeEWithoutZ` 及 `skipZComputation` 方法族已经弃用。它们不调用 Bouncy Castle `SM2Signer`，也不能作为性能优化使用。标准签名会计算 Z；身份不同必须验签失败。预计算 e 则完全信任调用方输入，不能与 no-Z 混为一种语义。

## 签名与密文格式工具

### `SM2Signatures`

```java
static byte[] normalizeToRequested(
    byte[] signature, SM2SignatureFormat format)
static byte[] normalizeToDer(
    byte[] signature, SM2SignatureInputFormat inputFormat)
static byte[] derToRaw(byte[] derSignature)
static byte[] rawToDer(byte[] rawSignature)
```

RAW 固定为 64 字节 `r || s`；DER 是 ASN.1 SEQUENCE。解析拒绝错误长度、非规范 DER 和超出 SM2 标量宽度的整数。

### `SM2Ciphertext` 与 `SM2Ciphertexts`

```java
new SM2Ciphertext(byte[] c1, byte[] c2, byte[] c3, SM2CipherMode mode)
byte[] c1()
byte[] c2()
byte[] c3()
SM2CipherMode mode()

SM2Ciphertexts.parse(byte[] ciphertext, SM2CipherMode mode)
SM2Ciphertexts.encodeDer(byte[] ciphertext, SM2CipherMode mode)
SM2Ciphertexts.encodeAsn1(byte[] ciphertext, SM2CipherMode mode)
SM2Ciphertexts.decodeDer(byte[] derCiphertext, SM2CipherMode mode)
SM2Ciphertexts.decodeAsn1(byte[] asn1Ciphertext, SM2CipherMode mode)
SM2Ciphertexts.decodeAuto(byte[] ciphertext, SM2CipherMode mode)
```

`encodeAsn1`/`decodeAsn1` 是兼容名称，分别与 DER 方法同义。`decodeAuto` 可识别 DER 与 raw C1 开头形式，但排列 mode 仍由调用方提供。

## 密钥交换

```java
SM2KeyExchangeOptions.builder()
    .initiator(boolean)
    .keyBits(int)            // 默认 128，单位 bit
    .selfId(String)          // 默认兼容 ID
    .peerId(String)          // 默认兼容 ID
    .confirmationTag(byte[]) // 可选，对端确认标签
    .build()

boolean initiator()
int keyBits()
String selfId()
String peerId()
byte[] confirmationTag()
```

实例和静态入口都有以下两个方法：

```java
byte[] keyExchange(
    String selfStaticPrivateKeyHex,
    String selfEphemeralPrivateKeyHex,
    String peerStaticPublicKeyHex,
    String peerEphemeralPublicKeyHex,
    SM2KeyExchangeOptions options)

SM2KeyExchangeResult keyExchangeWithConfirmation(
    String selfStaticPrivateKeyHex,
    String selfEphemeralPrivateKeyHex,
    String peerStaticPublicKeyHex,
    String peerEphemeralPublicKeyHex,
    SM2KeyExchangeOptions options)

boolean confirmResponder(byte[] expectedS2, byte[] confirmationTag)
```

`SM2KeyExchangeResult`：

```java
new SM2KeyExchangeResult(byte[] key, byte[] s1, byte[] s2)
byte[] key()
byte[] s1()
byte[] s2()
boolean hasS1()
boolean hasS2()
String keyHex()
String keyBase64()
String s1Hex()
String s2Hex()
```

byte[] getter 返回防御性复制。发起方和响应方必须镜像角色、双方身份、静态/临时密钥位置和 `keyBits`；TypeScript 的 `keyLength` 单位是 byte，而 Java `keyBits` 单位是 bit。

## 相关页面

- [跨语言 SM2 协议与向量](/algorithms/SM2.html)
- [core 格式与安全上下文](/api/java/core.html)
