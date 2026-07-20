---
title: Java API 说明书
icon: coffee
category:
  - API Reference
  - Java
tag:
  - Java
  - Maven
  - API
---

# Java API 说明书

这里是 `cn.gmkit:gmkit` 与 `cn.gmkit:gmkit-sm9` 公共 API 的手写说明书入口。说明书解释入口选择、重载差异、Builder 默认值、异常和资源生命周期；逐成员签名仍可在 [Javadoc Reference](/api/java/latest/) 中核对。

## 阅读顺序

1. 从 [快速开始](/guide/getting-started.html#java) 引入主包或 SM9 扩展包。
2. 阅读本说明书中的实例式、静态式和安全上下文约定。
3. 按包进入 core、SM2、SM3、SM4、ZUC、SM9 或集成页面。
4. 排查具体重载或源码签名时使用 [latest Javadoc](/api/java/latest/)；线上版本问题使用相同版本的快照。

## 当前边界

- `cn.gmkit:gmkit` 提供 core、SM2、SM3、SM4、ZUC 和 Java 混合加密便利封装。
- `cn.gmkit:gmkit-sm9` 是独立依赖，通过 JNI 调用随 JAR 分发的 GmSSL native runtime。
- Java 无 Charset 重载时使用 UTF-8；二进制协议优先使用 `byte[]`。
- Java 与 TypeScript 独立版本化；共享向量不代表两端 API、异常或对象生命周期相同。

## Reference

- [Javadoc latest](/api/java/latest/)
- [Javadoc 版本目录](/api/)
- [公开 API 审计清单](/api/public-api.html)
- [公共输入与安全约定](/api/common.html)
