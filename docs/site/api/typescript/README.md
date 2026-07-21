---
title: TypeScript API 说明书
description: 按公共工具、SM2、SM3、SM4、ZUC 和 SHA 查阅 gmkitx 的 121 个根导出及公开成员。
pageInfo: false
contributors: false
editLink: false
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

`gmkitx` 是面向 TypeScript 和 JavaScript 的密码工具包，当前发布版为 `0.10.1`。本说明书覆盖包根入口的 121 个导出，并继续说明公开类成员、选项字段、默认值、编码、状态变化和失败行为。

先按本页完成安装、导入和环境检查，再进入具体算法页。所有应用代码只从 `gmkitx` 包根导入；不要依赖仓库 `src/*` 或 Node/bundler 的 `dist/*` 深度路径。

::: warning 使用前先确认安全边界
当前发布包尚未完成独立第三方安全审计。固定向量和自动测试用于发现实现偏差，不能替代密码产品认证、协议评审、密钥管理或目标运行环境的安全评估。
:::

## 安装

```bash
npm install gmkitx@0.10.1
```

发布包要求 Node.js 18 或更高版本，同时提供 ESM、CommonJS、浏览器 IIFE 和 TypeScript 声明。项目自身的文档构建 Node 版本不改变发布包的消费边界。

<ApiTable label="gmkitx 发布入口" min-width="68rem">

| 环境 | 导入方式 | 发布文件 | 说明 |
|:--|:--|:--|:--|
| ESM / TypeScript | `import { sm3Digest } from 'gmkitx'` | `dist/index.js` | 新代码首选；包声明 `sideEffects: false` |
| CommonJS | `const { sm3Digest } = require('gmkitx')` | `dist/index.cjs` | Node 兼容入口 |
| 浏览器脚本 | `GMKit.sm3Digest('abc')` | `dist/index.global.js` | 全局对象名固定为 `GMKit` |
| 类型声明 | 自动解析 | `dist/index.d.ts` | `types` 与 `exports.types` 均指向它 |

</ApiTable>

包的公开 `exports` 只有 `gmkitx` 根入口和 `gmkitx/package.json`。IIFE 文件是 `unpkg`/`jsdelivr` 明确声明的浏览器脚本产物；这不表示其他 `dist/*` 文件都属于稳定深度导入 API。

## 30 秒确认安装正确

```ts
import { sm3Digest } from 'gmkitx';

const expected = '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0';
const actual = sm3Digest('abc');
if (actual !== expected) {
  throw new Error(`SM3 vector mismatch: ${actual}`);
}
```

这个固定向量同时检查包入口、UTF-8 文本路径和摘要输出，不涉及随机源。随后按 [TypeScript 快速入门](/guide/typescript.html) 完成随机源、SM2 签名和 SM4-GCM 认证失败测试。

## 五种使用方式

### 1. 具名导出：应用代码首选

```ts
import {
  CipherMode,
  getRandomBytes,
  sm2GenerateKeyPair,
  sm2Sign,
  sm2Verify,
  sm3Digest,
  sm4Decrypt,
  sm4Encrypt,
} from 'gmkitx';
```

带算法前缀的名称在调用点就能看出归属，也利于静态分析和 tree-shaking。类型使用 `import type`，避免把纯类型误当运行时值：

```ts
import type { KeyPair, SM4Options } from 'gmkitx';
```

### 2. 算法命名空间：按模块组织

根入口导出五个算法对象：`sm2`、`sm3`、`sm4`、`zuc`、`sha`。每个对象聚合同算法函数和类，适合依赖注入或按算法分组。

```ts
import { sm2, sm3 } from 'gmkitx';

const keys = sm2.generateKeyPair();
const digest = sm3.digest('abc');
if (digest.length !== 64) throw new Error('SM3 output length mismatch');
```

命名空间中的短名称不是弃用别名。例如 `sm2.sign`、`sm3.digest` 是正常成员；只有包根的无算法前缀 `sign`、`digest` 等旧名称被弃用。

### 3. 类：保存配置或增量状态

```ts
import { SM2, SM3, SM4, SHA256, ZUC } from 'gmkitx';
```

