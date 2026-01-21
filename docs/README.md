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
  - title: 全栈覆盖
    icon: laptop-code
    details: 同构 API，Node.js (>= 18) 与现代浏览器一致可用
  - title: 双重范式
    icon: code
    details: 函数式 / OOP 双轨 API，友好按需加载与 Tree-shaking
  - title: 标准对齐
    icon: check
    details: 对齐 GM/T 标准，兼容 OpenSSL 等主流实现的密文格式
  - title: 性能优化
    icon: rocket
    details: 纯 TypeScript、轻依赖（@noble/*），适合生产环境

copyright: false
---

## 核心特性

`gmkitx` 是一套纯 **TypeScript** 实现的密码学工具集。它实现了 **SM2 / SM3 / SM4 / ZUC** 等国密标准，同时集成了 **SHA** 系列国际算法。

设计目标是提供一套**同构**（Isomorphic）的代码库，让开发者在**服务端**和**现代浏览器**前端，都能使用完全一致的 API 进行加密、解密、签名与哈希运算。

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

#### 1) SM2 非对称加密 + 签名

```typescript
import {
  generateKeyPair,
  sm2Encrypt,
  sm2Decrypt,
  sign,
  verify,
  SM2CipherMode,
  InputFormat,
  OutputFormat,
} from 'gmkitx';

const { publicKey, privateKey } = generateKeyPair();
const message = '订单明文';

// 加密 / 解密（显式指定密文模式，便于互操作）
const cipherText = sm2Encrypt(publicKey, message, {
  mode: SM2CipherMode.C1C3C2,
  outputFormat: OutputFormat.BASE64,
});
const plainText = sm2Decrypt(privateKey, cipherText, {
  mode: SM2CipherMode.C1C3C2,
  inputFormat: InputFormat.BASE64,
});

// 签名 / 验签
const signature = sign(privateKey, message);
const ok = verify(publicKey, message, signature);
```

#### 2) SM3 摘要 + HMAC

```typescript
import { digest, hmac, OutputFormat } from 'gmkitx';

const hexHash = digest('订单摘要'); // 默认 Hex
const base64Hash = digest('订单摘要', { outputFormat: OutputFormat.BASE64 });
const mac = hmac('sm3-secret', '订单摘要');
```

#### 3) SM4 对称加密（CBC 示例）

```typescript
import { sm4Encrypt, sm4Decrypt, CipherMode, PaddingMode, OutputFormat } from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210'; // 128 位密钥（Hex）
const iv = 'fedcba98765432100123456789abcdef';  // 128 位 IV（Hex）

const sm4Payload = sm4Encrypt(key, '敏感数据', {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv,
  outputFormat: OutputFormat.BASE64,
});
const plaintext = sm4Decrypt(key, sm4Payload, {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv,
});
```

### 命名空间导入

结构清晰，适合大型项目统一管理加密模块。

```typescript
import { sm2, sm3, sm4, sha, CipherMode, PaddingMode, SM2CipherMode } from 'gmkitx';

const { publicKey, privateKey } = sm2.generateKeyPair();
const key = '0123456789abcdeffedcba9876543210';
const iv = 'fedcba98765432100123456789abcdef';

// SM2
const cipher = sm2.encrypt(publicKey, '订单数据', { mode: SM2CipherMode.C1C3C2 });
const plain = sm2.decrypt(privateKey, cipher, { mode: SM2CipherMode.C1C3C2 });
const signature = sm2.sign(privateKey, '订单数据');
const verified = sm2.verify(publicKey, '订单数据', signature);

// SM3
const hash = sm3.digest('订单摘要');

// SM4
const sm4Result = sm4.encrypt(key, '敏感数据', {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv,
});
const sm4Plain = sm4.decrypt(key, sm4Result, {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv,
});

// SHA 国际标准
const sha512Hash = sha.sha512('Hello World');
```

## 支持的算法

### 国密算法

- **SM2** - 椭圆曲线公钥密码算法（加密、解密、签名、验签）
- **SM3** - 密码杂凑算法（哈希）
- **SM4** - 分组密码算法（对称加密，支持多种模式）
- **ZUC** - 祖冲之序列密码算法（流加密）

### 国际标准算法

- **SHA** - SHA-1, SHA-256, SHA-384, SHA-512 系列哈希算法

## 开始探索

- [快速开始指南](/guide/getting-started) - 了解如何使用 GMKitX
- [关于国密算法](/guide/about-guomi) - 信创化、特殊领域应用与性能差异详解
- [SM2 算法文档](/algorithms/SM2) - 椭圆曲线公钥密码
- [SM3 算法文档](/algorithms/SM3) - 密码杂凑算法
- [SM4 算法文档](/algorithms/SM4) - 分组密码算法
- [语言集成指南](/dev/JAVA-INTEGRATION.zh-CN) - Java、Go、Rust、Python 对接方案
- [性能测试](/performance/PERFORMANCE) - 查看性能基准测试结果
