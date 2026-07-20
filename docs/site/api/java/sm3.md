---
title: Java SM3 API
icon: fingerprint
order: 3
category:
  - API Reference
  - Java
tag:
  - SM3
  - HMAC
  - 摘要
---

# Java SM3 API

`SM3` 是无状态实例入口，`SM3Util` 是同语义静态入口。两者提供一次性摘要和 HMAC-SM3，不提供 TypeScript `SM3.update()` 那样的增量对象。

## 常量与入口

```java
SM3.DIGEST_LENGTH        // 32
SM3Util.DIGEST_LENGTH    // 32

new SM3()
```

`SM3` 实例不保存消息状态，重复调用不会互相影响。

## 摘要完整重载矩阵

以下九个重载同时存在于 `SM3` 和 `SM3Util`；静态类只多出 `static`：

```java
byte[] digest(byte[] data)
byte[] digest(String data)
byte[] digest(String data, Charset charset)

String digestHex(byte[] data)
String digestHex(String data)
String digestHex(String data, Charset charset)

String digestBase64(byte[] data)
String digestBase64(String data)
String digestBase64(String data, Charset charset)
```

| 输入/输出 | 语义 |
|:--|:--|
| `byte[]` 输入 | 原始字节 |
| `String` 输入 | 无 Charset 时使用 UTF-8 |
| `byte[]` 返回 | 固定 32 字节摘要 |
| `digestHex` | 固定 64 个小写 Hex 字符 |
| `digestBase64` | 标准 Base64 |

```java
String digest = SM3Util.digestHex("abc");
if (!"66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0"
        .equals(digest)) {
    throw new IllegalStateException("SM3 vector mismatch");
}
```

## HMAC 完整重载矩阵

以下九个重载同样同时存在于 `SM3` 和 `SM3Util`：

```java
byte[] hmac(byte[] key, byte[] data)
byte[] hmac(byte[] key, String data)
byte[] hmac(byte[] key, String data, Charset charset)

String hmacHex(byte[] key, byte[] data)
String hmacHex(byte[] key, String data)
String hmacHex(byte[] key, String data, Charset charset)

String hmacBase64(byte[] key, byte[] data)
String hmacBase64(byte[] key, String data)
String hmacBase64(byte[] key, String data, Charset charset)
```

HMAC key 只接受 `byte[]`，避免把 Hex key 和文本 key 混为一谈；Hex key 先用 `HexCodec.decodeStrict`。

```java
byte[] key = "secret-key".getBytes(java.nio.charset.StandardCharsets.UTF_8);
String mac = SM3Util.hmacHex(key, "hmac-payload");
if (!"b57fb50bbc8ad6f9b11129cf1ec67cf0c658f0d4b597ae3f05a64eaa4a22d312"
        .equals(mac)) {
    throw new IllegalStateException("HMAC-SM3 vector mismatch");
}
```

验证 MAC 时对字节使用 `Bytes.constantTimeEquals`。普通 SM3 摘要不能替代 HMAC，也不能直接用作用户密码存储。

## 失败行为

- null 消息、null key、null Charset 或底层 Provider 失败会抛异常。
- 空消息是合法摘要输入；业务是否允许空值应在调用前校验。
- API 不维护可变消息状态，`SM3` 实例无需 reset 或 close。

## Reference

- [SM3 Javadoc](/api/java/latest/cn/gmkit/sm3/package-summary.html)
- [跨语言 SM3 固定向量](/algorithms/SM3.html)
- [核心编码与敏感值比较](/api/java/core.html)
