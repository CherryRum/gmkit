---
title: Java 对接指南
icon: plug
order: 3
author: mumu
date: 2025-11-23
category:
  - 开发指南
  - 集成
tag:
  - Java
  - Hutool
  - Bouncy Castle
  - Kona
  - 对接其他语言
---

# Java 对接指南

::: tip
提示：本章要点

- 依赖配置
- JDK 1.8 低版本 & JCE 限制（Oracle vs OpenJDK）
- 数据要点
- 模式与填充详解
- 完整互通示例（Java 端端到端）
:::


本页聚焦在第三方栈下与 gmkitx 互通的四种方案。如果你想直接使用同源 Java 实现，并通过共享向量对齐协议边界，请看专门页：[GMKit Java（同源 Java 实现）](/dev/JAVA-LIBRARY.zh-CN)。

| 项目 | 说明 |
|:--|:--|
| **GMKit Java**（推荐） | 与 gmkitx 同源，依靠共享互操作向量和显式协议边界对齐，详见 [GMKit Java 专页](/dev/JAVA-LIBRARY.zh-CN) |
| Hutool + Bouncy Castle | 已有 Hutool 项目里最低成本的方案，需要引入 BC 依赖 |
| 直接使用 Bouncy Castle | 底层实现，更灵活，需要自己拼装算子 |
| Tencent Kona SM Suite | JCA 标准 Provider，纯 Java 实现，需要装 Provider |

## 先看公开 API 面

在开始写 Java 端之前，建议先冻结 gmkitx 当前对外暴露的接口，再做对应实现，避免“文档理解版 API”和真实导出面偏离。

- 公开 API 全量清单：[/dev/API-SURFACE.zh-CN](/dev/API-SURFACE.zh-CN)
- 建议优先对齐：`SM2`、`SM3`、`SM4` 的函数式 API，再补类 API 与工具函数
- 安全边界必须同步：`userId`、`signatureFormat`、`mode`、`padding`、`inputFormat/outputFormat`、`iv/nonce`、`tagLength`


## 依赖配置

### 方案一：Hutool（推荐）

::: tip
提示：注意
Hutool 的国密算法实现依赖 Bouncy Castle 库，必须同时引入 BC 依赖。
:::

```xml
<!-- Maven -->
<dependency>
    <groupId>cn.hutool</groupId>
    <artifactId>hutool-crypto</artifactId>
    <version>5.8.43</version>
</dependency>
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcprov-jdk15to18</artifactId>
    <version>1.70</version>
</dependency>
```

```gradle
// Gradle
implementation 'cn.hutool:hutool-crypto:5.8.43'
implementation 'org.bouncycastle:bcprov-jdk15to18:1.70'
```

### 方案二：Bouncy Castle

```xml
<!-- Maven -->
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcprov-jdk15to18</artifactId>
    <version>1.70</version>
</dependency>
```

```gradle
// Gradle
implementation 'org.bouncycastle:bcprov-jdk15to18:1.70'
```

### 方案三：Tencent Kona SM Suite

Tencent Kona SM Suite 基于 JCA 标准提供者实现 SM2/SM3/SM4，适合希望遵循 JDK 原生 API 的场景。

```xml
<!-- Maven -->
<dependency>
    <groupId>com.tencent.kona</groupId>
    <artifactId>kona-crypto</artifactId>
    <version>1.0.19</version>
</dependency>
<dependency>
    <groupId>com.tencent.kona</groupId>
    <artifactId>kona-provider</artifactId>
    <version>1.0.19</version>
</dependency>
```

```gradle
// Gradle
implementation 'com.tencent.kona:kona-crypto:1.0.19'
implementation 'com.tencent.kona:kona-provider:1.0.19'
```

::: tip
提示：说明
仅需 SM2/SM3/SM4 时引入 `kona-crypto` 即可；若需要一站式 Provider，可额外引入 `kona-provider`。
:::

### 版本说明（Hutool & BC）

- Hutool 示例统一使用 `5.8.43`，避免 API 差异导致的互通偏差。
- Bouncy Castle 建议**固定版本**以稳定互操作。本文示例以 `bcprov-jdk15to18:1.70` 为基准。
- 为避免默认值差异，请显式指定 **SM2 密文模式**（C1C3C2/C1C2C3）与**签名格式**（DER/RAW）及编码方式。

### Bouncy Castle 版本/产物说明（务必看）

BC 的 `artifactId` 随版本发生过**命名与打包策略变更**，最常见的坑是“引错包 / 混用包 / 多版本冲突”。下面把“每个产物家族的适用范围与问题”写清楚（这里说的“版本”指 **jdk18on/jdk15to18/jdk15on/jdk14** 这些产物家族，而不是具体的 1.70/1.83 版本号）：

#### 1) `bcprov-jdk18on`（JDK 8+ 主线）
| 项目 | 说明 |
|:--|:--|
| 适用范围 | Java 8 及以上。 |
| 特性 | **Multi-Release JAR**（同一包内为不同 JDK 提供优化实现）。 |

- **常见问题**：
  - 某些旧容器/打包器/OSGi 运行时对 Multi-Release JAR 识别不全，可能出现类加载异常或能力识别错误。
  - 如果工程同时引入了 `bcprov-jdk15on` 或 `bcprov-jdk15to18`，容易出现**重复类**或类冲突。
