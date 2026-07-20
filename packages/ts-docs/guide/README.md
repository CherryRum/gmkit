---
title: 开始使用
icon: play
order: 1
category:
  - 开始使用
---

# 开始使用

GMKit 以独立的 Java 和 TypeScript 包发布。先根据运行环境选择入口，再确认算法、编码、随机源与运行时边界。

## 选择开发语言

| 场景 | 安装包 | 起步文档 |
|:--|:--|:--|
| JVM 应用中的 SM2、SM3、SM4、ZUC | `cn.gmkit:gmkit:0.10.1` | [Java](/java/) |
| JVM 应用中的 SM9 | `cn.gmkit:gmkit-sm9:0.10.1` | [Java SM9](/java/#sm9-独立依赖) |
| 浏览器、Node.js 或小程序 | `gmkitx@0.10.1` | [TypeScript](/typescript/) |

TypeScript 包不提供 SM9。Java 的 SM9 能力依赖 JAR 内随包发布的 JNI/GmSSL 运行库，支持平台和加载顺序见 Java 文档。

## 使用前检查

1. 明确文本是否按 UTF-8 编码，二进制输入不要先转成普通字符串。
2. 明确 SM2 的用户标识、签名格式和密文排列，不能只比较函数名称。
3. 明确 SM4 模式、填充、IV/nonce、AAD 和认证标签；新协议不应使用 ECB。
4. 在目标运行环境检查安全随机源，密钥和 nonce 不应来自 `Math.random()`。
5. 用固定向量验证协议字段，再做双向互操作测试。

继续阅读：[快速开始](/guide/getting-started)、[安全边界](/guide/security)、[共享测试向量](/dev/INTEROP_VECTORS)。
