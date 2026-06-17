---
title: GMKit Java（同源 Java 实现）
icon: java
order: 2
author: mumu
date: 2026-05-03
category:
  - 开发指南
  - 集成
tag:
  - Java
  - GMKit Java
  - JDK 1.8
  - Bouncy Castle
---

# GMKit Java：与 gmkitx 同源的 Java 实现

::: tip 这一页讲什么
- GMKit Java 是什么、与 gmkitx 是什么关系
- 坐标 / JDK / 依赖一栏看完
- 双入口约定（实例式 `XxxX` + 静态聚合 `XxxUtil`）
- 与 gmkitx 对齐协议边界的最小可运行示例（SM2/SM3/SM4/ZUC/SHA）
- 与 Hutool / Bouncy Castle / Tencent Kona 的差异
:::

## 是什么

GMKit Java 是 `gmkitx` 在 JVM 端的同源实现，主包坐标为 `cn.gmkit:gmkit`。
两端不承诺完全一致 ABI；项目通过共享互操作向量和明确的协议边界，对齐密文模式、
签名格式、默认 `userId`、编码和可验证输出。

设计目标只有两条：

1. 后端与前端在 SM2 / SM3 / SM4 / ZUC 的主路径上可以互相验证。
2. 不引入新的协议隐式默认值；跨语言对接时必须显式固定格式和编码。

> 具体互操作边界以 `vectors/interop.json` 和两端 compliance tests 为准。

## 坐标与依赖

| 项目 | 取值 |
|---|---|
| `groupId` | `cn.gmkit` |
| `artifactId` | `gmkit` |
| `version` | `0.10.0-SNAPSHOT`（dev） |
| 最低 JDK | 1.8（由 `animal-sniffer-maven-plugin` 强制） |
| 运行时依赖 | Bouncy Castle `bcprov-jdk15to18` / `bcpkix-jdk15to18` |

::: code-tabs#java-deps

@tab Maven

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit</artifactId>
  <version>0.10.0-SNAPSHOT</version>
</dependency>
```

@tab Gradle (Groovy)

```groovy
implementation 'cn.gmkit:gmkit:0.10.0-SNAPSHOT'
```

@tab Gradle (Kotlin)

```kotlin
implementation("cn.gmkit:gmkit:0.10.0-SNAPSHOT")
```

:::

::: warning BC 产物族
Bouncy Castle 同时存在 `jdk15on` / `jdk15to18` / `jdk18on` 三个产物族，
混用会导致 `Duplicate class`、`NoSuchMethodError`。`gmkit` 选用
`jdk15to18` 是为了照顾仍跑在 JDK 1.8 / 老容器的项目，详细排雷
请见 [Java 对接指南](/dev/JAVA-INTEGRATION.zh-CN#bouncy-castle-版本-产物说明-务必看)。
:::

## 两套入口的约定

每个算法都同时提供两种入口，按场景挑：

| 入口风格 | 示例 | 适合 |
|---|---|---|
| 实例式 `XxxX` | `new SM3()`, `new ZUC()`, `new SHA256()` | 需要复用上下文、流式 update、注入到框架中 |
| 静态聚合 `XxxUtil` | `SM3Util.digestHex(...)` | 一次性调用、像工具方法一样使用 |

两套入口是**等价**的：`XxxUtil` 内部就是创建并复用 `XxxX` 实例。
推荐在 Spring Bean / 长生命周期对象里持有实例式，在脚本场景里
用 `XxxUtil`。

## SM2

::: code-tabs#sm2-quick

@tab Java（实例式）

```java
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm2.SM2SignOptions;
import cn.gmkit.sm2.SM2VerifyOptions;
import cn.gmkit.core.SM2CipherMode;

SM2 sm2 = new SM2();
SM2KeyPair kp = sm2.generateKeyPair();

// 加解密：默认 C1C3C2，与 gmkitx 共享协议边界
String cipherHex = sm2.encryptHex(kp.getPublicKeyHex(), "Hello, SM2!", SM2CipherMode.C1C3C2);
String plain = sm2.decryptToUtf8(kp.getPrivateKeyHex(), cipherHex, SM2CipherMode.C1C3C2);

// 签名 / 验签：默认 userId 与 gmkitx 一致
SM2SignOptions signOpts = SM2SignOptions.builder().build();
String sigHex = sm2.signHex(kp.getPrivateKeyHex(), "重要消息", signOpts);

