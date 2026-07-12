---
home: true
title: GMKitX 技术文档
heroText: GMKitX
tagline: 面向浏览器与 Node.js 的 TypeScript 国密算法库
actions:
  - text: 快速开始
    link: /guide/getting-started
    type: primary
  - text: API 清单
    link: /dev/API-SURFACE.zh-CN
    type: secondary
features:
  - title: 协议边界明确
    details: 明确记录 SM2 userId、密文排列、签名格式，SM4 mode/nonce/tag，以及 ZUC EEA3/EIA3 位长度语义。
  - title: 跨语言验证
    details: Java 与 TypeScript 共用根目录 vectors/interop.json，并在 CI 中执行确定性向量与回环验证。
  - title: 多种分发格式
    details: npm 包同时提供 ESM、CommonJS、浏览器 IIFE 和 TypeScript 类型声明。
footer: Apache-2.0 Licensed | Copyright © 2026 GMKit contributors
---

## 支持范围

| 算法 | TypeScript 能力 | 关键边界 |
|:--|:--|:--|
| SM2 | 密钥生成、加解密、签名验签、密钥交换 | 默认 C1C3C2；raw/DER 签名；空 userId 回落到兼容默认值 |
| SM3 | 摘要、HMAC、增量摘要 | 输出 hex/base64；`SM3` 增量实例在 `digest()` 后重置 |
| SM4 | ECB/CBC/CTR/CFB/OFB/GCM/CCM | 新业务优先 GCM/CCM；AEAD 必须传递 tag 与 AAD |
| ZUC | ZUC-128、EEA3、EIA3 | `eea3` 是兼容密钥流入口；标准消息加密使用 `eea3Encrypt` |
| SHA | SHA-1/256/384/512、HMAC | SHA-1 仅用于旧协议兼容；不提供 SHA-224 |
| SM9 | 不支持 | SM9 仅由 Java 的 JNI/GmSSL 独立模块提供 |

::: warning 安全状态
GMKitX 尚未完成独立第三方安全审计。固定向量和单元测试只能证明已覆盖行为，不能替代密码产品认证、密钥管理设计或目标运行环境的安全评估。
:::

## 发布前验证

```bash
npm ci
npm run type-check -w packages/ts
npm test -w packages/ts
npm run build -w packages/ts
npm run audit:pack -w packages/ts
npm run parity
npm run docs:check
npm run docs:test-examples
npm run docs:build
```

继续阅读：[快速开始](/guide/getting-started)、[算法选择](/guide/about-guomi)、[安全边界](/guide/security)、[共享测试向量](/dev/INTEROP_VECTORS)。
