---
title: Java ZUC API
description: 说明 ZUC、ZUCUtil、密钥流、EEA3、EIA3 和各接口长度单位。
icon: signal
order: 5
category:
  - API 说明书
  - Java
tag:
  - ZUC
  - EEA3
  - EIA3
---

# Java ZUC API

`ZUC` 和 `ZUCUtil` 都是无状态静态入口，公开方法签名和语义一致。当前只支持 ZUC-128、128-EEA3 和 128-EIA3，不支持 ZUC-256。

## 常量

```java
ZUC.KEY_LENGTH       // 16
ZUC.IV_LENGTH        // 16
ZUCUtil.KEY_LENGTH   // 16
ZUCUtil.IV_LENGTH    // 16
```

key/IV 的 byte[] 必须恰好 16 字节；字符串必须为 32 个 Hex 字符。

## 密钥流

以下四个静态方法同时存在于 `ZUC` 和 `ZUCUtil`：

```java
byte[] keystream(byte[] key, byte[] iv, int lengthBytes)
String keystreamHex(
    String keyHex, String ivHex, int lengthBytes)
int[] keystreamWords(
    byte[] key, byte[] iv, int lengthWords)
String keystreamWordsHex(
    String keyHex, String ivHex, int lengthWords)
```

| 方法 | length 单位 | 返回 |
|:--|:--|:--|
| `keystream` | byte | 原始字节 |
| `keystreamHex` | byte | 小写 Hex |
| `keystreamWords` | 32-bit word | `int[]`，按无符号位模式理解 |
| `keystreamWordsHex` | 32-bit word | 每个 word 按大端拼接 |

```java
String stream = ZUC.keystreamHex(
    "00000000000000000000000000000000",
    "00000000000000000000000000000000",
    8);
if (!"27bede74018082da".equals(stream)) {
    throw new IllegalStateException("ZUC vector mismatch");
}
```

## 通用加解密

以下六个方法同时存在于两个类：

```java
byte[] encrypt(byte[] key, byte[] iv, byte[] plaintext)
String encryptHex(String keyHex, String ivHex, String plaintext)
String encryptBase64(String keyHex, String ivHex, String plaintext)

byte[] decrypt(byte[] key, byte[] iv, byte[] ciphertext)
String decryptHexToUtf8(
    String keyHex, String ivHex, String ciphertextHex)
String decryptBase64ToUtf8(
    String keyHex, String ivHex, String ciphertextBase64)
```

字符串明文/结果使用 UTF-8。二进制协议使用 byte[]。ZUC 加密和解密都是与同一密钥流异或；相同 key 下复用 IV 会泄漏消息关系，而且这些入口不提供完整性保护。

```java
byte[] key = HexCodec.decodeStrict(
    "000102030405060708090a0b0c0d0e0f", "ZUC key");
byte[] iv = HexCodec.decodeStrict(
    "101112131415161718191a1b1c1d1e1f", "ZUC IV");
byte[] plaintext = new byte[] {0x00, (byte) 0xff, (byte) 0x80, 0x41};
byte[] ciphertext = ZUC.encrypt(key, iv, plaintext);
if (!java.util.Arrays.equals(plaintext, ZUC.decrypt(key, iv, ciphertext))) {
    throw new IllegalStateException("ZUC round-trip failed");
}
```

## EEA3

两个类都提供以下三个重载：

```java
String eea3(
    String keyHex,
    int count,
    int bearer,
    int direction,
    int bitLength)

byte[] eea3Encrypt(
    String keyHex,
    int count,
    int bearer,
    int direction,
    byte[] message,
    int bitLength)

byte[] eea3Encrypt(
    String keyHex,
    int count,
    int bearer,
    int direction,
    byte[] message)
```

`eea3` 是旧兼容密钥流入口，输出向上取整到 32-bit word 的 Hex。标准消息加密使用 `eea3Encrypt`；无 bitLength 重载处理整个数组，有 bitLength 重载会把最后一字节未使用低位清零。

| 参数 | Java 约束 |
|:--|:--|
| `count` | `int` 的 32-bit 位模式，可用十六进制字面量 |
| `bearer` | 0–31 |
| `direction` | 0 或 1 |
| `bitLength` | 非负且不超过消息长度乘 8 |

## EIA3

两个类都提供以下三个重载：

```java
String eia3(
    String keyHex,
    int count,
    int bearer,
    int direction,
    byte[] message)
String eia3(
    String keyHex,
    int count,
    int bearer,
    int direction,
    byte[] message,
    int bitLength)
String eia3(
    String keyHex,
    int count,
    int bearer,
    int direction,
    String message)
```

返回固定 8 个小写 Hex 字符的 32-bit MAC-I。字符串重载按 UTF-8 认证完整文本。

```java
String mac = ZUC.eia3(
    "000102030405060708090a0b0c0d0e0f",
    0x01234567,
    0x0a,
    0,
    HexCodec.decodeStrict("5bad724710ba1c56", "message"),
    64);
if (!"1b3d0f74".equals(mac)) {
    throw new IllegalStateException("EIA3 vector mismatch");
}
```

## 失败行为与互操作

- key/IV 长度、Hex、bearer、direction、length 或 bitLength 非法时抛 `GmkitException`。
- TypeScript 的 `count` 是 0 到 `0xffffffff` 的 number；Java 用有符号 `int` 保存相同 32-bit 位模式。
- TypeScript `zucGenerateKeystream` 返回 `Uint32Array`；Java `keystreamWords` 返回 `int[]`，序列化时都应按无符号大端 word 处理。
- EIA3 验证 MAC 时先 Hex 解码，再使用 `Bytes.constantTimeEquals`。

## 相关页面

- [跨语言 ZUC/EEA3/EIA3 向量](/algorithms/ZUC.html)
- [核心编码工具](/api/java/core.html)
