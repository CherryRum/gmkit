---
title: Java
icon: code
category:
  - Java
---

# Java

GMKit Java 当前发布两个按需依赖的制品。普通算法与 SM9 分开引用，不使用 SM9 的项目不会下载其 native 运行库。

## 核心算法

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit</artifactId>
  <version>0.10.1</version>
</dependency>
```

`gmkit` 当前提供 SM2、SM3、SM4 和 ZUC。最低编译基线为 Java 8；发布验证同时覆盖多个 LTS 运行时。

## SM9 独立依赖

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit-sm9</artifactId>
  <version>0.10.1</version>
</dependency>
```

`gmkit-sm9` 同时包含 Java API、JNI 桥接和已支持平台的 GmSSL 动态库。运行时只选择并加载当前平台资源；不支持的平台会返回明确错误。SM9 对象持有 native 资源，使用后应通过 `try-with-resources` 或 `close()` 释放。

完整安装、平台列表和示例见 [GMKit Java 指南](/java/guide)。公开成员详见 [Java API Reference](/api/)。
