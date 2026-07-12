---
title: TypeScript 实现状态
icon: code
order: 2
category: [维护记录]
---

# TypeScript 实现状态

## 算法

| 算法 | 当前实现 |
|:--|:--|
| SM2 | 密钥、公钥压缩、C1C3C2/C1C2C3、raw/DER 签名、密钥交换、二进制解密 |
| SM3 | 一次性与真实增量摘要、HMAC-SM3 |
| SM4 | ECB/CBC/CTR/CFB/OFB/GCM/CCM、结构化密文/tag、二进制解密 |
| ZUC | ZUC-128、EEA3 密钥流兼容入口、标准 EEA3 加密、EIA3 |
| SHA | SHA-1/256/384/512、HMAC-SHA-256/384/512 |

## 兼容性

无算法前缀的 `generateKeyPair`、`sign`、`digest` 等旧顶层导出继续存在并标记 deprecated。新代码使用带算法前缀函数或 `sm2`/`sm3` 命名空间。

SM2 `userId` 兼容行为是：省略值或 `''` 都回落到 `DEFAULT_USER_ID`。当前 API 不能用空字符串表达真实空 ID，不能在小版本改变该行为。

RNG 默认策略是 `warn`：缺少 CSPRNG 时打印警告并兼容降级。安全部署应使用 `configureRNG('strict')`，受限平台可通过 `setCustomRNG` 注入安全源。

## 构建

发布 ESM、CJS、IIFE 和类型声明，公共导出面以 `packages/ts/src/index.ts` 为唯一依据。`npm run audit:pack -w packages/ts` 审计 tarball。

## 正确性证据

- TypeScript 单测和标准向量。
- Java/TypeScript `vectors/interop.json` parity。
- ZUC 3GPP EEA3/EIA3 固定向量。
- SM4 与 Bouncy Castle 差分测试。

这些证据限定已测行为，不等于独立密码学审计。

- [公开 API 清单](/dev/API-SURFACE.zh-CN)
- [互操作向量](/dev/INTEROP_VECTORS)
