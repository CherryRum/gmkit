<div align="center">


# GMKitX
**国密算法与国际标准的全场景 TypeScript 解决方案**

[![NPM Version](https://img.shields.io/npm/v/gmkitx?style=flat-square&color=3b82f6&label=npm)](https://www.npmjs.com/package/gmkitx)
[![License](https://img.shields.io/badge/license-Apache--2.0-green?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/written%20in-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)

[特性概览](#核心特性) • [安装指南](#安装与环境) • [快速上手](#快速上手) • [API 参考](#api-深度指南)


---

`gmkitx` 是一套纯 **TypeScript** 实现的密码学工具集，覆盖 **SM2 / SM3 / SM4 / ZUC** 等国密标准，并提供 **SHA** 系列国际摘要算法。
目标是提供一套**同构**（Isomorphic）的代码库，让开发者在 **Node.js** 与**现代浏览器**中使用一致的 API 进行加密、解密、签名与哈希运算。
</div>

## 核心特性

我们强调**一致性**与**可维护性**并重：

* **同构运行**：一套代码无缝运行于 **Node.js (>= 18)** 与浏览器环境，无需 polyfill。
* **双重范式**：既支持 **函数式（Functional）** 调用，也保留 **面向对象（OOP）** 封装。
* **互操作友好**：支持常见密文格式与编码（Hex/Base64、C1C3C2/C1C2C3、ASN.1 DER）。
* **按需加载**：Tree-shaking 友好，可按算法模块引入。
* **类型完整**：内建 `.d.ts` 类型定义，编码即文档。

---

## 安装与环境

**环境要求**：Node.js **>= 18** 或任意支持 ES6+ 的现代浏览器。

```bash
# npm
npm install gmkitx

# pnpm (推荐)
pnpm add gmkitx

# yarn
yarn add gmkitx
````

-----

## 快速上手

### 风格一：函数式编程（推荐）

适合现代前端开发，利于 Tree-shaking，代码更简洁。

#### 1) SM2 非对称加密 + 签名

```ts
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

```ts
import { digest, hmac, OutputFormat } from 'gmkitx';

const hexHash = digest('订单摘要'); // 默认 Hex
const base64Hash = digest('订单摘要', { outputFormat: OutputFormat.BASE64 });
const mac = hmac('sm3-secret', '订单摘要');
```

#### 3) SM4 对称加密（CBC 示例）

```ts
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

### 风格二：命名空间导入

结构清晰，适合大型项目统一管理加密模块。

```ts
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

### 风格三：浏览器脚本 (CDN)

通过 UMD 构建包，在 HTML 中直接使用全局变量 `GMKit`。

```html
<script src="https://unpkg.com/gmkitx@latest/dist/index.global.js"></script>
<script>
  const { digest, sm4Encrypt } = GMKit;
  
  console.log('SM3 Hash:', digest('Browser Test'));
</script>
```

-----

## 0.9.4 修订提示（安全与文档对齐）

- `sm4Encrypt` 现在返回 `{ ciphertext, tag?, format }` 对象；`sm4Decrypt` 可直接接收该对象。
- `zucKeystream(key, iv, length)` 的 `length` 改为 **字节数**；若需要按 32-bit word，使用 `zucKeystreamWords`。
- `sm2Encrypt` 的模式参数改为选项对象：`sm2Encrypt(pub, data, { mode })`。
- `sign / verify / signatureToXml` 支持 `signatureFormat: 'raw' | 'der' | 'auto'`；DER 输入请显式标注。
- Base64 密文解密支持自动识别；跨语言互操作时建议显式指定 `inputFormat: InputFormat.BASE64`（SM2 / SM4 / ZUC）。
- 安全修复：SM2 现在会拒绝非法 `mode` / `signatureFormat`；SM4 现在会拒绝奇数长度的 hex key/iv，并严格校验 GCM 标签长度。

-----

## API 深度指南

### SM2（椭圆曲线公钥密码）
- 加/解密、签名/验签、密钥对生成；默认 `C1C3C2`，可切换 `C1C2C3`。
- Node/浏览器同构，面向对象与函数式并行。

```ts
import { SM2, SM2CipherMode, InputFormat, OutputFormat } from 'gmkitx';

const sm2 = SM2.fromPrivateKey(privateKey);
const signature = sm2.sign('核心指令');
const verified = sm2.verify('核心指令', signature);

const cipher = sm2.encrypt('数据', { mode: SM2CipherMode.C1C3C2 });
const plain = sm2.decrypt(cipher);

// DER + Base64 签名示例
const sigDer = sm2.sign('核心指令', { signatureFormat: 'der', outputFormat: OutputFormat.BASE64 });
const ok = sm2.verify('核心指令', sigDer, { signatureFormat: 'der', inputFormat: InputFormat.BASE64 });
```

### SM3（消息摘要）
- 流式更新，Hex/Base64 输出；与 SHA API 对齐。

```ts
import { SM3, OutputFormat } from 'gmkitx';

const sm3 = new SM3();
sm3.update('part-1');
sm3.update('part-2');

const hex = sm3.digest(); // 默认 Hex
const base64 = sm3.digest({ outputFormat: OutputFormat.BASE64 });
```

### SM4（分组密码）
- 支持 `ECB` | `CBC` | `CTR` | `CFB` | `OFB` | `GCM` | `CCM`，PKCS7/NoPadding 可选。

```ts
import { SM4, sm4Encrypt, sm4Decrypt, CipherMode, PaddingMode } from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210';
const sm4 = new SM4(key, { mode: CipherMode.GCM, padding: PaddingMode.NONE, iv: '00112233445566778899aabb' });

const result = sm4.encrypt('敏感信息');
const decrypted = sm4.decrypt(result);

// CCM（AEAD）示例：7-13 字节 nonce，支持 AAD
const ccm = sm4Encrypt(key, '敏感信息', { mode: CipherMode.CCM, iv: '00112233445566778899aabb', aad: 'meta', tagLength: 16 });
const ccmPlain = sm4Decrypt(key, ccm, { mode: CipherMode.CCM, iv: '00112233445566778899aabb', aad: 'meta' });
```

### ZUC（祖冲之序列密码）
- 覆盖 128-EEA3（机密性）与 128-EIA3（完整性）；流式密钥流可复用。

```ts
import { zucEncrypt, zucKeystream, zucKeystreamWords } from 'gmkitx';

const cipher = zucEncrypt(key, iv, 'Hello ZUC');
const keystream = zucKeystream(key, iv, 32); // 32 bytes keystream
const wordStream = zucKeystreamWords(key, iv, 8); // 8 words
```

### SHA（国际标准摘要）
- SHA1/256/384/512 系列，API 与 SM3 一致，便于混合使用。

```ts
import { sha } from 'gmkitx';

const hash = sha.sha256('Hello World');
```

## 算法选择与安全边界

- 没有“又快又安全又通用”的单一加密方案，算法选择必须按场景做权衡。
- 业务数据加密优先 `SM4-GCM` 或 `SM4-CCM`；`CBC/CTR/CFB/OFB` 仅提供机密性，不提供完整性认证，需额外 MAC。
- `SM2` 适合密钥封装、签名验签，不适合直接加密大数据（建议 `SM2 + SM4` 混合加密）。
- `ZUC` 更偏通信协议场景（如 EEA3/EIA3），通用业务通常优先 SM4。
- `SHA-1` 仅用于兼容旧系统，不建议用于新系统安全场景。

### Java 对接提示（重点）

- Java `PKCS5Padding` 在 SM4（16 字节分组）场景下语义上对应前端/Node 的 `PKCS7`。
- Java/BouncyCastle 若使用 `SM4/CCM/NoPadding`，前端/Node 对应 `mode: CipherMode.CCM`；需显式对齐 nonce（7-13 字节）和 tag 长度。
- SM2 签名格式要显式约定：Java 常见 DER，gmkitx 默认 raw。
- Base64 密文解密支持自动识别；与 Java 等异构系统对接时建议显式传 `inputFormat: InputFormat.BASE64`（SM2 / SM4 / ZUC）。
- 完整公开 API 清单与 Java 端实现映射见 [`docs/dev/API-SURFACE.zh-CN.md`](./docs/dev/API-SURFACE.zh-CN.md)。

## 编码与格式

`InputFormat` / `OutputFormat` 统一规范密文与签名的编码格式。

```ts
import { InputFormat, OutputFormat, sm2Encrypt, sm2Decrypt, sm4Encrypt, sm4Decrypt, CipherMode, PaddingMode } from 'gmkitx';

const sm2Cipher = sm2Encrypt(pubKey, 'hello', { outputFormat: OutputFormat.BASE64 });
const sm2Plain = sm2Decrypt(privKey, sm2Cipher, { inputFormat: InputFormat.BASE64 });

const sm4Result = sm4Encrypt(key, 'hello', { mode: CipherMode.ECB, padding: PaddingMode.PKCS7, outputFormat: OutputFormat.BASE64 });
const sm4Plain = sm4Decrypt(key, sm4Result, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 }); // 自动读取 result.format
```

## 小程序/受限环境提示

- 若运行环境缺少 `TextEncoder/TextDecoder`，可使用 `setTextCodec` 注入自定义 UTF-8 编解码器。
- 若运行环境缺少安全随机数，请使用 `setCustomRNG` 提供合规的随机源。
- 可通过 `getEnvReport()` 检查环境能力。

-----

## 工具箱 (Utils)

`gmkitx` 暴露了底层的数据处理函数，方便处理编码转换与 ASN.1 结构。

| 分类     | 函数                               | 说明               |
|:-------|:---------------------------------|:-----------------|
| **编码** | `hexToBytes`, `bytesToHex`       | Hex 字符串与字节数组互转   |
| **编码** | `base64ToBytes`, `bytesToBase64` | Base64 与字节数组互转   |
| **编码** | `stringToBytes`, `bytesToString` | UTF-8 字符串处理      |
| **编码** | `decodeInput`, `encodeOutput`    | 输入/输出格式统一编解码     |
| **运算** | `xor`, `rotl`                    | 异或与循环左移          |
| **格式** | `rawToDer`, `derToRaw`           | 签名的 RAW/DER 格式转换 |
| **随机** | `getRandomBytes`, `configureRNG`, `setCustomRNG` | 随机源与策略控制 |
| **环境** | `setTextCodec`, `getEnvReport`   | 文本编解码与环境能力报告     |

-----

## 工程审计命令

```bash
# 构建（含告警策略）
npm run build

# 发布包体积审计（npm pack dry-run）
npm run audit:pack

# 文档静态资源体积审计
npm run audit:docs:assets
```

-----
