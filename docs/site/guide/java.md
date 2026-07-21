---
title: Java 快速入门
description: 引入 GMKit Maven 制品，完成 SM3 自检、SM2 签名、SM4-GCM 加密并按需启用 SM9。
icon: coffee
order: 4
category:
  - 使用指南
  - Java
tag:
  - Maven
  - Java 8
  - SM9
---

# Java 快速入门

GMKit Java 主包提供 core、SM2、SM3、SM4、ZUC 和混合加密；SM9 是带 JNI/GmSSL runtime 的独立模块。主包最低支持 Java 8。

## 安装主包

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit</artifactId>
  <version>0.10.1</version>
</dependency>
```

## 1. 固定向量自检

```java
import cn.gmkit.sm3.SM3Util;

String actual = SM3Util.digestHex("abc");
String expected = "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0";
if (!expected.equals(actual)) {
    throw new IllegalStateException("SM3 vector mismatch: " + actual);
}
```

## 2. 选择实例式或静态式入口

| 需求 | 推荐入口 |
|:--|:--|
| 复用 `GmSecurityContext` 或固定 Provider/SecureRandom | `SM2`、`SM4` 实例 |
| 简单的一次性调用 | `SM2Util`、`SM3Util`、`SM4Util` |
| ZUC、EEA3、EIA3 | `ZUC` 或 `ZUCUtil` 静态入口 |
| SM9 | `SM9` 门面和实现 `AutoCloseable` 的句柄类型 |

实例类没有声明线程安全。并发任务使用独立实例，或只调用没有共享状态的静态工具。

## 3. 签名与认证加密闭环

```java
import cn.gmkit.core.HexCodec;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm2.SM2SignOptions;
import cn.gmkit.sm2.SM2VerifyOptions;
import cn.gmkit.sm4.SM4;
import cn.gmkit.sm4.SM4CipherResult;
import cn.gmkit.sm4.SM4Options;

SM2 sm2 = new SM2();
SM2KeyPair keys = sm2.generateKeyPair();
String message = "GMKit Java quick start";

String signature = sm2.signHex(
    keys.privateKey(),
    message,
    SM2SignOptions.builder().userId("quick-start@example").build());
if (!sm2.verify(
        keys.publicKey(),
        message,
        signature,
        SM2VerifyOptions.builder().userId("quick-start@example").build())) {
    throw new IllegalStateException("SM2 verification failed");
}

byte[] sm4Key = new SM4().generateKey();
SM4Options options = SM4Options.builder()
    .mode(SM4CipherMode.GCM)
    .padding(SM4Padding.NONE)
    .iv(HexCodec.decodeStrict("000102030405060708090a0b", "nonce"))
    .aad("gmkit-quick-start-v1".getBytes("UTF-8"))
    .tagLength(16)
    .build();
SM4CipherResult encrypted = new SM4().encrypt(sm4Key, message, options);
String decrypted = new SM4().decryptToUtf8(sm4Key, encrypted, options);
if (!message.equals(decrypted)) {
    throw new IllegalStateException("SM4-GCM round-trip failed");
}
```

示例中的固定 nonce 只为展示参数，生产环境必须在相同 key 下保证 nonce 唯一。Java 8 项目也可以使用 `StandardCharsets.UTF_8` 代替字符串字符集名称。

## Provider 与安全上下文

默认入口会解析可用的 Bouncy Castle Provider。需要固定 Provider 或注入 `SecureRandom` 时使用：

```java
import cn.gmkit.core.GmSecurityContext;
import cn.gmkit.sm2.SM2;
import java.security.SecureRandom;

GmSecurityContext context = GmSecurityContext.builder()
    .secureRandom(new SecureRandom())
    .registerProvider(true)
    .build();
SM2 sm2 = new SM2(context);
```

完整注册和全局副作用说明见 [Java 核心 API](/api/java/core.html)。

## 按需启用 SM9

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit-sm9</artifactId>
  <version>0.10.1</version>
</dependency>
```

应用启动时先检查 `SM9.isAvailable()`。SM9 主密钥、用户私钥和签名上下文持有 native 资源，必须使用 try-with-resources；不使用 SM9 时不要添加该模块。

## 接下来

- [Java API 说明书](/api/java/)
- [Java 核心公共 API](/api/java/core.html)
- [Java SM9 API](/api/java/sm9.html)
- [Java SM2 + SM4 混合加密 API](/api/java/integration.html)
- [常见问题与故障排查](/guide/troubleshooting.html)
- [安全边界](/guide/security.html)
