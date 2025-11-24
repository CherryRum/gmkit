---
title: 快速开始
icon: rocket
order: 1
author: mumu
date: 2025-11-23
category:
  - 指南
tag:
  - 快速开始
  - 安装
  - 使用
---

# 快速开始

欢迎使用 **GMKitX**！本指南将帮助您快速上手国密算法与国际标准的 TypeScript 实现。

## 📦 安装

### 环境要求

- **Node.js** >= 18.0.0
- 或任意支持 ES6+ 的现代浏览器

### 使用包管理器安装

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

## 🚀 第一个例子

让我们从最简单的 SM3 哈希算法开始：

```typescript
import { digest } from 'gmkitx';

const hash = digest('Hello, GMKitX!');
console.log(hash);
// 输出 16 进制哈希值
```

## 📖 导入方式

根据场景选择即可：按需导入（最优 Tree-shaking）、类实例化（面向对象），或浏览器直引。

### 按需导入（函数或命名空间，推荐）

```typescript
// 函数级别：仅打包所需 API
import { digest, sm4Encrypt, sm4Decrypt, generateKeyPair } from 'gmkitx';

// 命名空间：结构清晰，便于批量使用
import { sm2, sm3, sm4, zuc, sha } from 'gmkitx';
const hash = sm3.digest('订单摘要');
const keypair = sm2.generateKeyPair();
```

### 类实例化

适合需要持久上下文（流式更新、重复加解密）的场景。

```typescript
import { SM2, SM3, SM4 } from 'gmkitx';

const sm3Instance = new SM3();
sm3Instance.update('订单摘要');
sm3Instance.update('附件摘要');
const hash = sm3Instance.digest(); // 默认 Hex
```

### 浏览器直引（CDN）

无需构建工具，脚本直接可用。

```html
<script src="https://unpkg.com/gmkitx@latest/dist/index.global.js"></script>
<script>
  const { digest, sm4Encrypt } = GMKit;
  console.log('SM3 Hash:', digest('Browser Test'));
</script>
```

## 🎯 常见使用场景

### 场景 1：数据哈希（SM3）

```typescript
import { digest, OutputFormat } from 'gmkitx';

// 默认输出 16 进制
const hexHash = digest('订单摘要');

// 输出 Base64
const base64Hash = digest('订单摘要', {
  format: OutputFormat.BASE64
});

// 输出字节数组
const bytesHash = digest('订单摘要', {
  format: OutputFormat.BYTES
});
```

### 场景 2：对称加密（SM4）

密钥与 IV 均为 32 字符十六进制字符串（128 位）；不要混用 UTF-8 文本。

```typescript
import { sm4Encrypt, sm4Decrypt, CipherMode, PaddingMode } from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210'; // 32 字符 hex (128 位)
const iv = 'fedcba98765432100123456789abcdef';  // 32 字符 hex (128 位)

// 加密
const ciphertext = sm4Encrypt(key, '敏感数据', {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv,
});

// 解密
const plaintext = sm4Decrypt(key, ciphertext, {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv,
});

console.log(plaintext); // '敏感数据'
```

### 场景 3：非对称加密（SM2）

```typescript
import { generateKeyPair, sm2Encrypt, sm2Decrypt } from 'gmkitx';

// 生成密钥对
const { publicKey, privateKey } = generateKeyPair();

// 加密
const encrypted = sm2Encrypt(publicKey, 'Hello, SM2!');

// 解密
const decrypted = sm2Decrypt(privateKey, encrypted);

console.log(decrypted); // 'Hello, SM2!'
```

### 场景 4：数字签名（SM2）

```typescript
import { generateKeyPair, sm2Sign, sm2Verify } from 'gmkitx';

const { publicKey, privateKey } = generateKeyPair();
const message = '重要文件内容';

// 签名
const signature = sm2Sign(privateKey, message);

// 验签
const isValid = sm2Verify(publicKey, message, signature);

console.log('签名验证:', isValid); // true
```

## 🔗 下一步

- 查看 [SM2 完整文档](/algorithms/SM2) 了解椭圆曲线公钥密码
- 查看 [SM3 完整文档](/algorithms/SM3) 了解密码杂凑算法
- 查看 [SM4 完整文档](/algorithms/SM4) 了解分组密码算法
- 查看 [开发指南](/dev/ARCHITECTURE.zh-CN) 了解架构设计

## 💡 提示

::: tip 性能优化
- 对于大文件哈希，使用流式 API（`SM3` 类的 `update` 方法）
- SM4 推荐使用 GCM 模式，提供认证加密
- 生产环境建议使用 CDN 加速
:::

::: warning 安全注意
- 密钥必须使用安全的随机数生成
- 不要在代码中硬编码密钥
- IV（初始化向量）不应重复使用
:::
