---
title: 接入环境与验收清单
description: 核对 GMKit 的运行环境、依赖版本、固定向量、失败断言和协议记录项。
pageInfo: false
contributors: false
editLink: false
icon: route
order: 2
category:
  - 使用指南
tag:
  - 安装
  - 环境检查
  - 接入流程
---

# 接入环境与验收清单

这份清单用于判断一次接入是否真的完成。语言选择和安装步骤见 [开始使用](/guide/)；这里集中核对环境、正向结果、失败路径和需要写入协议的字段。

## 环境基线

<ApiTable label="GMKit 运行环境基线" min-width="70rem">

| 环境 | 制品 | 最低基线 | 额外检查 |
|:--|:--|:--|:--|
| Node.js | `gmkitx@0.10.1` | Node.js 18 | ESM/CJS 入口、安全随机源 |
| 现代浏览器 | `gmkitx@0.10.1` | ES2020、TextEncoder/TextDecoder | Web Crypto、CSP、XSS 与密钥暴露 |
| 受限小程序 | `gmkitx@0.10.1` | 兼容 ES2020 语义 | 注入平台 CSPRNG，必要时注入 UTF-8 codec |
| Java 服务 | `cn.gmkit:gmkit:0.10.1` | Java 8 | Bouncy Castle Provider、SecureRandom |
| Java + SM9 | `cn.gmkit:gmkit-sm9:0.10.1` | Java 8 + 受支持平台 | JNI/GmSSL 可用性和句柄关闭 |

</ApiTable>

浏览器、Node.js 和小程序进入 [TypeScript 快速入门](/guide/typescript.html)；JVM 服务进入 [Java 快速入门](/guide/java.html)。SM9 是独立 Java 制品，不应为未使用 SM9 的服务增加本地动态库依赖。

## 五项验收

<ol class="doc-steps">
  <li><strong>依赖可复现</strong><span>锁定 <code>0.10.1</code>，构建日志能确认实际解析到的 npm 或 Maven 制品版本。</span></li>
  <li><strong>固定向量一致</strong><span>SM3 <code>abc</code> 得到 <code>66c7f0f4…8f4ba8e0</code>，先排除包入口、UTF-8 和输出格式问题。</span></li>
  <li><strong>随机操作成功</strong><span>使用生产环境随机源完成一次 SM2 签名验签或 SM4-GCM 加解密。</span></li>
  <li><strong>篡改一定失败</strong><span>修改消息、身份、AAD、ciphertext、tag 或签名，确认返回 <code>false</code> 或抛出文档规定的异常。</span></li>
  <li><strong>二进制不经文本</strong><span>图片、压缩包和协议帧走字节 API；只有明确的业务文本才按 UTF-8 编解码。</span></li>
</ol>

## 写入协议或配置

<ApiTable label="上线前固定的协议字段" min-width="68rem">

| 项目 | 必须记录的内容 | 常见错误 |
|:--|:--|:--|
| 依赖 | GMKit 版本、语言制品、运行环境基线 | 开发和生产解析到不同版本 |
| 编码 | UTF-8、Hex 或 Base64；字节长度单位 | 把 Hex 字符数当成字节数 |
| SM2 | user ID、签名 raw/DER、密文 C1C3C2/C1C2C3 | 验签端遗漏或改写 user ID |
| SM4 AEAD | mode、nonce、AAD、tag 长度及字段编码 | 只保存 ciphertext，或在同一 key 下复用 nonce |
| 版本 | 载荷 schema 与升级兼容策略 | 让接收方长期猜测字段格式 |

</ApiTable>

## 完成后继续

- [TypeScript 使用手册](/manual/typescript/) 或 [Java 使用手册](/manual/java/)：按业务任务完成可运行接入。
- [算法选择与协议设计](/guide/about-guomi.html)：确定算法、模式和跨端字段。
- [安全边界](/guide/security.html)：检查密钥、nonce、认证和运行环境。
- [常见问题与故障排查](/guide/troubleshooting.html)：排查安装、编码、验签和 AEAD 错误。
- [共享互操作向量](/standards/interop-vectors.html)：用确定性结果核对跨语言字段。
- [公共输入约定](/api/common.html)：统一 Hex、Base64、UTF-8、随机源和异常语义。
