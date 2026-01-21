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

##  安装

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

##  第一个例子

让我们先从 SM2 加解密与签名开始：

```typescript
import { generateKeyPair, sm2Encrypt, sm2Decrypt, sign, verify, SM2CipherMode } from 'gmkitx';

const { publicKey, privateKey } = generateKeyPair();
const message = 'Hello, GMKitX!';

const cipher = sm2Encrypt(publicKey, message, { mode: SM2CipherMode.C1C3C2 });
const plain = sm2Decrypt(privateKey, cipher, { mode: SM2CipherMode.C1C3C2 });

const signature = sign(privateKey, message);
const ok = verify(publicKey, message, signature);
```

##  导入方式

根据场景选择即可：按需导入（最优 Tree-shaking）、类实例化（面向对象），或浏览器直引。

### 按需导入（函数或命名空间，推荐）

```typescript
// 函数级别：仅打包所需 API
import { generateKeyPair, sm2Encrypt, sm2Decrypt, digest, sm4Encrypt, sm4Decrypt, CipherMode, PaddingMode } from 'gmkitx';

const { publicKey, privateKey } = generateKeyPair();
const cipher = sm2Encrypt(publicKey, '订单数据');
const plain = sm2Decrypt(privateKey, cipher);

const hash = digest('订单摘要');

const key = '0123456789abcdeffedcba9876543210';
const iv = 'fedcba98765432100123456789abcdef';
const sm4Payload = sm4Encrypt(key, '敏感数据', { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
const sm4Plain = sm4Decrypt(key, sm4Payload, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
```

```typescript
// 命名空间：结构清晰，便于批量使用
import { sm2, sm3, sm4, zuc, sha } from 'gmkitx';
const digestHex = sm3.digest('订单摘要');
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

##  常见使用场景

### 场景 1：非对称加密（SM2）

```typescript
import { generateKeyPair, sm2Encrypt, sm2Decrypt, SM2CipherMode, InputFormat, OutputFormat } from 'gmkitx';

const { publicKey, privateKey } = generateKeyPair();

const cipher = sm2Encrypt(publicKey, '业务载荷', {
  mode: SM2CipherMode.C1C3C2,
  outputFormat: OutputFormat.BASE64,
});
const plain = sm2Decrypt(privateKey, cipher, {
  mode: SM2CipherMode.C1C3C2,
  inputFormat: InputFormat.BASE64,
});
```

### 场景 2：数字签名（SM2）

```typescript
import { generateKeyPair, sign, verify, InputFormat, OutputFormat } from 'gmkitx';

const { publicKey, privateKey } = generateKeyPair();
const message = '重要文件内容';

const signature = sign(privateKey, message, {
  outputFormat: OutputFormat.BASE64,
});
const isValid = verify(publicKey, message, signature, {
  inputFormat: InputFormat.BASE64,
});
```

### 场景 3：数据哈希（SM3）

```typescript
import { digest, OutputFormat } from 'gmkitx';

const hexHash = digest('订单摘要'); // 默认输出 Hex
const base64Hash = digest('订单摘要', { outputFormat: OutputFormat.BASE64 });

// 如需字节数组可自行转换（Node.js 示例）
const bytesHash = Buffer.from(hexHash, 'hex');
```

### 场景 4：对称加密（SM4）

密钥与 IV 均为 32 字符十六进制字符串（128 位）；不要混用 UTF-8 文本。

```typescript
import { sm4Encrypt, sm4Decrypt, CipherMode, PaddingMode } from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210'; // 32 字符 hex (128 位)
const iv = 'fedcba98765432100123456789abcdef';  // 32 字符 hex (128 位)

// 加密
const sm4Result = sm4Encrypt(key, '敏感数据', {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv,
});

// 解密
const plaintext = sm4Decrypt(key, sm4Result, {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  iv,
});

console.log(plaintext); // '敏感数据'
```

##  下一步

- 查看 [SM2 完整文档](/algorithms/SM2) 了解椭圆曲线公钥密码
- 查看 [SM3 完整文档](/algorithms/SM3) 了解密码杂凑算法
- 查看 [SM4 完整文档](/algorithms/SM4) 了解分组密码算法
- 查看 [开发指南](/dev/ARCHITECTURE.zh-CN) 了解架构设计

##  提示

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
