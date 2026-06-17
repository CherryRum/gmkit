---
home: true
icon: home
title: GMKitX
heroImage: /logo.svg
heroText: GMKitX
actions:
  - text: 快速开始
    link: /guide/getting-started
    type: primary
  - text: 算法文档
    link: /algorithms/SM2
    type: secondary

features:
  - title: 同构运行
    icon: laptop-code
    details: 同构 API，Node.js (>= 18) 与现代浏览器一致可用
  - title: 双端实现
    icon: code
    details: 同源 Java 实现 cn.gmkit:gmkit，与前端共享互操作向量和协议边界
  - title: 双重范式
    icon: code
    details: 函数式 / OOP 双轨 API，友好按需加载与 Tree-shaking
  - title: 标准对齐
    icon: check
    details: 明确列出 SM2、SM4、ZUC 的格式参数与互操作边界
  - title: 运行时依赖
    icon: rocket
    details: 纯 TypeScript，运行时依赖 @noble/curves 与 @noble/hashes

copyright: false
---

## 核心特性

`gmkitx` 是一套纯 **TypeScript** 实现的密码学工具集。它实现了 **SM2 / SM3 / SM4 / ZUC** 等国密算法，同时集成了 **SHA** 系列国际算法。当前 TypeScript 包不支持 SM9，也不包装 C、WASM 或 native runtime。

设计目标是提供一套**同构**（Isomorphic）的代码库，让开发者在**服务端**和**现代浏览器**前端，都能使用一致的 API 进行加密、解密、签名与哈希运算。

如果项目同时有 Java 后端，可以直接引入同源实现 [`cn.gmkit:gmkit`](/dev/JAVA-LIBRARY.zh-CN)，
两边共享互操作向量和协议边界，密文 / 签名 / MAC 按约定格式互通。

## 快速安装

:::code-tabs#shell

@tab npm

```bash
npm install gmkitx
```

@tab pnpm

```bash
pnpm add gmkitx
```

@tab yarn

```bash
yarn add gmkitx
```

:::

## 快速示例

### 函数式编程（推荐）

适合现代前端开发，利于 Tree-shaking，代码更简洁。

```typescript
import {
  sm3Digest,    // SM3
  sm4Encrypt,   // SM4
  sm4Decrypt,
  sm2Encrypt,   // SM2
  sm2Decrypt,
  sm2GenerateKeyPair,
  CipherMode,
  PaddingMode
} from 'gmkitx';

// 1. SM3 摘要
const hash = sm3Digest('Hello, SM3!');

// 2. SM4 对称加密 (CBC模式)
const key = '0123456789abcdeffedcba9876543210'; // 128位密钥
const iv  = 'fedcba98765432100123456789abcdef'; // 初始化向量

const sm4Result = sm4Encrypt(key, '我的机密数据', {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv,
});
const plaintext = sm4Decrypt(key, sm4Result, {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv,
});

// 3. SM2 非对称加密
const { publicKey, privateKey } = sm2GenerateKeyPair();
const encData = sm2Encrypt(publicKey, 'Hello, SM2!');
const decData = sm2Decrypt(privateKey, encData);
```

### 命名空间导入

结构清晰，适合大型项目统一管理加密模块。

```typescript
import { sm2, sm3, sm4, sha } from 'gmkitx';

// 统一入口调用
const hash = sm3.digest('Hello');
const sig  = sm2.sign(privateKey, 'Message');
const verified = sm2.verify(publicKey, 'Message', sig);

// SHA 国际标准
const sha512Hash = sha.sha512('Hello World');
```

## 支持的算法

### 国密算法

- **SM2** - 椭圆曲线公钥密码算法（加密、解密、签名、验签）
- **SM3** - 密码杂凑算法（哈希）
- **SM4** - 分组密码算法（对称加密，支持多种模式）
- **ZUC** - 祖冲之序列密码算法（ZUC-128 流加密、EEA3/EIA3 兼容接口）

| 算法 | 当前支持 | 主要边界 |
|:--|:--|:--|
| SM2 | `C1C3C2` / `C1C2C3`，raw/DER 签名，压缩/非压缩公钥输入 | 加密输出 C1 为非压缩点；随机密文不固定完整向量 |
| SM3 | 摘要、HMAC、流式更新 | 仅提供摘要/MAC 组件 |
| SM4 | ECB/CBC/CTR/CFB/OFB/GCM/CCM | GCM/CCM 必须保存并校验 tag；IV/nonce 长度需显式对齐 |
| ZUC | ZUC-128 密钥流、加解密、EEA3/EIA3 兼容接口 | 不支持 ZUC-256；加密不自带完整性保护 |
| SM9 | 不支持 | Java 侧 `gmkit-sm9` 通过 JNI/GmSSL 提供，TS 侧无实现 |

### 国际标准算法

- **SHA** - SHA-1, SHA-224, SHA-256, SHA-384, SHA-512 系列哈希算法

## 开始探索

- [快速开始指南](/guide/getting-started) - 了解如何使用 GMKitX
- [关于国密算法](/guide/about-guomi) - 信创化、特殊领域应用与性能差异详解
- [SM2 算法文档](/algorithms/SM2) - 椭圆曲线公钥密码
- [SM3 算法文档](/algorithms/SM3) - 密码杂凑算法
- [SM4 算法文档](/algorithms/SM4) - 分组密码算法
- [公开 API 清单](/dev/API-SURFACE.zh-CN) - 当前全部导出、命名空间与 Java 端映射
- [GMKit Java 实现](/dev/JAVA-LIBRARY.zh-CN) - JVM 端 `cn.gmkit:gmkit` 与 SM9 独立模块的接入与示例
- [语言集成指南](/dev/JAVA-INTEGRATION.zh-CN) - Java、Go、Rust、Python 对接方案
- [项目精简清单](/dev/PROJECT-SLIMMING-CHECKLIST.zh-CN) - 文档资产、构建告警、发布包体审计
- [性能测试](/performance/PERFORMANCE) - 查看性能基准测试结果

