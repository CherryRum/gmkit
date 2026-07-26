---
title: Java 使用手册
description: 从依赖和 Provider 校验开始，按业务任务使用 GMKit Java 0.10.1。
pageInfo: false
contributors: false
editLink: false
icon: coffee
category:
  - 使用手册
  - Java
tag:
  - Maven
  - Java 8
  - Bouncy Castle
---

# Java 使用手册

本手册只描述 `0.10.1` 已发布行为。主包提供 SM2、SM3、SM4、ZUC 和混合加密；SM9 是包含本地动态库（native）的独立制品。

## 选择制品

普通国密算法只引入主包：

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit</artifactId>
  <version>0.10.1</version>
</dependency>
```

使用 SM9 时再增加：

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit-sm9</artifactId>
  <version>0.10.1</version>
</dependency>
```

两个制品最低支持 Java 8。`gmkit-sm9` 是否能运行还取决于操作系统、CPU 架构和 JAR 中是否包含对应本地库，不能只靠 Maven 依赖解析成功判断。

## 首次运行

下面的 JUnit 测试不注册全局 Provider。它创建一个 BC Provider 实例，连同 `SecureRandom` 放入 `GmSecurityContext`，随后验证 SM2 密钥生成和 SM3 固定向量。

<!-- code-sample id="manual-java-start" steps="创建 Provider|生成 SM2 密钥|计算 SM3 固定向量|随机源断言" -->
```java
<!-- @include: ../../../../packages/java/gmkit/src/test/java/cn/gmkit/ManualJavaStartTest.java#manual-java-start -->
```

运行本手册的主包样例：

```bash
cd packages/java
mvn -B -ntp -pl gmkit \
  -Dtest=ManualJavaStartTest,ManualJavaCoreTest,ManualJavaSm2Test,ManualJavaSm3Test,ManualJavaSm4Test,ManualJavaZucTest \
  test
```

## Provider 策略

<ApiTable label="Java Provider 策略" min-width="68rem">

| 策略 | 配置 | 对 JVM 全局状态的影响 | 使用位置 |
|:--|:--|:--|:--|
| 默认上下文 | `new SM2()`、`new SM4()` | 首次取 Provider 时确保 BC 已注册 | 独立应用、简单接入 |
| 显式且不注册 | `registerProvider(false)` | 不修改 `Security` Provider 列表 | 容器、共享 JVM、测试 |
| 显式且自动注册 | `registerProvider(true)` | 调用 `context.provider()` 时按需注册 | 应用启动层统一管理 |

</ApiTable>

同一业务模块应把一个不可变 `GmSecurityContext` 传给 `SM2` 和 `SM4`。不要在请求处理中反复修改 JVM Provider 顺序。

## 主线入口

<ApiTable label="Java 手册入口" min-width="68rem">

| 任务 | 本手册使用的入口 | 说明 |
|:--|:--|:--|
| SM2 | `new SM2(context)` | 标准 `SM3(Z || M)` 签名、加解密和密钥交换 |
| SM3 | `SM3Util` | 一次性摘要和 HMAC，无需保存实例 |
| SM4 | `new SM4(context)` + `SM4Options` | 模式、nonce、AAD 和 tag 明确放入选项 |
| ZUC | `ZUC` 静态方法 | 区分 byte、word 和 bit 长度 |
| SM9 | `SM9` 门面 + 句柄类型 | 独立制品；所有句柄使用 try-with-resources |

</ApiTable>

## 按任务阅读

<div class="doc-path-grid">
  <a class="doc-path-card" href="/manual/java/core.html"><span class="doc-path-label">基础</span><strong>核心类型与错误</strong><small>编码、字节、Provider、安全上下文和异常。</small></a>
  <a class="doc-path-card" href="/manual/java/sm2.html"><span class="doc-path-label">身份与密钥</span><strong>SM2</strong><small>标准 Z 签名、C1C3C2 加解密和密钥交换。</small></a>
  <a class="doc-path-card" href="/manual/java/sm3.html"><span class="doc-path-label">摘要与认证</span><strong>SM3</strong><small>固定向量、HMAC、String、byte[] 和 Charset。</small></a>
  <a class="doc-path-card" href="/manual/java/sm4.html"><span class="doc-path-label">业务数据</span><strong>SM4</strong><small>GCM、AAD、tag、二进制和认证失败。</small></a>
  <a class="doc-path-card" href="/manual/java/zuc.html"><span class="doc-path-label">协议指定</span><strong>ZUC</strong><small>密钥流、EEA3、EIA3 和 bitLength。</small></a>
  <a class="doc-path-card" href="/manual/java/sm9.html"><span class="doc-path-label">独立制品</span><strong>SM9</strong><small>平台检查、KGC、身份私钥、IBE、PEM 和句柄。</small></a>
  <a class="doc-path-card" href="/manual/java/hybrid.html"><span class="doc-path-label">大消息</span><strong>SM2 + SM4</strong><small>会话 key、GCM 载荷、篡改失败和 schema。</small></a>
</div>

旧 no-Z、空用户标识常量、自动编码识别和其他兼容入口统一见[旧系统迁移](/manual/migration.html)。全部签名见 [Java API 说明书](/api/java/)。