- **何时用**：JDK 8+ 且运行环境对 Multi-Release JAR 兼容良好，**优先使用**。

#### 2) `bcprov-jdk15to18`（JDK 1.5–1.8 兼容）
| 项目 | 说明 |
|:--|:--|
| 适用范围 | Java 1.5–1.8，或**无法正确处理 Multi-Release JAR**的运行环境。 |
| 特性 | **非 Multi-Release** 版本，兼容性更保守。 |

- **常见问题**：
  - 与 `bcprov-jdk18on` 或 `bcprov-jdk15on` 同时存在时，**重复类冲突**最常见。
  - 某些依赖默认拉 `-jdk18on`，如果你手动引 `-jdk15to18` 但未排除传递依赖，会出现“双包共存”。
- **何时用**：需要兼容旧 JVM、老容器或对 Multi-Release JAR 有限制的环境。

#### 3) `bcprov-jdk15on`（历史产物）
| 项目 | 说明 |
|:--|:--|
| 适用范围 | 历史包名（BC 1.70 及之前常见）。 |
| 现状 | **自 1.71 起不再作为主线发布**，被 `jdk18on` 取代。 |

- **常见问题**：
  - 新版本生态（如依赖 `-jdk18on`）下容易产生**多包冲突**。
  - 与 `-jdk15to18` 混用时，重复类/方法签名冲突是高发问题。
- **何时用**：**不建议**在新项目中继续使用。除非历史项目被锁死且无法升级。

#### 4) `bcprov-jdk14`
| 项目 | 说明 |
|:--|:--|
| 适用范围 | 仅用于非常老的 JVM（JDK 1.4）。 |
| 现状 | 现代工程基本不使用。 |


### 为什么会冲突（一定要统一）
| 项目 | 说明 |
|:--|:--|
| BC 1.71 的打包变更 | `jdk15on` 更名为 `jdk18on`，基础版本提升到 Java 8。若环境不能处理 Multi-Release JAR，则应改用 `jdk15to18`。 |
| Multi-Release 限制 | 官方说明 `jdk18on` 是 multi-release；若需要**专门面向 Java 1.8** 的版本，应使用 `jdk15to18`。 |
| 重复类冲突 | `bcprov-jdk15on` / `bcprov-jdk15to18` / `bcprov-jdk18on` **是不同产物，不是版本号差异**，混用会导致重复类或类缺失。 |
| OSGi/容器问题 | Multi-Release JAR 需要容器正确识别；旧容器可能只看到主版本类或能力识别不完整。BC 1.78.1 起增加了对 OSGi 的 multi-release 元数据支持，但老版本环境仍可能有坑。 |


### 推荐的选型与排雷清单
**选择速查表**

| 场景 | 推荐产物 |
| --- | --- |
| JDK 8+ 且容器/构建链支持 Multi-Release | `bcprov-jdk18on`（配套 `bcpkix-jdk18on` / `bcutil-jdk18on`） |
| JDK 8 但运行环境对 Multi-Release 不友好 | `bcprov-jdk15to18`（配套 `bcpkix-jdk15to18` / `bcutil-jdk15to18`） |
| JDK 7 及以下 | `bcprov-jdk15to18` 或更旧的 `bcprov-jdk14`（视 JVM 版本而定） |

1) **只保留一个 BC 产物族**（建议三件套一起锁）：  
   `bcprov` + `bcpkix` + `bcutil` **同版本**、**同系列**（jdk18on 或 jdk15to18）。
2) **显式排除冲突依赖**：  
   对传递依赖中的 `bcprov-jdk15on` / `bcprov-jdk18on` / `bcprov-jdk15to18` 做 `exclude`，确保只留下一个。
3) **运行时确认**：  
   若遇到 `ClassNotFound` / `NoSuchMethodError` / `Duplicate class`，优先检查 BC 是否“多包共存”。

## JDK 1.8 低版本 & JCE 限制（Oracle vs OpenJDK）

JCE（Java Cryptography Extension）决定了**算法与密钥长度**的上限，尤其影响 AES-256、RSA 大密钥、部分 TLS 套件等。JDK 1.8 的**小版本差异很大**，请按版本处理。

::: info
说明：快速结论

| 项目 | 说明 |
|:--|:--|
| 8u161+ | Unlimited cryptography **默认启用**（仍可用 `crypto.policy` 覆盖）。 |
| 8u151/8u152 | Unlimited policy **已随 JDK 提供，但默认仍是 limited**，需要手动开启。 |
| < 8u151 | 没有 `crypto.policy`，需手动安装 JCE policy JAR。 |

:::

::: details 版本时间线（重点小版本）

| JDK 版本段 | 关键变化 | 默认行为 | 说明 |
| --- | --- | --- | --- |
| **8u151 / 8u152** | 引入 `crypto.policy` | 默认 **limited** | Unlimited policy JAR 随 JDK 提供，需显式启用 |
| **8u161+** | Unlimited 默认启用 | 默认 **unlimited** | 同时保留 limited，可用 `crypto.policy` 切换 |
| **< 8u151** | 没有 `crypto.policy` | 默认 **limited** | 需手动下载/替换 policy JAR |

:::

### Oracle JDK vs OpenJDK（务必验真）