SM2VerifyOptions verifyOpts = SM2VerifyOptions.builder().build();
boolean ok = sm2.verify(kp.getPublicKeyHex(), "重要消息", sigHex, verifyOpts);
```

@tab Java（静态）

```java
import cn.gmkit.sm2.SM2Util;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm2.SM2SignOptions;
import cn.gmkit.sm2.SM2VerifyOptions;
import cn.gmkit.core.SM2CipherMode;

SM2KeyPair kp = SM2Util.generateKeyPair();

String cipherHex = SM2Util.encryptHex(kp.getPublicKeyHex(), "Hello, SM2!", SM2CipherMode.C1C3C2);
String plain = SM2Util.decryptToUtf8(kp.getPrivateKeyHex(), cipherHex, SM2CipherMode.C1C3C2);

String sigHex = SM2Util.signHex(kp.getPrivateKeyHex(), "重要消息", SM2SignOptions.builder().build());
boolean ok = SM2Util.verify(kp.getPublicKeyHex(), "重要消息", sigHex, SM2VerifyOptions.builder().build());
```

@tab TypeScript（对照）

```typescript
import { sm2GenerateKeyPair, sm2Encrypt, sm2Decrypt, sm2Sign, sm2Verify, SM2CipherMode } from 'gmkitx';

const { publicKey, privateKey } = sm2GenerateKeyPair();
const cipher = sm2Encrypt(publicKey, 'Hello, SM2!', { mode: SM2CipherMode.C1C3C2 });
const plain = sm2Decrypt(privateKey, cipher, { mode: SM2CipherMode.C1C3C2 });

const sig = sm2Sign(privateKey, '重要消息');
const ok = sm2Verify(publicKey, '重要消息', sig);
```

:::

::: tip userId
两端的默认 `userId` 都是 `"1234567812345678"`。需要严格对齐
GM/T 0009-2023（即 `userId = ""`）时，Java 端通过
`SM2SignOptions.builder().userId("").build()` 显式传入，TS 端通过
`{ userId: '' }` 显式传入。
:::

## SM3

::: code-tabs#sm3-quick

@tab Java（实例式）

```java
import cn.gmkit.sm3.SM3;

SM3 sm3 = new SM3();
String hashHex = sm3.digestHex("订单摘要");
String hmacHex = sm3.hmacHex("secret-key".getBytes(), "msg".getBytes());
```

@tab Java（静态）

```java
import cn.gmkit.sm3.SM3Util;

String hashHex = SM3Util.digestHex("订单摘要");
String hmacHex = SM3Util.hmacHex("secret-key".getBytes(), "msg".getBytes());
```

@tab TypeScript（对照）

```typescript
import { sm3Digest, sm3Hmac } from 'gmkitx';

const hashHex = sm3Digest('订单摘要');
const hmacHex = sm3Hmac(new TextEncoder().encode('secret-key'), 'msg');
```

:::

## SM4

::: code-tabs#sm4-quick

@tab Java（实例式）

```java
import cn.gmkit.sm4.SM4;
import cn.gmkit.sm4.SM4Options;
import cn.gmkit.sm4.SM4CipherResult;
import cn.gmkit.core.HexCodec;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;

SM4 sm4 = new SM4();
byte[] key = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "SM4 key");
byte[] iv  = HexCodec.decodeStrict("000102030405060708090a0b0c0d0e0f", "SM4 IV");

SM4Options cbc = SM4Options.builder()
    .mode(SM4CipherMode.CBC)
    .padding(SM4Padding.PKCS7)
    .iv(iv)
    .build();

SM4CipherResult cipher = sm4.encrypt(key, "敏感数据".getBytes(), cbc);
byte[] plain = sm4.decrypt(key, cipher.getCiphertext(), cbc);
```

@tab Java（静态 2 参 / 3 参）

```java
import cn.gmkit.sm4.SM4Util;

// 与 SM4 实例式完全对称的 2 参重载（默认 ECB / PKCS7）
byte[] cipher = SM4Util.encrypt(key, "敏感数据".getBytes());
byte[] plain  = SM4Util.decrypt(key, cipher);

// 显式 3 参重载，对齐 gmkitx 的 options 写法
SM4CipherResult result = SM4Util.encrypt(key, "敏感数据".getBytes(), cbc);
```

@tab TypeScript（对照）

```typescript
import { sm4Encrypt, sm4Decrypt, CipherMode, PaddingMode } from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210';
const iv  = '000102030405060708090a0b0c0d0e0f';

