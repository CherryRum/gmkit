---
title: TypeScript API 说明书
description: 按公共工具、SM2、SM3、SM4、ZUC 和 SHA 查阅 gmkitx 全部根导出。
icon: code
category:
  - API 说明书
  - TypeScript
tag:
  - TypeScript
  - gmkitx
  - API
---

# TypeScript API 说明书

`gmkitx` 是从一个根入口发布的 TypeScript/JavaScript 密码工具包。本说明书解释怎样选择公开入口、字符串和字节如何转换、默认值是什么，以及失败时会返回 `false` 还是抛出异常。

## 安装与运行环境

```bash
npm install gmkitx
```

发布包同时提供 ESM、CommonJS 和浏览器 IIFE：

| 环境 | 入口 | 说明 |
|:--|:--|:--|
| ESM/TypeScript | `import { sm3Digest } from 'gmkitx'` | 推荐；支持静态分析和 tree-shaking |
| CommonJS | `const { sm3Digest } = require('gmkitx')` | Node.js 兼容入口 |
| 浏览器脚本 | `GMKit.sm3Digest('abc')` | 使用发布包的 `dist/index.global.js` |
| 类型声明 | `dist/index.d.ts` | 由 package `types`/`exports` 自动选择 |

包声明 Node.js 18 或更高版本。浏览器、小程序和受限 JavaScript 宿主还应检查 UTF-8 编解码器与安全随机源；详见 [运行环境与 RNG](/api/typescript/common.html#随机源与运行环境)。

## 四种调用方式

### 具名函数：新代码首选

```ts
import {
  CipherMode,
  sm2GenerateKeyPair,
  sm2Encrypt,
  sm3Digest,
  sm4Encrypt,
} from 'gmkitx';

const keys = sm2GenerateKeyPair();
const ciphertext = sm2Encrypt(keys.publicKey, 'hello');
const digest = sm3Digest('hello');
const result = sm4Encrypt('0123456789abcdeffedcba9876543210', 'hello', {
  mode: CipherMode.GCM,
  iv: '000102030405060708090a0b',
});
```

带算法前缀的名称能在代码评审和日志中直接体现算法归属。

### 算法命名空间

`sm2`、`sm3`、`sm4`、`zuc`、`sha` 聚合各算法函数和对应类，适合统一注入：

```ts
import { sm2, sm3 } from 'gmkitx';

const keys = sm2.generateKeyPair();
const digest = sm3.digest('abc');
```

### 类

`SM2`、`SM3`、`SM4`、`ZUC`、`SHA1`、`SHA256`、`SHA384`、`SHA512` 适合保存密钥、配置或增量摘要状态。类是否有状态、`digest()` 后是否重置，以各算法页面为准。

### 默认导出

默认导出为 UMD/CDN 和旧整体导入保留，包含五个算法命名空间、推荐顶层算法函数和弃用别名，不包含编码、RNG、ASN.1 工具：

```ts
import GMKit from 'gmkitx';

const digest = GMKit.sm3Digest('abc');
```

新的模块化代码优先使用具名导出。

## API 导航

| 页面 | 公开能力 |
|:--|:--|
| [公共类型与工具](/api/typescript/common.html) | 编码、格式常量、RNG、环境、字节运算、ASN.1、默认导出和兼容别名 |
| [SM2](/api/typescript/sm2.html) | 密钥、加解密、签名验签、密钥交换、`SM2` 类 |
| [SM3](/api/typescript/sm3.html) | 摘要、HMAC、增量 `SM3` |
| [SM4](/api/typescript/sm4.html) | ECB/CBC/CTR/CFB/OFB/GCM/CCM、`SM4` 类 |
| [ZUC](/api/typescript/zuc.html) | ZUC-128、密钥流、EEA3/EIA3、`ZUCState` |
| [SHA](/api/typescript/sha.html) | SHA-1/256/384/512、HMAC、增量类 |

## 输入、返回和错误总则

- `string` 消息按 UTF-8 编码；Hex 字符串只有在密钥、IV、密文等明确字段中才按 Hex 解释。
- `Uint8Array` 表示原始字节。二进制解密使用 `sm2DecryptBytes`、`sm4DecryptBytes` 或 `zucDecryptBytes`。
- 输出编码省略时通常为小写 Hex；每个选项页会明确列出例外。
- 验签不通过返回 `false`；非法格式、密钥、长度、AEAD tag 或运行环境错误会抛出 `Error`。
- 自动识别优先把形态合法的偶数长度字符串当作 Hex。稳定协议应显式传 `InputFormat`。
- 公开边界只有包根入口和 `gmkitx/package.json`；`src/*`、`dist/*` 深度导入不受兼容承诺保护。

## 已发布版本签名

需要核对历史制品的逐成员类型时，从 [已发布版本签名索引](/api/#已发布版本签名索引) 选择与 npm 制品相同的版本。当前页面及各算法页负责解释用途、约束和错误处理。
