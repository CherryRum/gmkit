---
title: Java API 说明书
description: 按 core、SM2、SM3、SM4、ZUC、SM9 和集成类型查阅 Java 公共 API。
pageInfo: false
contributors: false
editLink: false
icon: coffee
category:
  - API 说明书
  - Java
tag:
  - Java
  - Maven
  - API
---

# Java API 说明书

GMKit Java 由主包 `cn.gmkit:gmkit` 和独立 SM9 包 `cn.gmkit:gmkit-sm9` 组成。本说明书解释实例式/静态式入口、重载差异、Builder 默认值、异常和资源生命周期。

## Maven 依赖

主包提供 core、SM2、SM3、SM4、ZUC 和混合加密：

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit</artifactId>
  <version>0.10.1</version>
</dependency>
```

需要 SM9 时再增加独立模块：

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit-sm9</artifactId>
  <version>0.10.1</version>
</dependency>
```

主包最低支持 Java 8。`gmkit-sm9` 还要求当前系统和架构存在随 JAR 分发的 native runtime；应用启动时应调用 `SM9.isAvailable()` 诊断。

## 实例式与静态式

SM2、SM3、SM4 同时提供实例类和 `*Util` 静态类：

```java
SM3 sm3 = new SM3();
String byInstance = sm3.digestHex("abc");
String byUtility = SM3Util.digestHex("abc");
if (!byInstance.equals(byUtility)) {
    throw new IllegalStateException("SM3 entry points disagree");
}
```

| 需求 | 推荐入口 |
|:--|:--|
| 复用 `GmSecurityContext` | `SM2`、`SM4` 实例 |
| 简单一次性调用 | `SM2Util`、`SM3Util`、`SM4Util` |
| ZUC/EEA3/EIA3 | `ZUC` 或 `ZUCUtil`，两者都是静态入口 |
| SM9 | `SM9` 门面与 `AutoCloseable` 密钥对象 |

实例类没有声明线程安全。需要并发操作时使用独立实例，或只调用无共享状态的静态工具。

## 包与页面

| 包/模块 | 说明书 | 公共类型 |
|:--|:--|:--|
| `cn.gmkit.core` | [核心 API](/api/java/core.html) | 编码、字节、Provider、安全上下文、格式枚举、异常 |
| `cn.gmkit.sm2` | [SM2 API](/api/java/sm2.html) | 主入口、选项、密钥、密文、签名和密钥交换 |
| `cn.gmkit.sm3` | [SM3 API](/api/java/sm3.html) | 摘要和 HMAC |
| `cn.gmkit.sm4` | [SM4 API](/api/java/sm4.html) | 工作模式、填充、AEAD、结果对象 |
| `cn.gmkit.zuc` | [ZUC API](/api/java/zuc.html) | ZUC-128、EEA3、EIA3 |
| `cn.gmkit.sm9` | [SM9 API](/api/java/sm9.html) | JNI 诊断、密钥、签名、IBE、PEM、生命周期 |
| `cn.gmkit.integration` | [SM2 + SM4 混合加密 API](/api/java/integration.html) | 会话密钥封装与结构化载荷 |

## 字符串、字节与异常总则

- 无 Charset 重载时，字符串统一按 UTF-8。
- 密钥、IV、密文等 Hex 字符串使用严格解码；业务二进制优先使用 `byte[]`。
- 返回 `byte[]` 的值对象 getter 通常执行防御性复制，调用方仍应及时清理敏感副本。
- 验签失败返回 `false`；非法参数、编码、密钥和密码操作失败通常抛 `GmkitException`。
- SM9 native、PEM 和句柄错误抛 `SM9Exception`；平台不支持抛 `SM9UnsupportedPlatformException`。
- 不要捕获异常后返回空明文、空数组或成功状态。

## 安全上下文

需要固定 Bouncy Castle Provider 或注入 `SecureRandom` 时使用 `GmSecurityContext`：

```java
GmSecurityContext context = GmSecurityContext.builder()
    .secureRandom(new SecureRandom())
    .registerProvider(true)
    .build();
SM2 sm2 = new SM2(context);
```

完整 Provider 与全局注册语义见 [核心 API](/api/java/core.html#provider-与安全上下文)。

## 已发布版本签名

需要核对历史制品的逐成员签名时，从 [已发布版本签名索引](/api/#已发布版本签名索引) 选择与 Maven 制品相同的版本。当前页面及各算法页负责解释用途、约束和异常行为。
