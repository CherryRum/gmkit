---
title: Java SM9 API
description: 说明 Java SM9 平台诊断、句柄、签名、IBE、PEM、文件限制与资源关闭。
icon: id-card
order: 6
category:
  - API 说明书
  - Java
tag:
  - SM9
  - JNI
  - GmSSL
  - IBE
---

# Java SM9 API

`cn.gmkit:gmkit-sm9` 通过 JNI 调用随 JAR 分发的 GmSSL native runtime，支持签名/验签、基于身份的加解密、PEM 导入导出和流式签名上下文；不支持 SM9 密钥交换。

## 启动诊断

```java
SM9.isAvailable()
SM9.nativeVersion()
SM9.nativePlatform()
SM9.nativeLoadErrorMessage()
```

| 方法 | 返回 |
|:--|:--|
| `isAvailable()` | native 是否成功加载 |
| `nativeVersion()` | GMKit native bridge 版本标识 |
| `nativePlatform()` | 如 `linux-x86_64`；无法映射时为 `unsupported` |
| `nativeLoadErrorMessage()` | 已可用时为 null，否则为加载诊断 |

```java
if (!SM9.isAvailable()) {
    throw new IllegalStateException(
        "SM9 unavailable on " + SM9.nativePlatform()
            + ": " + SM9.nativeLoadErrorMessage());
}
```

不要等到首个业务请求才发现 native 不可用。应用启动健康检查应记录平台标识和加载错误，但不要记录密钥、PEM 口令或用户私钥。

## 门面方法

`SM9` 提供一次性操作：

```java
SM9SignMasterKey generateSignMasterKey()
SM9EncMasterKey generateEncMasterKey()
SM9SignKey extractSignKey(SM9SignMasterKey master, String id)
SM9EncKey extractEncKey(SM9EncMasterKey master, String id)

byte[] sign(SM9SignKey signKey, byte[] data)
boolean verify(
    SM9SignMasterKey masterPublicKey,
    String id,
    byte[] data,
    byte[] signature)

byte[] encrypt(
    SM9EncMasterKey masterPublicKey,
    String id,
    byte[] plaintext)
byte[] decrypt(SM9EncKey encKey, byte[] ciphertext)
```

门面会为一次性签名/验签自动创建并关闭 `SM9Signature`，但传入的密钥对象仍由调用方关闭。

## 签名密钥类型

### `SM9SignMasterKey`

```java
static SM9SignMasterKey generate()
SM9SignKey extractKey(String id)
void exportEncryptedMasterKeyInfoPem(String password, String file)
static SM9SignMasterKey importEncryptedMasterKeyInfoPem(
    String password, String file)
void exportPublicMasterKeyPem(String file)
static SM9SignMasterKey importPublicMasterKeyPem(String file)
void close()
```

完整主密钥用于 KGC 派生用户签名私钥；只含公开部分的导入对象用于验签，不应用来派生私钥。

### `SM9SignKey`

```java
String getId()
void exportEncryptedPrivateKeyInfoPem(String password, String file)
static SM9SignKey importEncryptedPrivateKeyInfoPem(
    String password, String file, String id)
void close()
```

导入用户私钥时必须同时提供原始身份。身份不是 PEM 外的可替换标签；签名私钥、验签身份和派生身份必须逐字节一致。

## 签名示例

```java
byte[] data = "SM9 签名消息".getBytes(java.nio.charset.StandardCharsets.UTF_8);
String id = "alice@example";

try (SM9SignMasterKey master = SM9.generateSignMasterKey();
     SM9SignKey userKey = SM9.extractSignKey(master, id)) {
    byte[] signature = SM9.sign(userKey, data);
    if (!SM9.verify(master, id, data, signature)) {
        throw new IllegalStateException("SM9 verification failed");
    }
}
```

验签不通过返回 false；参数、句柄或 native 调用失败抛异常。

## 加密密钥类型

### `SM9EncMasterKey`

