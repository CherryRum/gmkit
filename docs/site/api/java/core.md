---
title: Java 核心公共 API
description: 说明 Java 编码、字节、Provider、安全上下文、格式枚举和公共异常类型。
pageInfo: false
icon: toolbox
order: 1
category:
  - API 说明书
  - Java
tag:
  - 编码
  - Provider
  - SecureRandom
  - 异常
---

# Java 核心公共 API

`cn.gmkit.core` 提供所有算法共享的严格编码、字节操作、文本转换、Provider、安全上下文、格式枚举和异常类型。

这些类型用于明确协议边界，不替代算法入口的长度和安全校验。新代码应优先使用显式 `InputFormat`/`OutputFormat`；只有接收无法修改的旧输入时才使用自动识别。

## Hex 与 Base64

### `HexCodec`

```java
static byte[] decodeStrict(String input, String label)
static String encode(byte[] input)
static boolean isHex(String input)
static String normalize(String input)
static String normalize(String input, String label)
```

- `decodeStrict` 接受大小写 Hex 和允许的 `0x` 前缀，拒绝 null、奇数长度和非法字符。
- `encode` 返回不带前缀的小写 Hex。
- `isHex` 只判断编码形态，不验证字段长度。
- `normalize` 去除允许的前缀并转小写；带 label 的重载用于生成可定位的错误消息。

### `Base64Codec`

```java
static byte[] decode(String input, String label)
static String encode(byte[] input)
static boolean isBase64(String input)
static boolean looksLikeBase64(String input)
```

`decode` 使用标准 RFC 4648 Base64，拒绝非法字符、长度和填充。`isBase64` 执行严格判断；`looksLikeBase64` 只用于自动识别候选，不能替代协议格式字段。

### `ByteEncodings`

```java
static String encode(byte[] input, OutputFormat outputFormat)
static byte[] decode(String input, InputFormat inputFormat, String label)
static byte[] decodeAuto(String input, String label)
```

`InputFormat` 和 `OutputFormat` 枚举成员均为 `HEX`、`BASE64`。`decodeAuto` 优先识别 Hex；稳定协议应调用显式格式重载。

```java
byte[] bytes = ByteEncodings.decode("AP+AQQ==", InputFormat.BASE64, "payload");
String hex = ByteEncodings.encode(bytes, OutputFormat.HEX);
if (!"00ff8041".equals(hex)) {
    throw new IllegalStateException("encoding mismatch");
}

// 非法 Hex 必须抛错，不能静默截断或替换。
org.junit.jupiter.api.Assertions.assertThrows(
    GmkitException.class,
    () -> HexCodec.decodeStrict("0xz1", "payload"));
```

## 文本与字节

### `Texts`

```java
static final Charset UTF_8
static byte[] utf8(String input)
static String utf8(byte[] input)
static byte[] bytes(String input, Charset charset)
static String text(byte[] input, Charset charset)
```

无 Charset 重载固定使用 UTF-8。任意二进制不要调用 `utf8(byte[])`；解密二进制应保留 `byte[]`。

### `Bytes`

```java
static byte[] clone(byte[] input)
static byte[] requireNonNull(byte[] input, String label)
static byte[] requireNonEmpty(byte[] input, String label)
static byte[] requireLength(byte[] input, int expectedLength, String label)
static byte[] concat(byte[]... arrays)
static boolean constantTimeEquals(byte[] left, byte[] right)
static byte[] copyOfRange(byte[] input, int from, int to)
```

`clone`、`concat`、`copyOfRange` 返回新数组。`constantTimeEquals` 对 null 或不同长度返回 false；等长时扫描全部字节，适合比较摘要、MAC 和 tag。

### `Checks`

```java
static <T> T requireNonNull(T value, String label)
static String requireNonBlank(String value, String label)
static <T> T defaultIfNull(T value, T defaultValue)
static byte[] requireNonEmpty(byte[] value, String label)
static boolean hasBytes(byte[] value)
```

这些方法用于统一参数校验。它们不会校验密码字段的算法长度；例如 SM4 key 仍应由算法入口校验为 16 字节。

## Provider 与安全上下文

### `BcProviders`