const cipher = sm4Encrypt(key, '敏感数据', { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
const plain  = sm4Decrypt(key, cipher,    { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
```

:::

::: tip 输出类型
Java 端 `encrypt` 返回 `SM4CipherResult`，里面同时携带 `ciphertext`、
`tag`（仅 GCM/CCM）、`mode`，等价于 gmkitx `SM4Result`。
:::

## ZUC

::: code-tabs#zuc-quick

@tab Java（实例式）

```java
import cn.gmkit.zuc.ZUC;

ZUC zuc = new ZUC();

// 流式加密（与 gmkitx zuc.encrypt 字节级一致）
byte[] cipher = zuc.process(key16, iv16, plaintext);

// EEA3：返回 ceil(bitLength / 32) 个 32-bit 字
int[] keystream = zuc.eea3(ck, count, bearer, direction, bitLength);

// EIA3：返回 32-bit MAC
int mac = zuc.eia3(ik, count, bearer, direction, message);
```

@tab Java（静态）

```java
import cn.gmkit.zuc.ZUCUtil;

byte[] cipher  = ZUCUtil.process(key16, iv16, plaintext);
int[] keystream = ZUCUtil.eea3(ck, count, bearer, direction, bitLength);
int   mac       = ZUCUtil.eia3(ik, count, bearer, direction, message);
```

@tab TypeScript（对照）

```typescript
import { zucEncrypt, eea3, eia3 } from 'gmkitx';

const cipher    = zucEncrypt(key16, iv16, plaintext);
const keystream = eea3(ck, count, bearer, direction, bitLength); // hex
const mac       = eia3(ik, count, bearer, direction, message);   // hex
```

:::

::: tip 标准对齐
两端均通过 GM/T 0001-2012、3GPP TS 35.221 三组标准向量；
EEA3 keystream 与 EIA3 MAC 字节级完全一致。具体细节见
[ZUC 算法](/algorithms/ZUC)。
:::

## SHA（国际标准）

GMKit Java 内置 SHA-1/256/384/512 四档实现，每档同时暴露实例式与
`SHAUtil` 静态聚合，签名风格与 SM3 模块对称。

::: code-tabs#sha-quick

@tab Java（实例式）

```java
import cn.gmkit.sha.SHA256;

SHA256 sha = new SHA256();
String hex = sha.digestHex("hello");
byte[] mac = sha.hmac("key".getBytes(), "msg".getBytes());
```

@tab Java（静态）

```java
import cn.gmkit.sha.SHAUtil;

String hex = SHAUtil.sha256Hex("hello");
byte[] mac = SHAUtil.sha256Hmac("key".getBytes(), "msg".getBytes());
```

@tab TypeScript（对照）

```typescript
import { sha } from 'gmkitx';

const hex = sha.sha256('hello');
// HMAC：sha.hmac('sha256', 'key', 'msg')
```

:::

## 与 Hutool / BC / Kona 的取舍

| 库 | 适合什么 | 与 GMKit Java 的差异 |
|---|---|---|
| Hutool `cn.hutool:hutool-crypto` | 已经在用 Hutool 工具集 | API 命名不与 gmkitx 对齐；密文模式默认值不同 |
| Bouncy Castle 直接调用 | 极致控制，自己拼算子 | 需要写一堆样板；密文/签名格式默认与国密推荐不同 |
| Tencent Kona SM Suite | 想走 JCA Provider 风格 | 与 gmkitx 命名差距大；需要装 Provider |
| **GMKit Java** | **跟前端共享互操作向量和协议边界** | 命名接近 gmkitx，但不承诺完全一致 ABI；底层仍调用 BC，性能等价 |

> 已有 Hutool 项目想逐步迁移：可参照
> [Java 对接指南](/dev/JAVA-INTEGRATION.zh-CN) 中的“Hutool 互通示例”，
> 先确认密文/签名互验，再切到 GMKit Java 的对应 API，迁移成本更可控。

## 互操作速查

完整互操作边界请优先看：

- `vectors/interop.json`
- `packages/ts/test/interop-compliance.test.ts`
- `packages/java/gmkit/src/test/java/cn/gmkit/InteropComplianceTest.java`

如果发现某个 TS 端入口在 Java 端没有对应、或者反过来，欢迎在
[gmkits/gmkit](https://github.com/gmkits/gmkit) 提 issue。