<ApiTable label="TypeScript 类的状态用途" min-width="66rem">

| 类 | 保存什么 | 复用时要注意什么 |
|:--|:--|:--|
| `SM2` | 可选私钥、公钥 | 实例可能持有长期密钥；身份和签名格式仍按每次调用传入 |
| `SM3` | 增量摘要状态、输出格式 | `digest()` 后自动清空消息状态，输出格式保留 |
| `SM4` | key、mode、padding、IV/nonce | 不自动更换 nonce；GCM/CCM/CTR 复用前必须更新 IV |
| `ZUC` | key、IV | 每次运算从同一 key/IV 起点重建；不会自动推进或换 IV |
| `SHA1/256/384/512` | 增量摘要状态、输出格式 | `digest()` 后自动清空消息状态；`SHA1` 只兼容旧协议 |

</ApiTable>

可变类不要跨异步任务共享。具体构造器、setter、reset 和生命周期见对应算法页。

### 4. 包命名空间导入：需要全部根导出时

```ts
import * as gmkit from 'gmkitx';

const digest = gmkit.sm3Digest('abc');
```

这种写法获得整个包模块对象，包括常量、工具、函数、类、五个算法命名空间和 `default` 属性。普通业务按需具名导入更容易审查依赖范围。

### 5. 默认导出：IIFE 和旧整体导入兼容

```ts
import GMKit from 'gmkitx';

const digest = GMKit.sm3Digest('abc');
```

默认对象包含：

- `sm2`、`sm3`、`sm4`、`zuc`、`sha` 五个算法命名空间；
- 带算法前缀的推荐顶层函数；
- `generateKeyPair`、`sign`、`digest` 等弃用兼容名称。

默认对象不直接包含 `hexToBytes`、RNG、环境、ASN.1 等公共工具，也不直接包含根类；类可从对应算法命名空间取得。模块化新代码优先具名导出。

## 浏览器脚本

不经过 bundler 时可加载固定版本的 IIFE：

```html
<script src="https://cdn.jsdelivr.net/npm/gmkitx@0.10.1/dist/index.global.js"></script>
<script>
  const expected = '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0';
  const actual = GMKit.sm3Digest('abc');
  if (actual !== expected) throw new Error('SM3 browser vector mismatch');
</script>
```

生产页面固定完整版本，不使用浮动版本 URL。还应设置合适的 CSP，并按部署流程校验第三方脚本完整性；页面脚本一旦遭到 XSS，JavaScript 中的明文和密钥都可能被读取。

## 运行环境检查

现代 Node 和浏览器通常已有 UTF-8 与 Web Crypto。受限小程序需要在应用启动时检查并注入宿主能力：

```ts
import {
  configureRNG,
  getEnvReport,
  hasCustomRNG,
} from 'gmkitx';

configureRNG('strict');
const env = getEnvReport();
if (!env.hasWebCrypto && !env.hasNodeCrypto && !hasCustomRNG()) {
  throw new Error('no platform CSPRNG is configured');
}
if (!env.hasTextEncoder || !env.hasTextDecoder) {
  console.warn('当前宿主将使用内部 UTF-8 fallback，或需要注入 TextCodec');
}
```

`getEnvReport()` 在 Node ESM 中可能显示 `hasNodeCrypto: false`，因为该字段只探测 CommonJS `require('node:crypto')`；Node 18+ 通常同时有 `hasWebCrypto: true`。随机源与 `TextCodec` 的精确优先级见 [公共类型与工具](/api/typescript/common.html)。

## 选择说明页

