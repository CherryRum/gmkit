---
title: Java SM2 + SM4 混合加密 API
description: 说明 SM2Sm4Hybrid、混合载荷字段、编码 getter 和序列化稳定性边界。
pageInfo: false
contributors: false
editLink: false
icon: boxes-stacked
order: 7
category:
  - API 说明书
  - Java
tag:
  - SM2
  - SM4
  - 混合加密
---

# Java SM2 + SM4 混合加密 API

`SM2Sm4Hybrid` 执行 SM2 + SM4 混合加密：生成一次性 SM4 会话 key，用 SM4 处理业务数据，再用接收方 SM2 公钥加密会话 key。它适合把超过 SM2 单次加密范围的订单、文件片段或消息交给指定接收方；它不负责证书校验、密钥轮换，也不定义可直接上网传输的序列化格式。

返回的 `SM2Sm4HybridPayload` 是 Java 值对象。跨服务或跨语言使用时，调用方必须在外层协议中固定 schema 版本、字段编码和接收方 key id。

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

## 加密重载

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

## 解密重载

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

解密会先用 SM2 C1C3C2 恢复会话 key，再按 payload 中的 mode、padding、IV、AAD 和 tag 执行 SM4。默认 GCM 路径中，密文、nonce、AAD 或 tag 不一致会抛 `GmkitException`，不会返回未认证明文；会话 key 密文损坏也会在 SM2 校验阶段失败。若调用方显式改用 CBC、CTR 等非 AEAD 模式，库无法替应用补上完整性保护。

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

## 默认 GCM：成功与篡改失败

```java
SM2KeyPair keys = SM2Util.generateKeyPair();
SM2Sm4Hybrid hybrid = new SM2Sm4Hybrid();

String message = "order=GMKIT-DEMO-0001&amount=88.00";

SM2Sm4HybridPayload payload =
    hybrid.encrypt(keys.publicKey(), message);
if (!payload.hasIv() || !payload.hasTag()
        || payload.mode() != SM4CipherMode.GCM) {
    throw new IllegalStateException("hybrid metadata incomplete");
}
String plaintext = hybrid.decryptToUtf8(keys.privateKey(), payload);
if (!message.equals(plaintext)) {
    throw new IllegalStateException("hybrid round-trip failed");
}

// 改动 tag 后，GCM 必须拒绝返回明文。
byte[] changedTag = payload.tag();
changedTag[0] ^= 0x01;
SM2Sm4HybridPayload changed = new SM2Sm4HybridPayload(
    payload.encryptedKey(), payload.ciphertext(), payload.iv(),
    payload.aad(), changedTag, payload.mode(), payload.padding());
try {
    hybrid.decrypt(keys.privateKey(), changed);
    throw new IllegalStateException("tampered tag must fail");
} catch (GmkitException expected) {
    // 预期：认证失败。
}
```

自定义 AAD：

```java
SM2KeyPair keys = SM2Util.generateKeyPair();
SM2Sm4Hybrid hybrid = new SM2Sm4Hybrid();
SM4Options options = SM4Options.builder()
    .mode(SM4CipherMode.GCM)
    .padding(SM4Padding.NONE)
    .aad(Texts.utf8("tenant=demo;schema=1"))
    .tagLength(16)
    .build();
SM2Sm4HybridPayload payload =
    hybrid.encrypt(
        keys.publicKey(),
        Texts.utf8("order=GMKIT-DEMO-0001&amount=88.00"),
        options);
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

## 可执行案例

下面的 GCM 元数据、解密往返和篡改 tag 失败断言直接来自 JUnit 文档测试。

::: details 查看测试源码
```java
<!-- @include: ../../../../packages/java/gmkit/src/test/java/cn/gmkit/PublicApiManualExamplesTest.java#java-hybrid-example -->
```
:::

## 相关页面

- [Java SM2 API](/api/java/sm2.html)
- [Java SM4 API](/api/java/sm4.html)
- [公共混合加密边界](/api/common.html#java-混合加密)
