---
title: Java SM9 API
description: 说明 Java SM9 平台诊断、句柄、签名、IBE、PEM、文件限制与资源关闭。
pageInfo: false
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

`cn.gmkit:gmkit-sm9` 通过 JNI 调用随 JAR 分发的 GmSSL 本地动态库（native runtime），支持签名/验签、基于身份的加解密、PEM 导入导出和流式签名上下文；不支持 SM9 密钥交换。

SM9 把身份字符串直接纳入密钥派生，适合已有 KGC、身份登记和主公钥分发体系的协议。采用前应确认对端实现、五个目标平台、身份规范化规则、KGC 隔离方式和合规要求；如果系统只有普通公私钥与证书体系，不能仅凭 API 可用就把它替换成 SM9。

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

完整主密钥由 KGC 保存，用于派生用户签名私钥；只含公开部分的导入对象可分发给验签方，不能派生用户私钥。

### `SM9SignKey`

```java
String getId()
void exportEncryptedPrivateKeyInfoPem(String password, String file)
static SM9SignKey importEncryptedPrivateKeyInfoPem(
    String password, String file, String id)
void close()
```

签名私钥 PEM 不携带可供应用校验的身份绑定信息。导入方法允许 `id` 为 null，此时 `getId()` 也返回 null；签名运算仍可执行，但验签方必须使用派生该私钥时的原始身份。应用应把身份与 PEM 作为同一条受保护记录保存，不能把 `id` 当作可任意替换的显示标签。

## 签名示例

```java
byte[] data = "order=GMKIT-DEMO-0001&amount=88.00"
    .getBytes(java.nio.charset.StandardCharsets.UTF_8);
byte[] tampered = "order=GMKIT-DEMO-0001&amount=99.00"
    .getBytes(java.nio.charset.StandardCharsets.UTF_8);
String id = "warehouse@gmkit.cn";

try (SM9SignMasterKey master = SM9.generateSignMasterKey();
     SM9SignKey userKey = SM9.extractSignKey(master, id)) {
    byte[] signature = SM9.sign(userKey, data);
    if (!SM9.verify(master, id, data, signature)) {
        throw new IllegalStateException("SM9 verification failed");
    }
    if (SM9.verify(master, "other@gmkit.cn", data, signature)
            || SM9.verify(master, id, tampered, signature)) {
        throw new IllegalStateException("SM9 accepted changed identity or message");
    }
}
```

验签数学上不成立返回 false；参数、句柄或 native 调用失败抛 `SM9Exception`。签名含随机性，不要把一次运行得到的签名字节写成所谓固定标准向量。

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

完整主密钥由 KGC 保存并派生用户解密私钥；公开主密钥可分发给加密方，公开部分不能派生用户私钥。

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

SM9 单次明文必须为 1–255 字节，单位是 UTF-8 编码后的实际字节数；DER 密文最多 367 字节。更大数据应使用混合加密：随机生成 16 字节 SM4 会话 key，用 SM4-GCM 等认证加密处理正文，只用 SM9 保护会话 key。算法、接收方身份、nonce、AAD、tag 和载荷版本都必须随密文保存。

```java
byte[] plaintext =
    "order=GMKIT-DEMO-0001&amount=88.00"
        .getBytes(java.nio.charset.StandardCharsets.UTF_8);
String id = "warehouse@gmkit.cn";

try (SM9EncMasterKey master = SM9.generateEncMasterKey();
     SM9EncKey userKey = SM9.extractEncKey(master, id)) {
    byte[] ciphertext = SM9.encrypt(master, id, plaintext);
    byte[] decrypted = SM9.decrypt(userKey, ciphertext);
    if (!java.util.Arrays.equals(plaintext, decrypted)) {
        throw new IllegalStateException("SM9 IBE round-trip failed");
    }
}
```

对 256 字节输入，API 会在进入 native 前抛 `SM9Exception`：

