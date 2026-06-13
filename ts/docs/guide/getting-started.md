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

::: tip
提示：本章要点

- 安装
- 第一个例子
- 导入方式
- 常见使用场景
- 安全注意与常见攻击（通俗版）
:::


欢迎使用 **GMKitX**！本指南将帮助您快速上手国密算法与国际标准的 TypeScript 实现。

## 安装

### 环境要求

- **Node.js** >= 18.0.0
- 或任意支持 ES6+ 的现代浏览器

### 使用包管理器安装

::: code-tabs#shell

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

## 第一个例子

让我们先从 SM2 加解密与签名开始：

```typescript
import { sm2GenerateKeyPair, sm2Encrypt, sm2Decrypt, sm2Sign, sm2Verify, SM2CipherMode } from 'gmkitx';

const { publicKey, privateKey } = sm2GenerateKeyPair();
const message = 'Hello, GMKitX!';

const cipher = sm2Encrypt(publicKey, message, { mode: SM2CipherMode.C1C3C2 });
const plain = sm2Decrypt(privateKey, cipher, { mode: SM2CipherMode.C1C3C2 });

const signature = sm2Sign(privateKey, message);
const ok = sm2Verify(publicKey, message, signature);
```

## 导入方式

根据场景选择即可：按需导入（最优 Tree-shaking）、类实例化（面向对象），或浏览器直引。

### 按需导入（函数或命名空间，推荐）

```typescript
// 函数级别：仅打包所需 API
import { sm2GenerateKeyPair, sm2Encrypt, sm2Decrypt, sm3Digest, sm4Encrypt, sm4Decrypt, CipherMode, PaddingMode } from 'gmkitx';

const { publicKey, privateKey } = sm2GenerateKeyPair();
const cipher = sm2Encrypt(publicKey, '订单数据');
const plain = sm2Decrypt(privateKey, cipher);

const hash = sm3Digest('订单摘要');

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
  const { sm3Digest, sm4Encrypt } = GMKit;
  console.log('SM3 Hash:', sm3Digest('Browser Test'));
</script>
```

## 常见使用场景

### 场景 1：非对称加密（SM2）

```typescript
import { sm2GenerateKeyPair, sm2Encrypt, sm2Decrypt, SM2CipherMode, InputFormat, OutputFormat } from 'gmkitx';

const { publicKey, privateKey } = sm2GenerateKeyPair();

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
import { sm2GenerateKeyPair, sm2Sign, sm2Verify, InputFormat, OutputFormat } from 'gmkitx';

const { publicKey, privateKey } = sm2GenerateKeyPair();
const message = '重要文件内容';

const signature = sm2Sign(privateKey, message, {
  outputFormat: OutputFormat.BASE64,
});
const isValid = sm2Verify(publicKey, message, signature, {
  inputFormat: InputFormat.BASE64,
});
```

### 场景 3：数据哈希（SM3）

```typescript
import { sm3Digest, OutputFormat } from 'gmkitx';

const hexHash = sm3Digest('订单摘要'); // 默认输出 Hex
const base64Hash = sm3Digest('订单摘要', { outputFormat: OutputFormat.BASE64 });

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

## 安全注意与常见攻击（通俗版）

下面是业务里最常见、最容易踩坑的风险点，以及几乎不损耗性能的防护建议。

### 常见攻击/误用

| 项目 | 说明 |
|:--|:--|
| 明文泄露（ECB 模式） | 相同明文块会产生相同密文块，结构会“露馅”。 |
| IV/Nonce 复用 | CBC/CTR/CFB/OFB/GCM 复用 IV 会导致密文可被关联或明文被恢复。 |
| 未认证的加密 | 只“加密”不“认证”，会被篡改（CBC/CTR 等不自带完整性）。 |
| 弱随机数 | SM2/SM4 依赖随机数，低熵会导致私钥/会话密钥可被推断。 |
| 哈希误用 | 把 SM3 当 MAC 使用会受长度扩展攻击。 |
| 编码/格式混用 | Hex/Base64、C1C3C2/C1C2C3、DER/RAW 混用，导致验签/解密失败或被误判。 |
| 签名验签不一致 | userId、签名格式或 skipZComputation 不一致会导致验签失败。 |
| 时间序列/侧信道攻击 | 通过运行时间、错误信息差异推测密钥或内部状态。 |
| Padding Oracle | CBC 模式如果对“填充错误”返回不同错误/耗时，会泄露明文。 |
| 随机数/nonce 复用 | SM2 签名或加密若重复使用随机数，会导致私钥泄露或密文被恢复。 |


### 低性能损耗的防护要点

| 项目 | 说明 |
|:--|:--|
| 优先用 AEAD | SM4-GCM 一步解决“加密 + 认证”，性能开销小，安全收益最大。 |
| IV/Nonce 必须唯一 | 对每条消息生成新 IV（CBC/CTR/CFB/OFB/GCM）；GCM 建议 12 字节 IV。 |
| 不要用 ECB | 除非用于测试或特殊兼容场景；生产环境避免。 |
| 不可信输入先校验 | 密文长度、IV 长度、tag 存在性、格式（Hex/Base64）先校验再解密。 |
| 签名显式约定 | 双方固定 `C1C3C2/C1C2C3`、`signatureFormat`、`userId`，避免互操作问题。 |
| MAC 用 HMAC-SM3 | 不要直接用 SM3 当 MAC；HMAC 对长度扩展免疫，性能损耗很小。 |
| 密钥管理与轮换 | 密钥不要硬编码，及时轮换；测试数据用固定密钥，生产用安全随机源。 |
| 减少侧信道差异 | 尽量保持错误信息与处理路径一致；不要在日志中泄露密钥/中间态。 |
| CBC 注意填充 | 对外不要暴露“填充错误”的细节，统一错误提示。 |


### 常见场景推荐

| 项目 | 说明 |
|:--|:--|
| 传输数据 | SM4-GCM（或 SM4-CBC + HMAC-SM3）。 |
| 签名验签 | SM2 + 统一 userId + 统一签名格式。 |
| 数据摘要 | SM3；需要认证时用 HMAC-SM3。 |


## 下一步

- 查看 [SM2 完整文档](/algorithms/SM2) 了解椭圆曲线公钥密码
- 查看 [SM3 完整文档](/algorithms/SM3) 了解密码杂凑算法
- 查看 [SM4 完整文档](/algorithms/SM4) 了解分组密码算法
- 查看 [开发指南](/dev/ARCHITECTURE.zh-CN) 了解架构设计

## 提示

::: tip
提示：性能优化

- 对于大文件哈希，使用流式 API（`SM3` 类的 `update` 方法）
- SM4 推荐使用 GCM 模式，提供认证加密
- 生产环境建议使用 CDN 加速
:::

::: warning
注意：安全注意

- 密钥必须使用安全的随机数生成
- 不要在代码中硬编码密钥
- IV（初始化向量）不应重复使用
:::
