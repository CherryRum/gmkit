---
title: GMKit Java 同源实现
icon: java
order: 3
category: [开发指南, 集成]
tag: [Java, GMKit Java, Bouncy Castle]
---

# GMKit Java 同源实现

`packages/java/gmkit` 提供 `cn.gmkit:gmkit` 主包，当前包含 SM2、SM3、SM4、ZUC 和组合工具。它与 gmkitx 共用协议向量，但不承诺 API/ABI 完全一致。Java 主包当前**没有** `cn.gmkit.sha` 模块；SHA 可直接使用 JDK `MessageDigest`/`Mac`。

## 依赖

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit</artifactId>
  <version>0.10.0-preview.1</version>
</dependency>
```

最低 Java 8；主包使用 Bouncy Castle `jdk15to18` 产物族。不要与其他 BC 产物族混装。

SM9 不在主包中。需要 SM9 时只添加一个依赖，无需按平台选择额外 artifact：

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit-sm9</artifactId>
  <version>0.10.0-preview.1</version>
</dependency>
```

该 JAR 内置 Linux x86_64/aarch64、macOS x86_64/aarch64 和 Windows x86_64 runtime，启动时只解压和加载当前平台。其他平台可自行编译，并用 `-Dgmkit.sm9.native.path=<bridge-path>` 指定 JNI 桥接库；TypeScript 包不提供 SM9。

## SM2 可运行示例

```java
import cn.gmkit.core.SM2CipherMode;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm2.SM2SignOptions;
import cn.gmkit.sm2.SM2VerifyOptions;

SM2 sm2 = new SM2();
SM2KeyPair keys = sm2.generateKeyPair();
String message = "GMKit Java release check";

String cipherHex = sm2.encryptHex(keys.publicKey(), message, SM2CipherMode.C1C3C2);
String plain = sm2.decryptToUtf8(keys.privateKey(), cipherHex, SM2CipherMode.C1C3C2);
if (!message.equals(plain)) {
    throw new IllegalStateException("SM2 round-trip failed");
}

String signature = sm2.signHex(keys.privateKey(), message, SM2SignOptions.builder().build());
boolean verified = sm2.verify(
    keys.publicKey(), message, signature, SM2VerifyOptions.builder().build());
if (!verified) {
    throw new IllegalStateException("SM2 signature verification failed");
}
```

`SM2KeyPair` 使用 fluent accessor：`publicKey()`、`privateKey()`，不是 JavaBean `getPublicKeyHex()`。静态调用可改用 `SM2Util`，参数和返回语义与实例入口一致。

## SM3 固定向量

```java
import cn.gmkit.sm3.SM3Util;

String actual = SM3Util.digestHex("abc");
if (!"66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0".equals(actual)) {
    throw new IllegalStateException("SM3 vector mismatch: " + actual);
}
```

`SM3` Java 对象是无状态一次性入口，不是 TypeScript `SM3` 的增量状态机。Java 大文件增量摘要应选择明确支持 update/final 的接口或流式封装，不能从 TS 类行为推导 Java 行为。

## SM4 CBC

```java
import cn.gmkit.core.HexCodec;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;
import cn.gmkit.sm4.SM4;
import cn.gmkit.sm4.SM4CipherResult;
import cn.gmkit.sm4.SM4Options;

byte[] key = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "SM4 key");
byte[] iv = HexCodec.decodeStrict("000102030405060708090a0b0c0d0e0f", "SM4 IV");
SM4Options options = SM4Options.builder()
    .mode(SM4CipherMode.CBC)
    .padding(SM4Padding.PKCS7)
    .iv(iv)
    .build();

SM4 sm4 = new SM4();
SM4CipherResult encrypted = sm4.encrypt(key, "sensitive data", options);
String plain = sm4.decryptToUtf8(key, encrypted, options);
if (!"sensitive data".equals(plain)) {
    throw new IllegalStateException("SM4 CBC round-trip failed");
}
```

`SM4CipherResult` 使用 `ciphertext()`、`tag()`、`ciphertextHex()`、`tagHex()`。GCM/CCM 解密时传整个 result，主包会带入认证标签。

## ZUC 与 EIA3

```java
import cn.gmkit.core.HexCodec;
import cn.gmkit.zuc.ZUC;

String stream = ZUC.keystreamHex(
    "00000000000000000000000000000000",
    "00000000000000000000000000000000",
    8);
if (!"27bede74018082da".equals(stream)) {
    throw new IllegalStateException("ZUC vector mismatch: " + stream);
}

String mac = ZUC.eia3(
    "000102030405060708090a0b0c0d0e0f",
    0x01234567,
    0x0a,
    0,
    HexCodec.decodeStrict("5bad724710ba1c56", "message"),
    64);
if (!"1b3d0f74".equals(mac)) {
    throw new IllegalStateException("EIA3 vector mismatch: " + mac);
}
```

## 验证

文档中的 Java API 示例由主模块测试源码编译，完整命令：

```bash
mvn -f packages/java/pom.xml -B -ntp -pl gmkit test
npm run parity
```

- [Java / Hutool 对接](/dev/JAVA-INTEGRATION.zh-CN)
- [互操作向量](/dev/INTEROP_VECTORS)
