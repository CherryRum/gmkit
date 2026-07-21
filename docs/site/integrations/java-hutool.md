---
title: Java 与 Hutool 对接指南
description: 说明已有 Hutool 与 Bouncy Castle 项目的协议对接、版本边界和迁移路径。
icon: java
order: 4
category: [集成示例, Java]
tag: [Java, Hutool, Bouncy Castle, 互操作]
---

# Java 与 Hutool 对接指南

新项目优先使用同仓库的 `cn.gmkit:gmkit`，安装与用法见 [Java 快速入门](/guide/java.html) 和 [Java API 说明书](/api/java/)。本页保留给已有 Hutool/Bouncy Castle 项目，明确版本与迁移边界。

## 已验证版本

```xml
<dependency>
  <groupId>cn.hutool</groupId>
  <artifactId>hutool-crypto</artifactId>
  <version>5.8.43</version>
</dependency>
<dependency>
  <groupId>org.bouncycastle</groupId>
  <artifactId>bcprov-jdk15to18</artifactId>
  <version>1.83</version>
</dependency>
```

仓库 fixture：

```bash
mvn -f docs/site/examples/hutool/pom.xml -B -ntp test
```

它验证 Hutool SM3 入口与 BC SM4 原语能在固定版本组合下加载并通过标准向量：

```java
import cn.hutool.core.util.HexUtil;
import cn.hutool.crypto.SmUtil;
import org.bouncycastle.crypto.engines.SM4Engine;
import org.bouncycastle.crypto.params.KeyParameter;

// 1. SM3 摘要：通过 Hutool 入口计算标准输入 abc。
String digest = SmUtil.sm3("abc");

// 2. SM3 向量断言：摘要必须等于公开固定值。
if (!"66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0".equals(digest)) {
    throw new IllegalStateException("SM3 vector mismatch: " + digest);
}

// 3. 准备 SM4 单分组向量：固定 16 字节 key 和 plaintext。
byte[] key = HexUtil.decodeHex("0123456789abcdeffedcba9876543210");
byte[] plaintext = HexUtil.decodeHex("0123456789abcdeffedcba9876543210");
byte[] ciphertext = new byte[16];

// 4. SM4 单分组加密：直接调用 BC 分组原语，不包含模式和填充。
SM4Engine engine = new SM4Engine();
engine.init(true, new KeyParameter(key));
engine.processBlock(plaintext, 0, ciphertext, 0);

// 5. SM4 向量断言：单分组密文必须等于公开固定值。
if (!"681edf34d206965e86b3e94f536e4246".equals(HexUtil.encodeHexStr(ciphertext))) {
    throw new IllegalStateException("SM4 vector mismatch");
}
```

## Bouncy Castle 产物族

同一进程不要混用 `jdk15on`、`jdk15to18`、`jdk18on` 产物族，否则可能出现重复类或 `NoSuchMethodError`。用 Maven dependency tree 检查实际解析结果：

```bash
mvn dependency:tree -Dincludes=org.bouncycastle
```

GMKit Java 当前使用 `jdk15to18`，以兼容 Java 8。已有平台若统一使用其他产物族，应在应用依赖管理层明确排除和替换，并跑完整算法测试。

## Hutool SM2 对接

Hutool 的便捷 API 不等于协议默认值一致。迁移或互通时明确：

| 字段 | 必须核对 |
|:--|:--|
| 密钥 | 裸私钥、公钥是否含 `04`，是否是 PEM/DER |
| 密文 | C1C3C2/C1C2C3，raw/ASN.1，hex/base64 |
| 签名 | 是否包含 ZA，userId，raw/DER |
| Provider | 实际加载的 BC 版本和 Provider 顺序 |

先用固定密钥做双向解密和验签，再迁移业务。不要比较随机 SM2 密文或签名的完整字面值。

## GMKit Java 最小自检

```java
import cn.gmkit.sm3.SM3Util;

// 1. SM3 摘要：通过 GMKit Java 计算标准输入 abc。
String actual = SM3Util.digestHex("abc");

// 2. 固定向量断言：摘要必须等于公开固定值。
if (!"66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0".equals(actual)) {
    throw new IllegalStateException("GMKit Java SM3 mismatch: " + actual);
}
```

完整主包测试：

```bash
mvn -f packages/java/pom.xml -B -ntp -pl gmkit test
npm run parity
```

## Java 8 与 JCE

现代 Java 运行时通常已启用 unlimited cryptography policy，但旧 Oracle JDK 8 小版本可能有限制。不要只读文档猜测，启动时检查 `Cipher.getMaxAllowedKeyLength("AES")`。这主要影响 AES 等国际算法；SM2/SM3/SM4 仍要核对 Provider 能力。