```java
static Provider create()
static Provider getIfPresent()
static Provider defaultProvider()
static Provider ensureRegistered()
static Provider registerIfNeeded(Provider provider)
```

| API | 是否修改 JVM 全局 Provider 列表 |
|:--|:--:|
| `create` | 否，创建独立 BC Provider |
| `getIfPresent` | 否，只查询 |
| `defaultProvider` | 否，返回可直接传给 JCA 的默认实例 |
| `ensureRegistered` | 是，缺少时注册 |
| `registerIfNeeded` | 可能，按传入实例注册 |

容器、应用服务器和有集中安全策略的进程应由应用统一管理 Provider，避免库代码隐式修改全局顺序。

### `GmSecurityContext`

```java
static Builder builder()
Provider provider()
SecureRandom secureRandom()
boolean registerProvider()

Builder provider(Provider provider)
Builder secureRandom(SecureRandom secureRandom)
Builder registerProvider(boolean registerProvider)
GmSecurityContext build()
```

Builder 默认使用 BC Provider、新建 `SecureRandom`、`registerProvider=true`。构建后的上下文不可变，但其中的 `SecureRandom` 本身仍是有状态对象。`provider()` 在注册策略为 true 时才确保全局注册。

### `GmSecurityContexts`

```java
static GmSecurityContext defaults()
static GmSecurityContext withProvider(Provider provider)
static GmSecurityContext withProviderAndRandom(
    Provider provider,
    SecureRandom secureRandom)
static GmSecurityContext withSecureRandom(SecureRandom secureRandom)
```

`withProvider` 和 `withProviderAndRandom` 不自动注册 Provider；`defaults`、`withSecureRandom` 使用默认 BC 并允许自动注册。

```java
Provider provider = BcProviders.create();
SecureRandom random = new SecureRandom();
GmSecurityContext context =
    GmSecurityContexts.withProviderAndRandom(provider, random);
if (context.provider() != provider || context.secureRandom() != random) {
    throw new IllegalStateException("security context mismatch");
}
```

测试用确定性 `SecureRandom` 不得进入生产配置。

## 算法格式枚举

| 类型 | 成员 | 说明 |
|:--|:--|:--|
| `SM2CipherMode` | `C1C3C2`, `C1C2C3` | `toBcMode()` 转成 Bouncy Castle 排列 |
| `SM2SignatureFormat` | `RAW`, `DER` | 签名输出格式 |
| `SM2SignatureInputFormat` | `RAW`, `DER`, `AUTO` | 验签输入格式 |
| `SM4CipherMode` | `ECB`, `CBC`, `CTR`, `CFB`, `OFB`, `GCM`, `CCM` | `isStreamLike()` 对 CTR/CFB/OFB/GCM/CCM 返回 true |
| `SM4Padding` | `PKCS7`, `NONE`, `ZERO` | ZERO 不能无损恢复原文尾部零字节 |

这些枚举是协议字段，不应仅依赖两端默认值。TypeScript 与 Java 的枚举名称相似，但属于不同发布包和类型系统。

## 异常与消息

### `GmkitException`

```java
new GmkitException(String message)
new GmkitException(String message, Throwable cause)
```

主包参数、编码和密码操作失败使用该运行时异常；部分通用 JDK 参数检查仍可能抛标准异常。验签数学上不成立通常返回 false。

### `Messages`

`Messages` 是公开的双语错误消息构造器，应用通常不需要直接调用：

```text
bilingual
nullValue
emptyValue
blankValue
invalidHexEven
invalidHex
invalidBase64
invalidHexOrBase64
invalidBlankInput
expectedLength
multipleOf
positiveValue
sm2EncryptionFailed
sm2DecryptionFailed
sm2SigningFailed
sm2InitiatorConfirmationTagRequired
sm2UserIdTooLong
invalidSm2Signature
invalidSm2DerSignature
invalidSm2RawSignatureLength
invalidSm2RawSignatureEncoding
```

错误消息文本不属于稳定的机器协议。应用应按异常类型和业务上下文处理，不要解析自然语言字符串。

## 相关页面

- [跨语言公共约定](/api/common.html)
- [Java API 首页](/api/java/)
