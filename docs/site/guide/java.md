---
title: Java 快速入门
description: 引入 GMKit Maven 制品，完成 SM3 自检、SM2 签名、SM4-GCM 加密并按需启用 SM9。
pageInfo: false
contributors: false
editLink: false
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

// 1. 计算摘要：使用标准输入 abc 计算 SM3。
String actual = SM3Util.digestHex("abc");
String expected = "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0";

// 2. 固定向量断言：摘要必须与标准结果完全一致。
if (!expected.equals(actual)) {
    throw new IllegalStateException("SM3 vector mismatch: " + actual);
}
```

## 2. 选择实例式或静态式入口

<ApiTable label="Java API 入口选择" min-width="62rem">

| 需求 | 推荐入口 |
|:--|:--|
| 复用 `GmSecurityContext` 或固定 Provider/SecureRandom | `SM2`、`SM4` 实例 |
| 简单的一次性调用 | `SM2Util`、`SM3Util`、`SM4Util` |
| ZUC、EEA3、EIA3 | `ZUC` 或 `ZUCUtil` 静态入口 |
| SM9 | `SM9` 门面和实现 `AutoCloseable` 的句柄类型 |

</ApiTable>

实例类没有声明线程安全。并发任务使用独立实例，或只调用没有共享状态的静态工具。

## 3. 签名与认证加密闭环

```java
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm2.SM2SignOptions;
import cn.gmkit.sm2.SM2VerifyOptions;
import cn.gmkit.sm4.SM4;
import cn.gmkit.sm4.SM4CipherResult;
import cn.gmkit.sm4.SM4Options;
import java.security.SecureRandom;

// 1. 准备输入：正常订单、篡改订单和签名身份分别保存。
SM2 sm2 = new SM2();
String message = "order=GMKIT-DEMO-0001&amount=88.00";
String changedMessage = "order=GMKIT-DEMO-0001&amount=99.00";
String userId = "merchant@gmkit.cn";

// 2. 生成 SM2 密钥对：私钥签名，公钥验签。
SM2KeyPair keys = sm2.generateKeyPair();

// 3. SM2 签名：userId 参与 Z 值计算，输出使用默认 Hex。
String signature = sm2.signHex(
    keys.privateKey(),
    message,
    SM2SignOptions.builder().userId(userId).build());

// 4. SM2 验签：原消息和相同 userId 必须验证成功。
if (!sm2.verify(
        keys.publicKey(),
        message,
        signature,
        SM2VerifyOptions.builder().userId(userId).build())) {
    throw new IllegalStateException("SM2 verification failed");
}

// 5. SM2 篡改断言：金额变化后必须验证失败。
if (sm2.verify(
        keys.publicKey(),
        changedMessage,
        signature,
        SM2VerifyOptions.builder().userId(userId).build())) {
    throw new IllegalStateException("tampered order must not verify");
}

// 6. 准备 SM4-GCM 参数：生成随机 key、12 字节 nonce，并固定 AAD。
SM4 sm4 = new SM4();
byte[] sm4Key = sm4.generateKey();
byte[] nonce = new byte[12];
new SecureRandom().nextBytes(nonce);
SM4Options options = SM4Options.builder()
    .mode(SM4CipherMode.GCM)
    .padding(SM4Padding.NONE)
    .iv(nonce)
    .aad("tenant=demo;schema=1".getBytes("UTF-8"))
    .tagLength(16)
    .build();

// 7. SM4-GCM 加密：结果包含 ciphertext 和认证 tag。
SM4CipherResult encrypted = sm4.encrypt(sm4Key, message, options);

// 8. SM4-GCM 解密：使用相同 key、nonce 和 AAD 恢复文本。
String decrypted = sm4.decryptToUtf8(sm4Key, encrypted, options);

// 9. 成功断言：解密结果必须等于订单原文。
if (!message.equals(decrypted)) {
    throw new IllegalStateException("SM4-GCM round-trip failed");
}

// 10. 构造篡改结果：复制 tag 后修改第一个字节。
byte[] tamperedTag = encrypted.tag();
tamperedTag[0] ^= 0x01;
SM4CipherResult tampered =
    new SM4CipherResult(encrypted.ciphertext(), tamperedTag);

// 11. 失败断言：认证失败必须抛错，不能返回未认证明文。
try {
    sm4.decryptToUtf8(sm4Key, tampered, options);
    throw new IllegalStateException("tampered tag must be rejected");
} catch (cn.gmkit.core.GmkitException expected) {
    // 预期：认证失败，不返回明文。
}
```

示例为每次加密生成新的 12 字节 nonce，并同时验证错误 tag 必须失败。生产环境还必须在相同 key 下保证 nonce 唯一。Java 8 项目也可以使用 `StandardCharsets.UTF_8` 代替字符串字符集名称。

## Provider 与安全上下文

默认入口会解析可用的 Bouncy Castle Provider。需要固定 Provider 或注入 `SecureRandom` 时使用：

```java
import cn.gmkit.core.GmSecurityContext;
import cn.gmkit.sm2.SM2;
import java.security.SecureRandom;

// 1. 创建安全上下文：显式注入 SecureRandom 并注册 Provider。
GmSecurityContext context = GmSecurityContext.builder()
    .secureRandom(new SecureRandom())
    .registerProvider(true)
    .build();

// 2. 创建 SM2 实例：后续运算统一使用该上下文。
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

应用启动时先检查 `SM9.isAvailable()`。SM9 主密钥、用户私钥和签名上下文持有本地动态库（native）资源，必须使用 try-with-resources；不使用 SM9 时不要添加该模块。

## 接下来

- [Java API 说明书](/api/java/)
- [Java 核心公共 API](/api/java/core.html)
- [Java SM9 API](/api/java/sm9.html)
- [Java SM2 + SM4 混合加密 API](/api/java/integration.html)
- [常见问题与故障排查](/guide/troubleshooting.html)
- [安全边界](/guide/security.html)
