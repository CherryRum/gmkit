---
title: Java SM4 API
icon: lock
order: 4
category:
  - API Reference
  - Java
tag:
  - SM4
  - AEAD
  - GCM
  - CCM
---

# Java SM4 API

`SM4` 是可注入 `GmSecurityContext` 的实例入口，`SM4Util` 是静态入口。两者支持 ECB、CBC、CTR、CFB、OFB、GCM、CCM，并统一返回 `SM4CipherResult`。

## 构造和密钥生成

```java
new SM4()
new SM4(GmSecurityContext securityContext)
GmSecurityContext securityContext()
byte[] generateKey()
String generateKeyHex()
```

`SM4Util` 提供：

```java
static byte[] generateKey()
static byte[] generateKey(GmSecurityContext securityContext)
static String generateKeyHex()
static String generateKeyHex(GmSecurityContext securityContext)
```

SM4 key 固定 16 字节。需要审计随机源时显式传入安全上下文。

## `SM4Options`

```java
SM4Options.builder()
    .mode(SM4CipherMode.ECB)
    .padding(SM4Padding.PKCS7)
    .iv(byte[])
    .aad(byte[])
    .tagLength(Integer)
    .tag(byte[])
    .securityContext(GmSecurityContexts.defaults())
    .build()
```

访问器：

```java
SM4CipherMode mode()
SM4Padding padding()
byte[] iv()
byte[] aad()
Integer tagLength()
byte[] tag()
GmSecurityContext securityContext()
boolean hasTag()
```

IV、AAD、tag 的 Builder 和 getter 都执行防御性复制。

| 字段 | 默认值 | 约束 |
|:--|:--|:--|
| `mode` | ECB | 新协议必须显式设置 |
| `padding` | PKCS7 | 流式/AEAD 模式实际使用 NoPadding |
| `iv` | null | CBC/CTR/CFB/OFB 为 16 字节；GCM 为 12–16；CCM 为 7–13 |
| `aad` | null | 只允许 GCM/CCM |
| `tagLength` | null，解析为 16 | GCM 12–16；CCM 4–16 偶数，单位 byte |
| `tag` | null | GCM/CCM 解密传裸密文时必需 |
| `securityContext` | 默认上下文 | 决定 Provider 和随机源 |

## 模式矩阵

| `SM4CipherMode` | IV/nonce | `SM4Padding` | tag |
|:--|:--|:--|:--|
| `ECB` | 无 | PKCS7/NONE/ZERO | 无 |
| `CBC` | 16 字节 | PKCS7/NONE/ZERO | 无 |
| `CTR` | 16 字节 | 忽略 | 无 |
| `CFB` | 16 字节 | 忽略 | 无 |
| `OFB` | 16 字节 | 忽略 | 无 |
| `GCM` | 12–16 字节 | 忽略 | 12–16 字节 |
| `CCM` | 7–13 字节 | 忽略 | 4–16 偶数字节 |

跨语言 GCM 应选择双方交集：12 字节 nonce。ECB 只为兼容；CBC/CTR/CFB/OFB 不提供完整性。

## 加密完整重载

`SM4` 实例：

```java
SM4CipherResult encryptHex(
    String keyHex, String data, SM4Options options)
SM4CipherResult encryptHex(
    String keyHex, byte[] data, SM4Options options)

SM4CipherResult encrypt(byte[] key, byte[] data)
SM4CipherResult encrypt(
    byte[] key, String data, SM4Options options)
SM4CipherResult encrypt(
    byte[] key, String data, Charset charset, SM4Options options)
SM4CipherResult encrypt(
    byte[] key, byte[] data, SM4Options options)
```

`SM4Util` 提供相同的两个 `encryptHex` 重载，以及后三个带 options 的 `encrypt` 重载；它没有实例类的 `encrypt(byte[] key, byte[] data)` 简写。

## 解密完整重载

`SM4` 实例：

```java
byte[] decryptHex(
    String keyHex, String ciphertextHex, SM4Options options)
String decryptToUtf8(
    byte[] key, byte[] ciphertext, SM4Options options)
String decryptToUtf8(
    byte[] key, SM4CipherResult result, SM4Options options)
String decryptToString(
    byte[] key,
    byte[] ciphertext,
    Charset charset,
    SM4Options options)
String decryptToString(
    byte[] key,
    SM4CipherResult result,
    Charset charset,
    SM4Options options)
byte[] decrypt(
    byte[] key, SM4CipherResult result, SM4Options options)
byte[] decrypt(byte[] key, byte[] ciphertext)
byte[] decrypt(
    byte[] key, byte[] ciphertext, SM4Options options)
```

`SM4Util` 提供除无 options 的 `decrypt(byte[], byte[])` 之外的同参数静态版本。

## `SM4CipherResult`

```java
new SM4CipherResult(byte[] ciphertext, byte[] tag)
byte[] ciphertext()
byte[] tag()
boolean hasTag()
String ciphertextHex()
String ciphertextBase64()
String tagHex()
String tagBase64()
```

GCM/CCM 结果含 tag；其他模式的 tag 为 null。byte[] getter 返回防御性复制。传完整结果对象解密时，库会使用对象中的 tag；传裸 ciphertext 时，应在 `SM4Options.tag(...)` 中提供 tag。

## GCM 完整示例

```java
byte[] key =
    HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "SM4 key");
byte[] nonce =
    HexCodec.decodeStrict("000102030405060708090a0b", "SM4 nonce");
byte[] aad = Texts.utf8("gmkit-api-v1");

SM4Options options = SM4Options.builder()
    .mode(SM4CipherMode.GCM)
    .padding(SM4Padding.NONE)
    .iv(nonce)
    .aad(aad)
    .tagLength(16)
    .build();

SM4 sm4 = new SM4();
SM4CipherResult encrypted = sm4.encrypt(key, Texts.utf8("secret"), options);
if (!encrypted.hasTag()) {
    throw new IllegalStateException("GCM tag missing");
}
String plaintext = sm4.decryptToUtf8(key, encrypted, options);
if (!"secret".equals(plaintext)) {
    throw new IllegalStateException("SM4-GCM round-trip failed");
}
```

如果 AAD、nonce、ciphertext 或 tag 被修改，解密抛 `GmkitException`，不会返回未经认证的明文。

## CBC 示例

```java
byte[] key =
    HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "SM4 key");
SM4Options options = SM4Options.builder()
    .mode(SM4CipherMode.CBC)
    .padding(SM4Padding.PKCS7)
    .iv(HexCodec.decodeStrict(
        "000102030405060708090a0b0c0d0e0f", "SM4 IV"))
    .build();
SM4CipherResult result = SM4Util.encrypt(key, "文本消息", options);
if (!"文本消息".equals(SM4Util.decryptToUtf8(key, result, options))) {
    throw new IllegalStateException("SM4-CBC round-trip failed");
}
```

CBC 不提供完整性；新协议优先 GCM/CCM。

## 失败行为

- key、IV/nonce、mode、padding、tag 长度和 AAD 组合非法时抛 `GmkitException`。
- PKCS7 解密校验填充；NONE 要求 ECB/CBC 输入为 16 字节倍数。
- ZERO 会移除尾部零字节，不能无损表示任意二进制。
- `SM4CipherResult` 不是稳定跨语言 schema，传输前应固定字段编码和协议版本。

## Reference

- [SM4 Javadoc](/api/java/latest/cn/gmkit/sm4/package-summary.html)
- [跨语言 SM4 模式和 AEAD](/algorithms/SM4.html)
- [安全上下文](/api/java/core.html#provider-与安全上下文)
