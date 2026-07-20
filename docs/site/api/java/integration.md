---
title: Java 集成便利 API
icon: boxes-stacked
order: 7
category:
  - API Reference
  - Java
tag:
  - SM2
  - SM4
  - 混合加密
---

# Java 集成便利 API

`SM2Sm4Hybrid` 为后端提供 SM2 + SM4 混合加密：生成一次性 SM4 会话 key，用 SM4 处理业务数据，再用 SM2 公钥加密会话 key。它是 Java 便利对象，不是已定义的跨语言 wire format。

## 构造和默认值

```java
new SM2Sm4Hybrid()
new SM2Sm4Hybrid(GmSecurityContext securityContext)
```

默认加密配置：

| 字段 | 默认值 |
|:--|:--|
| 会话 key | 16 字节随机 SM4 key |
| 数据算法 | SM4-GCM |
| nonce | 每次从安全上下文生成 12 字节 |
| tag | 16 字节 |
| padding | NONE |
| key 封装 | SM2 C1C3C2 |

传入自定义 `SM4Options` 时，缺少必需 IV/nonce 会按模式自动生成：GCM/CCM 为 12 字节，其他非 ECB 模式为 16 字节。

## 加密完整重载

```java
SM2Sm4HybridPayload encrypt(
    String publicKeyHex, byte[] plaintext)
SM2Sm4HybridPayload encrypt(
    String publicKeyHex, String plaintext)
SM2Sm4HybridPayload encrypt(
    String publicKeyHex,
    String plaintext,
    Charset charset,
    SM4Options options)
SM2Sm4HybridPayload encrypt(
    String publicKeyHex,
    byte[] plaintext,
    SM4Options options)
```

字符串简写使用 UTF-8；需要二进制或其他 Charset 时使用对应重载。自定义 options 可以改用 CBC/CTR 等模式，但调用方同时承担完整性设计责任。

## 解密完整重载

```java
byte[] decrypt(
    String privateKeyHex,
    SM2Sm4HybridPayload payload)
String decryptToUtf8(
    String privateKeyHex,
    SM2Sm4HybridPayload payload)
String decryptToString(
    String privateKeyHex,
    SM2Sm4HybridPayload payload,
    Charset charset)
```

解密会先用 SM2 C1C3C2 恢复会话 key，再按 payload 中的 mode、padding、IV、AAD 和 tag 执行 SM4。任一字段被篡改都可能导致解密或认证失败。

## `SM2Sm4HybridPayload`

构造器：

```java
new SM2Sm4HybridPayload(
    byte[] encryptedKey,
    byte[] ciphertext,
    byte[] iv,
    byte[] aad,
    byte[] tag,
    SM4CipherMode mode,
    SM4Padding padding)
```

全部公开访问器：

```java
byte[] encryptedKey()
String encryptedKeyHex()
String encryptedKeyBase64()

byte[] ciphertext()
String ciphertextHex()
String ciphertextBase64()

byte[] iv()
boolean hasIv()
String ivHex()

byte[] aad()
boolean hasAad()

byte[] tag()
boolean hasTag()
String tagHex()
String tagBase64()

SM4CipherMode mode()
SM4Padding padding()
```

所有 byte[] 构造参数和 getter 都执行防御性复制。不存在的 IV/AAD/tag 返回 null，相应 `has*` 返回 false。

## 完整示例

```java
SM2KeyPair keys = SM2Util.generateKeyPair();
SM2Sm4Hybrid hybrid = new SM2Sm4Hybrid();

SM2Sm4HybridPayload payload =
    hybrid.encrypt(keys.publicKey(), "需要保护的业务数据");
if (!payload.hasIv() || !payload.hasTag()
        || payload.mode() != SM4CipherMode.GCM) {
    throw new IllegalStateException("hybrid metadata incomplete");
}
String plaintext = hybrid.decryptToUtf8(keys.privateKey(), payload);
if (!"需要保护的业务数据".equals(plaintext)) {
    throw new IllegalStateException("hybrid round-trip failed");
}
```

自定义 AAD：

```java
SM2KeyPair keys = SM2Util.generateKeyPair();
SM2Sm4Hybrid hybrid = new SM2Sm4Hybrid();
SM4Options options = SM4Options.builder()
    .mode(SM4CipherMode.GCM)
    .padding(SM4Padding.NONE)
    .aad(Texts.utf8("tenant=example;schema=1"))
    .tagLength(16)
    .build();
SM2Sm4HybridPayload payload =
    hybrid.encrypt(keys.publicKey(), Texts.utf8("binary payload"), options);
```

## 序列化边界

`SM2Sm4HybridPayload` 没有内置 JSON、CBOR 或二进制序列化格式。跨进程传输必须由应用定义 schema，至少固定：

```json
{
  "version": 1,
  "encryptedKey": "<base64>",
  "ciphertext": "<base64>",
  "iv": "<base64>",
  "aad": "<base64-or-null>",
  "tag": "<base64-or-null>",
  "mode": "GCM",
  "padding": "NONE"
}
```

- 每个二进制字段必须固定同一种编码，不要依赖自动识别。
- schema 必须带版本；枚举按稳定字符串传输。
- AAD 必须逐字节还原，不能重新拼接业务对象后假定相同。
- 该对象不包含 key id、证书链或密钥轮换信息，应用需在外层协议补充。
- TypeScript 对端需要使用 SM2/SM4 API 逐字段实现相同流程，不能直接反序列化成 Java 对象。

## Reference

- [integration Javadoc](/api/java/latest/cn/gmkit/integration/package-summary.html)
- [Java SM2 API](/api/java/sm2.html)
- [Java SM4 API](/api/java/sm4.html)
- [公共混合加密边界](/api/common.html#java-混合加密)