<div class="doc-path-grid">
  <a class="doc-path-card" href="/api/typescript/common.html">
    <span class="doc-path-label">56 个根导出</span>
    <strong>公共类型与工具</strong>
    <small>格式常量、Hex/Base64、UTF-8、RNG、环境、字节和 ASN.1。</small>
  </a>
  <a class="doc-path-card" href="/api/typescript/sm2.html">
    <span class="doc-path-label">公钥密码</span>
    <strong>SM2</strong>
    <small>密钥、加解密、身份绑定签名、raw/DER、密钥交换和 SM2 类。</small>
  </a>
  <a class="doc-path-card" href="/api/typescript/sm3.html">
    <span class="doc-path-label">国密摘要</span>
    <strong>SM3</strong>
    <small>一次性摘要、HMAC、自动复用类和低层增量状态。</small>
  </a>
  <a class="doc-path-card" href="/api/typescript/sm4.html">
    <span class="doc-path-label">对称密码</span>
    <strong>SM4</strong>
    <small>七种模式、padding、GCM/CCM、tag、二进制解密和类工厂。</small>
  </a>
  <a class="doc-path-card" href="/api/typescript/zuc.html">
    <span class="doc-path-label">流密码与 3GPP</span>
    <strong>ZUC</strong>
    <small>ZUC-128、byte/word/bit 长度、EEA3、EIA3 和底层状态。</small>
  </a>
  <a class="doc-path-card" href="/api/typescript/sha.html">
    <span class="doc-path-label">国际摘要</span>
    <strong>SHA</strong>
    <small>SHA-256/384/512、HMAC、增量类和 SHA-1 旧协议边界。</small>
  </a>
</div>

五个算法命名空间归属本页，其余 116 个根导出分别归属上面六张说明页；总计 121 个。每张页面末尾还有“本页覆盖的公共 API”，便于核对名称。

## 输入与返回值总则

<ApiTable label="TypeScript API 总体约定" min-width="70rem">

| 情况 | 约定 | 例外或下一步 |
|:--|:--|:--|
| 消息 `string` | UTF-8 | key、IV、nonce、密文等字段按具体参数的 Hex/Base64 约定 |
| 原始二进制 | `Uint8Array` | 不要经过字符串中转 |
| 默认输出编码 | 通常为小写 Hex | SM4 返回结果对象；部分 API 固定 Hex；各页明确列出 |
| 文本解密 | 返回 `string` | 二进制使用 `sm2DecryptBytes`、`sm4DecryptBytes`、`zucDecryptBytes` |
| 验签不匹配 | 返回 `false` | 输入格式、密钥或参数非法仍抛错 |
| AEAD 认证失败 | 抛出 `Error` | 不返回未认证明文 |
| 其他参数错误 | 抛出 `Error` | 不使用 `null` 作为通用失败值 |

</ApiTable>

自动识别输入时通常优先 Hex，但不同函数的兼容逻辑并不完全相同。稳定协议必须保存格式、算法模式、字段长度和版本，调用时显式传 `InputFormat`、签名格式或密文排列。

## 错误处理示例

```ts
import {
  sm2GenerateKeyPair,
  sm2Sign,
  sm2Verify,
} from 'gmkitx';

const keys = sm2GenerateKeyPair();
const message = 'order=GMKIT-DEMO-0001&amount=88.00';
const receivedMessage = 'order=GMKIT-DEMO-0001&amount=99.00';
const signature = sm2Sign(keys.privateKey, message, {
  userId: 'merchant@gmkit.cn',
  signatureFormat: 'der',
});

let verified: boolean;
try {
  verified = sm2Verify(keys.publicKey, receivedMessage, signature, {
    userId: 'merchant@gmkit.cn',
    signatureFormat: 'der',
  });
} catch (error) {
  // 非法 Hex、DER、密钥或参数进入这里；不要记录敏感输入原文。
  throw new Error('invalid SM2 verification input', { cause: error });
}
if (verified) throw new Error('tampered order must not verify');
```

实际错误边界以算法页为准。例如 SM4-GCM 的 tag 错误一定抛异常，SM2 验签对合法但不匹配的签名返回 `false`，`ZUCState` 未初始化却不会主动报错。

## 已发布版本签名

本说明书解释用途、约束和案例。需要核对某个历史 npm 制品的逐成员 TypeScript 签名时，从 [已发布版本签名索引](/api/#已发布版本签名索引) 选择与 lockfile 相同的版本。

## 接下来

- [TypeScript 快速入门](/guide/typescript.html)：完成环境自检、签名和认证加密闭环
- [跨语言公共约定](/api/common.html)：统一编码、错误和安全边界
- [常见问题与故障排查](/guide/troubleshooting.html)
- [安全边界](/guide/security.html)
