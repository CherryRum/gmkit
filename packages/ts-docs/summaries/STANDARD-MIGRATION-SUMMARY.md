---
title: GM/T 0009 迁移记录
icon: timeline
order: 4
category: [维护记录, 标准]
---

# GM/T 0009 迁移记录

本页记录现有 API 在 GM/T 0009 版本演进中的兼容决策，不把实现描述成认证结论。

## 当前决策

| 项目 | 决策 |
|:--|:--|
| 曲线 | 仅标准 SM2 曲线，自定义 `curveParams` 类型保留但不允许切换曲线 |
| userId | 默认 `1234567812345678`；TS 空字符串继续回落默认值以兼容旧调用 |
| 密文 | 默认 C1C3C2，保留 C1C2C3 |
| 签名 | 默认 raw，显式支持 DER/auto 解析 |
| ENTL | 按 UTF-8 字节长度计算并拒绝超界 |

标准中的推荐默认值和库的历史兼容默认值不是同一概念。若未来需要真实空 userId，应通过新选项或新 API 表达，不能把现有 `{ userId: '' }` 的行为静默改掉。

## 迁移检查

1. 签名与验签双方显式固定同一个非空 userId，或明确共同使用兼容默认值。
2. 固定 raw/DER 签名格式、C1C3C2/C1C2C3 密文排列和公钥表示。
3. 使用固定密钥做双向解密、双向验签和篡改拒绝。
4. 二进制载荷使用 bytes API，不经文本转换。
5. 跑 Java/TypeScript parity，记录依赖和协议版本。

```bash
npm run parity
npm test -w packages/ts -- sm2
mvn -f packages/java/pom.xml -B -ntp -pl gmkit test
```

- [实现符合性边界](/standards/GMT-0009-COMPLIANCE)
- [快速参考](/standards/GMT-0009-快速参考)