两者差异**更多来自发行版打包策略**而非代码实现本身：

| 发行版 | 常见默认行为 | 风险提示 |
| --- | --- | --- |
| **Oracle JDK（8u161 之前）** | 默认 limited | AES-256 等需要开启/安装 unlimited policy |
| **OpenJDK 发行版** | 很多发行版默认可用 AES-256 | 具体行为依赖发行版，务必运行时检测 |

> 结论：**不要仅凭“Oracle/OpenJDK”判断**，以运行时检测为准。

### 低版本“签名/校验”坑（JCE policy JAR）

如果你从旧 JDK 拷贝 `local_policy.jar`/`US_export_policy.jar` 到新版本，可能触发：

```
java.lang.SecurityException: Jurisdiction policy files are not signed by trusted signers!
```

原因是 **JAR 签名标准在 6u131 / 7u121 / 8u111 后更新**，旧 policy JAR 不符合新签名要求。  
**正确做法**：使用目标 JDK 自带的 policy 目录 + `crypto.policy`，避免跨版本复制。

### 如何确认当前 JCE 限制（推荐放到启动日志）

```java
import javax.crypto.Cipher;

public class JceCheck {
  public static void main(String[] args) throws Exception {
    System.out.println(Cipher.getMaxAllowedKeyLength("AES"));
  }
}
```

结果解释：
- `128` = limited（AES-256 不可用）
- `2147483647` = unlimited

::: tip
提示：生产建议
1) **固定 JDK 小版本**（写入 README / 部署脚本）。  
2) **统一 JCE 策略**：  
   - 8u151/8u152：在 `java.security` 设置 `crypto.policy=unlimited`  
   - 8u161+：确保没有遗留 legacy policy JAR 干扰  
3) **运行时检测**（见 `JceCheck`）并在启动日志输出。  
:::

::: details 启用 unlimited 的常见方式
- **配置文件**：编辑 `JAVA_HOME/jre/lib/security/java.security`，设置  
  `crypto.policy=unlimited`  
- **代码方式**（需在 JCE 初始化前执行）：  
  `java.security.Security.setProperty("crypto.policy", "unlimited");`
- **注意**：8u151/8u152 默认是 limited，未显式设置则不会启用 unlimited。
:::

