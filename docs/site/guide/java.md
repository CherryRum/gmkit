---
title: Java 快速入门
description: 安装 GMKit 0.10.1，检查 Java 8、Bouncy Castle Provider、安全上下文和 SM3 固定向量。
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

主包提供 core、SM2、SM3、SM4、ZUC 和 SM2 + SM4 混合加密，最低支持 Java 8。先用最小测试确认制品、Provider、安全随机源和 SM3 结果，再进入任务手册。

## 1. 安装主包

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit</artifactId>
  <version>0.10.1</version>
</dependency>
```

如果项目使用 Gradle，请仍以 Maven Central 的 `cn.gmkit:gmkit:0.10.1` 为坐标；不要依赖仓库内部模块路径。

## 2. 运行最小验证

下面的 JUnit 5 源码会检查 Provider、`SecureRandom`、SM2 密钥生成和 SM3 `abc` 固定向量。

<!-- code-sample id="guide-java-start" steps="创建 Provider|生成 SM2 密钥|计算 SM3 固定向量|随机源断言" -->
```java
<!-- @include: ../../../packages/java/gmkit/src/test/java/cn/gmkit/ManualJavaStartTest.java#manual-java-start -->
```

仓库内可直接运行：

```bash
mvn -f packages/java/pom.xml -B -ntp \
  -pl gmkit -Dtest=ManualJavaStartTest test
```

<ApiTable label="Java 最小验证结果" min-width="60rem">

| 检查项 | 通过条件 | 还没有证明什么 |
|:--|:--|:--|
| Provider | 能取得并注册 BC Provider | 全局 Provider 顺序适合所有应用 |
| 安全上下文 | `SecureRandom` 和 Provider 可解析 | 生产密钥存储与轮换已经完成 |
| SM2 密钥 | 私钥 64 个 Hex 字符，公钥为非压缩点 | 证书、身份绑定和授权已经完成 |
| SM3 固定向量 | `abc` 得到 `66c7…a8e0` | 签名、认证加密和跨语言协议已经接通 |
| 非法输入 | `SM3Util.digest(null)` 抛 `GmkitException` | 所有上游参数都已清洗 |

</ApiTable>

## 3. 接着完成业务任务

<div class="doc-path-grid doc-path-grid-compact">
  <a class="doc-path-card" href="/manual/java/core.html">
    <span class="doc-path-label">先固定环境</span>
    <strong>编码、Provider 与异常</strong>
    <small>明确 UTF-8、Hex/Base64、安全上下文和服务错误映射。</small>
  </a>
  <a class="doc-path-card" href="/manual/java/sm2.html">
    <span class="doc-path-label">身份与小数据</span>
    <strong>标准 SM2 签名和加解密</strong>
    <small>使用非空 userId、标准 Z、DER 签名和 C1C3C2 密文。</small>
  </a>
  <a class="doc-path-card" href="/manual/java/sm4.html">
    <span class="doc-path-label">业务数据</span>
    <strong>SM4-GCM 认证加密</strong>
    <small>配置 nonce、AAD 和 tag，并确认认证失败不返回明文。</small>
  </a>
  <a class="doc-path-card" href="/manual/java/sm9.html">
    <span class="doc-path-label">独立制品</span>
    <strong>评估并接入 SM9</strong>
    <small>先检查平台，再处理 KGC、身份私钥、PEM、IBE 和资源关闭。</small>
  </a>
</div>

需要精确重载和异常时查 [Java API 说明书](/api/java/)；维护旧数据时才进入[旧系统迁移](/manual/migration.html)。

## SM9 依赖按需添加

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit-sm9</artifactId>
  <version>0.10.1</version>
</dependency>
```

不使用 SM9 的服务不添加这个制品。使用时必须先验证目标平台，所有持有本地动态库（native）句柄的类型都用 try-with-resources 关闭。

::: warning 上线边界
当前发布包尚未完成独立第三方安全审计。固定向量和示例测试不能替代 Provider 策略、密钥管理、协议评审、密码产品认证或目标环境安全评估。
:::