```java
static final int MAX_PLAINTEXT_SIZE  // 255

static SM9EncMasterKey generate()
SM9EncKey extractKey(String id)
byte[] encrypt(byte[] plaintext, String id)
void exportEncryptedMasterKeyInfoPem(String password, String file)
static SM9EncMasterKey importEncryptedMasterKeyInfoPem(
    String password, String file)
void exportPublicMasterKeyPem(String file)
static SM9EncMasterKey importPublicMasterKeyPem(String file)
void close()
```

完整主密钥由 KGC 派生用户解密私钥；公开主密钥可分发给加密方。

### `SM9EncKey`

```java
static final int MAX_CIPHERTEXT_SIZE  // 367

String getId()
byte[] decrypt(byte[] ciphertext)
void exportEncryptedPrivateKeyInfoPem(String password, String file)
static SM9EncKey importEncryptedPrivateKeyInfoPem(
    String password, String file, String id)
void close()
```

SM9 单次明文最多 255 字节，DER 密文最多 367 字节。更大数据应使用混合加密：随机生成 SM4 key 加密正文，只用 SM9 封装会话 key。

```java
byte[] plaintext =
    "SM9 IBE".getBytes(java.nio.charset.StandardCharsets.UTF_8);
String id = "bob@example";

try (SM9EncMasterKey master = SM9.generateEncMasterKey();
     SM9EncKey userKey = SM9.extractEncKey(master, id)) {
    byte[] ciphertext = SM9.encrypt(master, id, plaintext);
    byte[] decrypted = SM9.decrypt(userKey, ciphertext);
    if (!java.util.Arrays.equals(plaintext, decrypted)) {
        throw new IllegalStateException("SM9 IBE round-trip failed");
    }
}
```

## 流式 `SM9Signature`

```java
new SM9Signature(boolean doSign)
void reset(boolean doSign)
SM9Signature update(byte[] data)
SM9Signature update(byte[] data, int offset, int length)
byte[] sign(SM9SignKey signKey)
boolean verify(
    byte[] signature,
    SM9SignMasterKey masterPublicKey,
    String id)
void close()
```

`doSign=true` 初始化签名模式，false 初始化验签模式。`reset` 可在同一未关闭句柄上开始新操作；`update` 的零长度区间合法，越界区间抛异常。

```java
byte[] data = new byte[8192];
try (SM9SignMasterKey master = SM9.generateSignMasterKey();
     SM9SignKey userKey = master.extractKey("stream@example");
     SM9Signature signer = new SM9Signature(true);
     SM9Signature verifier = new SM9Signature(false)) {
    signer.update(data, 0, 4096).update(data, 4096, 4096);
    byte[] signature = signer.sign(userKey);

    verifier.update(data);
    if (!verifier.verify(signature, master, "stream@example")) {
        throw new IllegalStateException("stream verification failed");
    }
}
```

上下文有 native 可变状态，不能跨线程并发使用。

## PEM 与身份

- PEM 文件路径和口令必须非空白；I/O、口令或格式错误抛 `SM9Exception`。
- 主私钥和用户私钥只提供口令加密 PEM 导出；公开主密钥可独立导出。
- 用户 ID 使用 Java String 的 UTF-8 字节，首尾空格属于身份并会保留，全空白 ID 被拒绝。
- 不要把用户 ID、文件路径或口令自动 trim 后再调用，否则可能改变身份或目标文件。
- 生产口令不应硬编码在源码或日志中。

## 生命周期与异常

`SM9SignMasterKey`、`SM9SignKey`、`SM9EncMasterKey`、`SM9EncKey`、`SM9Signature` 都实现 `AutoCloseable`：

- 始终使用 try-with-resources。
- `close()` 可重复调用。
- close 后再次操作抛 `SM9Exception`。
- 先关闭子密钥还是主密钥没有隐式级联；每个对象都应独立关闭。

`SM9Exception` 和 `SM9UnsupportedPlatformException` 都提供 `(String message)` 与 `(String message, Throwable cause)` 构造器。后者继承前者，用于明确的平台/native 不支持场景。

## 相关页面

- [SM9 平台与验证边界](/algorithms/SM9.html)
- [Java API 首页](/api/java/)