::: details 参考链接
- [Oracle JDK 8u161 Release Notes（Unlimited 默认启用、`crypto.policy`）](https://www.oracle.com/java/technologies/javase/8u161-relnotes.html)
- [Java 8 Release Changes（`crypto.policy`、旧 policy JAR 签名问题）](https://www.java.com/en/download/help/release_changes.html)
- [Oracle JCE policy 下载页（说明 <8u161 需单独安装）](https://www.oracle.com/java/technologies/javase-jce-all-downloads.html)
- [JCE Unlimited policy 说明（`crypto.policy` 与旧版本规则）](https://ops.java/security/articles/unlimited-strength-policy-files/)
- [OpenJDK / Oracle 差异参考（第三方资料，需运行时验证）](https://docs.datastax.com/en/dse/5.1/securing/enable-java-cryptography-extension-unlimited.html)
:::

### 方案四：GMKit Java

::: info
说明：同源实现
GMKit Java 主包提供 SM2/SM3/SM4/ZUC，SM9 通过独立 `gmkit-sm9` JNI/GmSSL 模块交付。
:::

```xml
<dependency>
    <groupId>cn.gmkit</groupId>
    <artifactId>gmkit</artifactId>
    <version>0.10.0-preview.1</version>
</dependency>
```

## 数据要点

| 项目       | 约定                      | 备注                             |
|----------|-------------------------|--------------------------------|
| SM2 公钥   | 非压缩 04+X+Y（130 hex）     | 保持与 Java 侧一致                   |
| SM2 私钥   | 64 hex                  | 参见 `defaults.sm2PrivateKeyHex` |
| SM2 密文模式 | C1C3C2（默认）、C1C2C3       | 两端一致                           |
| SM4 密钥   | 32 hex（128bit）          |                                |
| SM4 填充   | PKCS7/PKCS5，或 NONE/ZERO | 流模式不填充                         |
| 传输编码     | UTF-8 + 小写 hex          |                                |

## 模式与填充详解

### SM2 密文模式

SM2 加密后的密文由三部分组成：
| 项目 | 说明 |
|:--|:--|
| C1 | 椭圆曲线点（65字节，非压缩格式） |
| C2 | 密文数据（与明文等长） |
| C3 | 摘要值（32字节，SM3哈希） |


两种排列模式：
| 项目 | 说明 |
|:--|:--|
| C1C3C2 | gmkitx 默认模式，国密标准推荐格式 |
| C1C2C3 | 部分旧版实现使用，需显式指定 |


::: warning
注意：重要
对接时必须确保双方使用相同的密文模式，否则无法正确解密！
:::

::: tip
提示：Kona 说明
Tencent Kona 的 SM2 `Cipher` 输出 ASN.1 DER（C1C3C2），gmkitx 解密时可自动识别 0x30 开头的 ASN.1 格式。
:::

### SM4 填充模式

SM4 是分组密码，块大小为 16 字节。当明文长度不是 16 的倍数时需要填充：

- **PKCS7/PKCS5**：标准填充，自动添加 1-16 字节填充数据，每个字节值为填充长度
  - 示例：明文 11 字节，填充 5 个 0x05
- **ZERO**：补零填充，填充 0x00 直到块大小
  - 注意：解密后需手动去除尾部零
- **NONE**：无填充，仅用于 CTR/OFB/CFB 等流模式，或明文已对齐 16 字节

::: tip
提示：推荐
ECB/CBC 模式推荐使用 PKCS7 填充，可自动处理任意长度明文。
:::

## 完整互通示例（Java 端端到端）

下面示例展示 **SM2 加解密 + 签名验签、SM3 摘要、SM4 CBC** 的完整流程。  
可直接运行（Hutool + Bouncy Castle），与 gmkitx 互通时只需确保 **密钥/IV/模式/编码** 一致即可。

```java
import cn.hutool.core.util.HexUtil;
import cn.hutool.crypto.Mode;
import cn.hutool.crypto.Padding;
import cn.hutool.crypto.SmUtil;
import cn.hutool.crypto.asymmetric.SM2;
import cn.hutool.crypto.symmetric.SymmetricAlgorithm;
import cn.hutool.crypto.symmetric.SymmetricCrypto;
import org.bouncycastle.crypto.engines.SM2Engine;

public class FullInteropDemo {
  public static void main(String[] args) {
    // 固定测试向量（与 gmkitx interop.json defaults 一致）
    String sm2PubHex = "045647ebf2adcaf54f8102bea9a7ca8905794a3f2f29622593269bb55d72e0a140dc81f3dce73bb609f8a056640db0e04c08e0bd8be79140702bbdb0206e95b7ac";
    String sm2PriHex = "228049e009de869baf9aba74f8f8c52e09cde1b52cafb0df7ab154ba4593743e";
    String sm4KeyHex = "0123456789abcdeffedcba9876543210";
    String sm4IvHex  = "000102030405060708090a0b0c0d0e0f";

    String message = "Hello GMKit";

    // SM2 加解密 + 签名验签（显式指定 C1C3C2）
    SM2 sm2 = SmUtil.sm2(HexUtil.decodeHex(sm2PriHex), HexUtil.decodeHex(sm2PubHex));
    sm2.setMode(SM2Engine.Mode.C1C3C2);
    String sm2Cipher = sm2.encryptHex(message);
    String sm2Plain = sm2.decryptStr(sm2Cipher);
    String sm2Sig = sm2.signHex(message);
    boolean sm2Ok = sm2.verifyHex(message, sm2Sig);

    // SM3 摘要
    String sm3Hex = SmUtil.sm3().digestHex(message);

    // SM4 CBC + PKCS7/PKCS5
    SymmetricCrypto sm4 = new SymmetricCrypto(
      Mode.CBC,
      Padding.PKCS5Padding, // 与 PKCS7 等价（块大小 16）
      SymmetricAlgorithm.SM4.getValue(),
      HexUtil.decodeHex(sm4KeyHex),
      HexUtil.decodeHex(sm4IvHex)
    );
    String sm4Cipher = sm4.encryptHex(message);
    String sm4Plain = sm4.decryptStr(sm4Cipher);

    System.out.println("SM2 cipher : " + sm2Cipher);
    System.out.println("SM2 plain  : " + sm2Plain);
    System.out.println("SM2 verify : " + sm2Ok);
    System.out.println("SM3 hex    : " + sm3Hex);
    System.out.println("SM4 cipher : " + sm4Cipher);
    System.out.println("SM4 plain  : " + sm4Plain);
  }
}
```

## SM2 对接

::: code-tabs#sm2

@tab gmkitx
```typescript
import { sm2Encrypt, sm2Decrypt, sm2Sign, sm2Verify, SM2CipherMode } from 'gmkitx';

// 使用测试向量中的密钥
const publicKey = '04a09455a450af78e7bc6b2f8c7f1e0e...'; // 完整的04开头公钥
const privateKey = '228049e009de869baf9aba74f8f8c52e...'; // 64位十六进制私钥

// 加密 - C1C3C2 模式（默认）
const plaintext = 'Hello, SM2!';
const ciphertext = sm2Encrypt(publicKey, plaintext, { mode: SM2CipherMode.C1C3C2 });
console.log('密文:', ciphertext);

// 解密
const decrypted = sm2Decrypt(privateKey, ciphertext, { mode: SM2CipherMode.C1C3C2 });
console.log('明文:', decrypted); // 'Hello, SM2!'

// 签名
const message = 'Important message';
const signature = sm2Sign(privateKey, message);
console.log('签名:', signature);

// 验签
const isValid = sm2Verify(publicKey, message, signature);
console.log('验签结果:', isValid); // true
```

@tab Hutool
```java
import cn.hutool.core.util.HexUtil;
import cn.hutool.crypto.SmUtil;
import cn.hutool.crypto.asymmetric.SM2;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.bouncycastle.crypto.engines.SM2Engine;
import java.nio.file.Paths;

public class SM2Interop {
  public static void main(String[] args) throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(Paths.get("test/vectors/interop.json").toFile());
    JsonNode defaults = root.get("defaults");

    for (JsonNode node : root.get("cases")) {
      if (!"SM2".equals(node.get("algo").asText())) continue;

      String priHex = node.has("privateKeyHex")
        ? node.get("privateKeyHex").asText()
        : defaults.get("sm2PrivateKeyHex").asText();
      String pubHex = node.has("publicKeyHex")
        ? node.get("publicKeyHex").asText()
        : defaults.get("sm2PublicKeyHex").asText();

      byte[] pri = HexUtil.decodeHex(priHex);
      byte[] pub = HexUtil.decodeHex(pubHex);
      // Hutool 基于 Bouncy Castle，密钥使用 16 进制原始格式即可
      SM2 sm2 = SmUtil.sm2(pri, pub);

      String op = node.get("op").asText();
      if ("encrypt".equals(op)) {
        String modeStr = node.has("mode") ? node.get("mode").asText() : "C1C3C2";
        SM2Engine.Mode mode = "C1C2C3".equals(modeStr) ? SM2Engine.Mode.C1C2C3 : SM2Engine.Mode.C1C3C2;
        sm2.setMode(mode);
        String input = node.get("input").asText();
        String cipher = sm2.encryptHex(input);
        String back = sm2.decryptStr(cipher);
        if (!back.equals(input)) {
          throw new IllegalStateException(node.get("id").asText());
        }
      } else if ("sign".equals(op)) {
        // 默认 userId = 1234567812345678，与 gmkitx 一致
        String input = node.get("input").asText();
        String sig = sm2.signHex(input);
        if (!sm2.verifyHex(input, sig)) {
          throw new IllegalStateException(node.get("id").asText());
        }
      }
    }
  }
}
```

@tab Tencent Kona
```java
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tencent.kona.crypto.KonaCryptoProvider;
import com.tencent.kona.crypto.spec.SM2PrivateKeySpec;
import com.tencent.kona.crypto.spec.SM2PublicKeySpec;
import com.tencent.kona.crypto.spec.SM2SignatureParameterSpec;

import javax.crypto.Cipher;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.Security;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;

public class SM2KonaInterop {
  static {
    Security.addProvider(new KonaCryptoProvider());
  }

  private static byte[] hexToBytes(String hex) {
    int len = hex.length();
    byte[] out = new byte[len / 2];
    for (int i = 0; i < len; i += 2) {
      out[i / 2] = (byte) Integer.parseInt(hex.substring(i, i + 2), 16);
    }
    return out;
  }

  public static void main(String[] args) throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(Paths.get("test/vectors/interop.json").toFile());
    JsonNode defaults = root.get("defaults");
    KeyFactory kf = KeyFactory.getInstance("SM2", "KonaCrypto");

    for (JsonNode node : root.get("cases")) {
      if (!"SM2".equals(node.get("algo").asText())) continue;
      String priHex = node.has("privateKeyHex")
        ? node.get("privateKeyHex").asText()
        : defaults.get("sm2PrivateKeyHex").asText();
      String pubHex = node.has("publicKeyHex")
        ? node.get("publicKeyHex").asText()
        : defaults.get("sm2PublicKeyHex").asText();

      java.security.PrivateKey privateKey = kf.generatePrivate(new SM2PrivateKeySpec(hexToBytes(priHex)));
      ECPublicKey publicKey = (ECPublicKey) kf.generatePublic(new SM2PublicKeySpec(hexToBytes(pubHex)));

      String op = node.get("op").asText();
      String input = node.get("input").asText();
      if ("encrypt".equals(op)) {
        Cipher cipher = Cipher.getInstance("SM2", "KonaCrypto");
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);
        byte[] cipherBytes = cipher.doFinal(input.getBytes(StandardCharsets.UTF_8));

        // Kona 输出 ASN.1 DER（C1C3C2），gmkitx 可自动识别
        Cipher decrypt = Cipher.getInstance("SM2", "KonaCrypto");
        decrypt.init(Cipher.DECRYPT_MODE, privateKey);
        byte[] plain = decrypt.doFinal(cipherBytes);
        if (!new String(plain, StandardCharsets.UTF_8).equals(input)) {
          throw new IllegalStateException(node.get("id").asText());
        }
      } else if ("sign".equals(op)) {
        Signature signer = Signature.getInstance("SM2", "KonaCrypto");
        signer.setParameter(new SM2SignatureParameterSpec(publicKey));
        signer.initSign(privateKey);
        byte[] msg = input.getBytes(StandardCharsets.UTF_8);
        signer.update(msg);
        byte[] sig = signer.sign();

        Signature verifier = Signature.getInstance("SM2", "KonaCrypto");
        verifier.setParameter(new SM2SignatureParameterSpec(publicKey));
        verifier.initVerify(publicKey);
        verifier.update(msg);
        if (!verifier.verify(sig)) {
          throw new IllegalStateException(node.get("id").asText());
        }
      }
    }
  }
}
```

@tab Bouncy Castle
```java
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.bouncycastle.asn1.gm.GMNamedCurves;
import org.bouncycastle.crypto.digests.SM3Digest;
import org.bouncycastle.crypto.engines.SM2Engine;
import org.bouncycastle.crypto.params.*;
import org.bouncycastle.crypto.signers.SM2Signer;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.math.ec.ECPoint;
import org.bouncycastle.util.encoders.Hex;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.security.Security;

public class SM2BCInterop {
  static {
    Security.addProvider(new BouncyCastleProvider());
  }

  private static final byte[] DEFAULT_ID = "1234567812345678".getBytes(StandardCharsets.UTF_8);

  public static void main(String[] args) throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(Paths.get("test/vectors/interop.json").toFile());
    JsonNode defaults = root.get("defaults");
    org.bouncycastle.asn1.x9.X9ECParameters curve = GMNamedCurves.getByName("sm2p256v1");
    ECDomainParameters domain = new ECDomainParameters(curve.getCurve(), curve.getG(), curve.getN());

    for (JsonNode node : root.get("cases")) {
      if (!"SM2".equals(node.get("algo").asText())) continue;
      String priHex = node.has("privateKeyHex")
        ? node.get("privateKeyHex").asText()
        : defaults.get("sm2PrivateKeyHex").asText();
      String pubHex = node.has("publicKeyHex")
        ? node.get("publicKeyHex").asText()
        : defaults.get("sm2PublicKeyHex").asText();

      // 构造公私钥参数（原始 16 进制格式）
      BigInteger d = new BigInteger(1, Hex.decode(priHex));
      ECPrivateKeyParameters privParams = new ECPrivateKeyParameters(d, domain);
      ECPoint q = curve.getCurve().decodePoint(Hex.decode(pubHex));
      ECPublicKeyParameters pubParams = new ECPublicKeyParameters(q, domain);

      String op = node.get("op").asText();
      String inputText = node.get("input").asText();
      if ("encrypt".equals(op)) {
        String modeStr = node.has("mode") ? node.get("mode").asText() : "C1C3C2";
        SM2Engine.Mode mode = "C1C2C3".equals(modeStr) ? SM2Engine.Mode.C1C2C3 : SM2Engine.Mode.C1C3C2;
        SM2Engine engine = new SM2Engine(mode);
        engine.init(true, new ParametersWithRandom(pubParams));
        byte[] input = inputText.getBytes(StandardCharsets.UTF_8);
        byte[] cipher = engine.processBlock(input, 0, input.length);

        SM2Engine decrypt = new SM2Engine(mode);
        decrypt.init(false, privParams);
        byte[] plain = decrypt.processBlock(cipher, 0, cipher.length);
        if (!new String(plain, StandardCharsets.UTF_8).equals(inputText)) {
          throw new IllegalStateException(node.get("id").asText());
        }
      } else if ("sign".equals(op)) {
        // SM2 签名（默认 userId = 1234567812345678）
        SM2Signer signer = new SM2Signer(new SM3Digest());
        signer.init(true, new ParametersWithID(new ParametersWithRandom(privParams), DEFAULT_ID));
        byte[] msg = inputText.getBytes(StandardCharsets.UTF_8);
        signer.update(msg, 0, msg.length);
        byte[] sig = signer.generateSignature();

        SM2Signer verifier = new SM2Signer(new SM3Digest());
        verifier.init(false, new ParametersWithID(pubParams, DEFAULT_ID));
        verifier.update(msg, 0, msg.length);
        if (!verifier.verifySignature(sig)) {
          throw new IllegalStateException(node.get("id").asText());
        }
      }
    }
  }
}
```
:::

## SM3 对接

::: code-tabs#sm3

@tab gmkitx
```typescript
import { sm3Digest, sm3Hmac } from 'gmkitx';

// 计算 SM3 摘要
const hash = sm3Digest('Hello, SM3!');
console.log('SM3摘要:', hash);
// 输出: 32字节（64位十六进制）哈希值

// HMAC-SM3
const mac = sm3Hmac('secret-key', 'message');
console.log('HMAC-SM3:', mac);

// 增量哈希
import { SM3 } from 'gmkitx';
const sm3 = new SM3();
sm3.update('Hello, ');
sm3.update('World!');
const result = sm3.digest();
console.log('增量哈希:', result);
```

@tab Hutool
```java
import cn.hutool.crypto.SmUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Paths;

public class SM3Interop {
  public static void main(String[] args) throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(Paths.get("test/vectors/interop.json").toFile());
    for (JsonNode node : root.get("cases")) {
      if (!"SM3".equals(node.get("algo").asText())) continue;
      // 每次重新创建 SM3 实例，避免状态串扰
      cn.hutool.crypto.digest.SM3 sm3 = SmUtil.sm3();
      String expected = node.get("expected").get("hex").asText();
      String out = sm3.digestHex(node.get("input").asText());
      if (!out.equals(expected)) {
        throw new IllegalStateException(node.get("id").asText());
      }
    }
  }
}
```

@tab Tencent Kona
```java
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tencent.kona.crypto.KonaCryptoProvider;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.Security;

public class SM3KonaInterop {
  static {
    Security.addProvider(new KonaCryptoProvider());
  }

  private static String toHex(byte[] input) {
    StringBuilder sb = new StringBuilder(input.length * 2);
    for (byte b : input) {
      sb.append(String.format("%02x", b));
    }
    return sb.toString();
  }

  public static void main(String[] args) throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(Paths.get("test/vectors/interop.json").toFile());
    for (JsonNode node : root.get("cases")) {
      if (!"SM3".equals(node.get("algo").asText())) continue;
      String expected = node.get("expected").get("hex").asText();
      byte[] input = node.get("input").asText().getBytes(StandardCharsets.UTF_8);

      // 通过 JCA 调用 KonaCrypto 的 SM3 实现
      MessageDigest md = MessageDigest.getInstance("SM3", "KonaCrypto");
      byte[] out = md.digest(input);
      if (!toHex(out).equals(expected)) {
        throw new IllegalStateException(node.get("id").asText());
      }
    }
  }
}
```

@tab Bouncy Castle
```java
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.bouncycastle.crypto.digests.SM3Digest;
import org.bouncycastle.util.encoders.Hex;
import java.nio.file.Paths;

public class SM3BCInterop {
  public static void main(String[] args) throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(Paths.get("test/vectors/interop.json").toFile());
    for (JsonNode node : root.get("cases")) {
      if (!"SM3".equals(node.get("algo").asText())) continue;
      String expected = node.get("expected").get("hex").asText();
      byte[] input = node.get("input").asText().getBytes(java.nio.charset.StandardCharsets.UTF_8);
      // BC 直接使用 SM3Digest
      SM3Digest d = new SM3Digest();
      d.update(input, 0, input.length);
      byte[] out = new byte[d.getDigestSize()];
      d.doFinal(out, 0);
      if (!Hex.toHexString(out).equals(expected)) {
        throw new IllegalStateException(node.get("id").asText());
      }
    }
  }
}
```
:::

## SM4 对接

::: code-tabs#sm4

@tab gmkitx
```typescript
import { sm4Encrypt, sm4Decrypt, CipherMode, PaddingMode } from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210'; // 32位十六进制（16字节）
const iv = 'fedcba98765432100123456789abcdef';   // CBC模式需要IV
const plaintext = 'Hello, SM4!';

// ECB 模式 + PKCS7 填充
const cipherECB = sm4Encrypt(key, plaintext, {
  mode: CipherMode.ECB,
  padding: PaddingMode.PKCS7
});
console.log('ECB密文:', cipherECB);

const plainECB = sm4Decrypt(key, cipherECB, {
  mode: CipherMode.ECB,
  padding: PaddingMode.PKCS7
});
console.log('ECB明文:', plainECB);

// CBC 模式 + PKCS7 填充
const cipherCBC = sm4Encrypt(key, plaintext, {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv
});
console.log('CBC密文:', cipherCBC);

const plainCBC = sm4Decrypt(key, cipherCBC, {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv
});
console.log('CBC明文:', plainCBC);

// 面向对象 API
import { SM4 } from 'gmkitx';
const sm4ecb = SM4.ECB(key);
const encrypted = sm4ecb.encrypt('Hello, SM4 OOP!');
const decrypted = sm4ecb.decrypt(encrypted);
```

@tab Hutool
```java
import cn.hutool.core.util.HexUtil;
import cn.hutool.crypto.Mode;
import cn.hutool.crypto.Padding;
import cn.hutool.crypto.symmetric.SymmetricAlgorithm;
import cn.hutool.crypto.symmetric.SymmetricCrypto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Paths;

public class SM4Interop {
  public static void main(String[] args) throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(Paths.get("test/vectors/interop.json").toFile());
    for (JsonNode node : root.get("cases")) {
      if (!"SM4".equals(node.get("algo").asText())) continue;

      byte[] key = HexUtil.decodeHex(node.has("keyHex") ? node.get("keyHex").asText() : root.get("defaults").get("sm4KeyHex").asText());
      byte[] iv = node.has("ivHex") ? HexUtil.decodeHex(node.get("ivHex").asText()) : null;
      Mode mode = Mode.valueOf(node.get("mode").asText());
      // Hutool 使用 PKCS5Padding 表示 PKCS7（块大小 16）
      Padding padding = node.get("padding").asText().equals("PKCS7") ? Padding.PKCS5Padding : Padding.valueOf(node.get("padding").asText());

      // ECB 不需要 IV，CBC 需要 IV
      SymmetricCrypto sm4 = new SymmetricCrypto(mode, padding, SymmetricAlgorithm.SM4.getValue(), key, iv);
      String cipher = sm4.encryptHex(node.get("input").asText());
      if (node.get("expected").has("cipherHex")) {
        if (!cipher.equals(node.get("expected").get("cipherHex").asText())) {
          throw new IllegalStateException(node.get("id").asText());
        }
      }
      String plain = sm4.decryptStr(cipher);
      if (!plain.equals(node.get("input").asText())) {
        throw new IllegalStateException(node.get("id").asText() + "-decrypt");
      }
    }
  }
}
```

@tab Tencent Kona
```java
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tencent.kona.crypto.KonaCryptoProvider;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.security.Security;

public class SM4KonaInterop {
  static {
    Security.addProvider(new KonaCryptoProvider());
  }

  private static byte[] hexToBytes(String hex) {
    int len = hex.length();
    byte[] out = new byte[len / 2];
    for (int i = 0; i < len; i += 2) {
      out[i / 2] = (byte) Integer.parseInt(hex.substring(i, i + 2), 16);
    }
    return out;
  }

  private static String toHex(byte[] input) {
    StringBuilder sb = new StringBuilder(input.length * 2);
    for (byte b : input) {
      sb.append(String.format("%02x", b));
    }
    return sb.toString();
  }

  public static void main(String[] args) throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(Paths.get("test/vectors/interop.json").toFile());
    for (JsonNode node : root.get("cases")) {
      if (!"SM4".equals(node.get("algo").asText())) continue;
      String mode = node.get("mode").asText();
      String padding = node.get("padding").asText();

      byte[] key = hexToBytes(node.has("keyHex") ? node.get("keyHex").asText() : root.get("defaults").get("sm4KeyHex").asText());
      byte[] iv = node.has("ivHex") ? hexToBytes(node.get("ivHex").asText()) : null;
      String transformation = "SM4/" + mode + "/" + (padding.equals("PKCS7") ? "PKCS7Padding" : "NoPadding");
      SecretKeySpec keySpec = new SecretKeySpec(key, "SM4");

      // 加密
      Cipher encrypt = Cipher.getInstance(transformation, "KonaCrypto");
      if ("CBC".equals(mode)) {
        encrypt.init(Cipher.ENCRYPT_MODE, keySpec, new IvParameterSpec(iv));
      } else {
        encrypt.init(Cipher.ENCRYPT_MODE, keySpec);
      }
      byte[] cipherBytes = encrypt.doFinal(node.get("input").asText().getBytes(StandardCharsets.UTF_8));
      if (node.get("expected").has("cipherHex")) {
        if (!toHex(cipherBytes).equals(node.get("expected").get("cipherHex").asText())) {
          throw new IllegalStateException(node.get("id").asText());
        }
      }

      // 解密
      Cipher decrypt = Cipher.getInstance(transformation, "KonaCrypto");
      if ("CBC".equals(mode)) {
        decrypt.init(Cipher.DECRYPT_MODE, keySpec, new IvParameterSpec(iv));
      } else {
        decrypt.init(Cipher.DECRYPT_MODE, keySpec);
      }
      byte[] plain = decrypt.doFinal(cipherBytes);
      if (!new String(plain, StandardCharsets.UTF_8).equals(node.get("input").asText())) {
        throw new IllegalStateException(node.get("id").asText() + "-decrypt");
      }
    }
  }
}
```

@tab Bouncy Castle
```java
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.bouncycastle.crypto.BufferedBlockCipher;
import org.bouncycastle.crypto.engines.SM4Engine;
import org.bouncycastle.crypto.modes.CBCBlockCipher;
import org.bouncycastle.crypto.paddings.PaddedBufferedBlockCipher;
import org.bouncycastle.crypto.params.KeyParameter;
import org.bouncycastle.crypto.params.ParametersWithIV;
import org.bouncycastle.util.encoders.Hex;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;

public class SM4BCInterop {
  private static byte[] run(BufferedBlockCipher cipher, byte[] input) throws Exception {
    byte[] buf = new byte[cipher.getOutputSize(input.length)];
    int len = cipher.processBytes(input, 0, input.length, buf, 0);
    len += cipher.doFinal(buf, len);
    byte[] out = new byte[len];
    System.arraycopy(buf, 0, out, 0, len);
    return out;
  }

  public static void main(String[] args) throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(Paths.get("test/vectors/interop.json").toFile());
    for (JsonNode node : root.get("cases")) {
      if (!"SM4".equals(node.get("algo").asText())) continue;
      byte[] key = Hex.decode(node.has("keyHex") ? node.get("keyHex").asText() : root.get("defaults").get("sm4KeyHex").asText());
      byte[] iv = node.has("ivHex") ? Hex.decode(node.get("ivHex").asText()) : null;

      // PaddedBufferedBlockCipher 默认使用 PKCS7Padding
      BufferedBlockCipher enc;
      if (iv != null) {
        enc = new PaddedBufferedBlockCipher(new CBCBlockCipher(new SM4Engine()));
        enc.init(true, new ParametersWithIV(new KeyParameter(key), iv));
      } else {
        enc = new PaddedBufferedBlockCipher(new SM4Engine());
        enc.init(true, new KeyParameter(key));
      }
      byte[] cipher = run(enc, node.get("input").asText().getBytes(StandardCharsets.UTF_8));

      if (node.get("expected").has("cipherHex")) {
        if (!Hex.toHexString(cipher).equals(node.get("expected").get("cipherHex").asText())) {
          throw new IllegalStateException(node.get("id").asText());
        }
      }

      BufferedBlockCipher dec;
      if (iv != null) {
        dec = new PaddedBufferedBlockCipher(new CBCBlockCipher(new SM4Engine()));
        dec.init(false, new ParametersWithIV(new KeyParameter(key), iv));
      } else {
        dec = new PaddedBufferedBlockCipher(new SM4Engine());
        dec.init(false, new KeyParameter(key));
      }
      byte[] plain = run(dec, cipher);
      if (!new String(plain, StandardCharsets.UTF_8).equals(node.get("input").asText())) {
        throw new IllegalStateException(node.get("id").asText() + "-decrypt");
      }
    }
  }
}
```
:::

## 扩展指引

- 本页展示 Java 与 gmkitx 的对接方案；其他语言对接请参考对应的语言指南。
- 所有语言对接均使用统一的测试向量 `test/vectors/interop.json`，确保跨语言互操作性。
- 如需切换 Java 库，保持密钥/IV/模式/编码约定不变，替换代码即可。
- 扩展 CTR/OFB/CFB/GCM 或固定随机源的 SM2 用例时，先确认计数器/AAD/随机策略一致，再写入测试向量并在备注中标明。 