```java
try (SM9EncMasterKey master = SM9.generateEncMasterKey()) {
    byte[] tooLong = new byte[SM9EncMasterKey.MAX_PLAINTEXT_SIZE + 1];
    try {
        SM9.encrypt(master, "warehouse@gmkit.cn", tooLong);
        throw new IllegalStateException("256-byte plaintext must fail");
    } catch (SM9Exception expected) {
        // 预期：SM9 IBE 只接受 1–255 字节。
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
- `SM9SignKey` 导入时的 id 是可空元数据；`SM9EncKey` 解密时必须持有原始 id。PEM 本身不替应用维护“身份—私钥”映射。
- 不要把用户 ID、文件路径或口令自动 trim 后再调用，否则可能改变身份或目标文件。
- 生产口令不应硬编码在源码或日志中。

下面的测试式示例把 KGC 持有的主私钥留在生成端，只向验签端交付公开主密钥，同时把身份和用户私钥作为一条记录保存：

```java
java.nio.file.Path directory = java.nio.file.Files.createTempDirectory("gmkit-sm9-");
java.nio.file.Path publicPem = directory.resolve("sign-master-public.pem");
java.nio.file.Path userPem = directory.resolve("warehouse-sign-key.pem");
String id = "warehouse@gmkit.cn";
String testPassword = "manual-test-only"; // 仅限测试；生产环境从密钥系统读取。
byte[] message = "order=GMKIT-DEMO-0001&amount=88.00"
    .getBytes(java.nio.charset.StandardCharsets.UTF_8);

try (SM9SignMasterKey master = SM9.generateSignMasterKey();
     SM9SignKey userKey = master.extractKey(id)) {
    master.exportPublicMasterKeyPem(publicPem.toString());
    userKey.exportEncryptedPrivateKeyInfoPem(testPassword, userPem.toString());
}

try (SM9SignMasterKey verifierKey =
         SM9SignMasterKey.importPublicMasterKeyPem(publicPem.toString());
     SM9SignKey importedUserKey =
         SM9SignKey.importEncryptedPrivateKeyInfoPem(
             testPassword, userPem.toString(), id)) {
    byte[] signature = SM9.sign(importedUserKey, message);
    if (!SM9.verify(verifierKey, id, message, signature)) {
        throw new IllegalStateException("imported SM9 keys do not match");
    }
}
```

示例里的随机主密钥和随机签名没有固定字面值；断言验证的是 PEM 往返与身份绑定。实际测试应在 `finally` 中删除临时文件；业务代码还应采用受控目录、最小文件权限和明确的密钥销毁策略。

## 生命周期与异常

`SM9SignMasterKey`、`SM9SignKey`、`SM9EncMasterKey`、`SM9EncKey`、`SM9Signature` 都实现 `AutoCloseable`：

- 始终使用 try-with-resources。
- `close()` 可重复调用。
- close 后再次操作抛 `SM9Exception`。
- 先关闭子密钥还是主密钥没有隐式级联；每个对象都应独立关闭。

`SM9Exception` 和 `SM9UnsupportedPlatformException` 都提供 `(String message)` 与 `(String message, Throwable cause)` 构造器。后者继承前者，用于明确的平台/native 不支持场景。

## 标准与发布证据

| 层级 | 实际执行内容 | 能证明什么 |
|:--|:--|:--|
| GmSSL 上游 | 固定版本 `sm9test.c` 的 `ks`、`ds`、`ke`、`de` 派生向量 | 底层 SM9 运算与固定向量一致 |
| Java/JNI | 正确与错误身份、消息篡改、IBE、长度上限、PEM、关闭后访问 | Java 参数、句柄和 native 桥接行为一致 |
| 聚合 JAR | 五个平台分别运行打包产物，检查平台选择、签名、IBE 与 Unicode PEM | 发布物确实带有并加载当前平台 runtime |

固定向量来自锁定提交的 [`tests/sm9test.c`](https://github.com/guanzhi/GmSSL/blob/d655c06b3a6b0fe8cff900f293bf0e5aac6eb0a2/tests/sm9test.c)。构建脚本在 JNI 测试之前执行 `ctest --output-on-failure --no-tests=error -R ^sm9$`；找不到测试或任一向量失败都会终止流水线。Java 生成的随机密钥、随机签名和随机密文只用于行为回归，不冒充固定标准向量。

## 相关页面

- [SM9 平台与验证边界](/algorithms/SM9.html)
- [Java API 首页](/api/java/)
