---
title: SM2 兼容与版本策略
description: 说明 SM2 密文、签名、公钥、userId 与 GM/T 0009 相关变更的兼容策略。
icon: timeline
order: 4
category: [项目参考, 兼容性]
tag: [SM2, GM/T 0009, userId, 版本策略]
---

# SM2 兼容与版本策略

标准版本的推荐值、第三方库的默认值和 GMKit 的历史兼容行为是三个不同概念。本页记录现有 SM2 API 的稳定语义，避免升级时把标准讨论误操作成破坏性变更。

## 当前兼容语义

| 项目 | TypeScript 行为 | 协议建议 |
|:--|:--|:--|
| 曲线 | 只接受标准 SM2 曲线；`curveParams` 类型保留但不能切换曲线 | 不在载荷中接受任意曲线参数 |
| userId | 省略值或 `''` 均回落 `DEFAULT_USER_ID` | 新协议显式固定同一个非空值 |
| 密文排列 | 默认 C1C3C2，支持 C1C2C3 | 载荷记录模式，不依赖探测 |
| 签名 | 默认 raw，支持 DER；验签可显式 `auto` | 双方固定 raw 或 DER |
| 公钥 | 接受压缩和非压缩格式 | 协议固定表示方式 |
| ENTL | 按 userId 的 UTF-8 字节数计算并拒绝超界 | 跨语言按字节而非字符计数 |

空字符串回落默认 userId 是已有调用的运行时兼容要求。若未来需要表达真实空 ID，应增加显式新 API 或新选项；不能改变 `{ userId: '' }` 的现有含义。

## 升级检查

1. 在升级前记录正在使用的 userId、C1 排列、签名格式、公钥格式和文本编码。
2. 用固定密钥执行双向加解密、双向签名验签和篡改拒绝。
3. 对二进制载荷使用 bytes API，不让文本解码参与协议。
4. 对随机输出验证语义，不比较一次 SM2 密文或签名的完整字面值。
5. Java/TypeScript 系统运行 parity，并为业务协议保存独立的回归样例。

## 版本变更规则

- 修复无效输入未拒绝的问题可以收紧校验，但必须在 CHANGELOG 说明。
- 删除旧顶层别名、改变默认 userId、默认 C1 排列或默认签名格式属于 breaking change。
- 标准文本更新不会自动覆盖历史默认值；必须先评估已发布调用和互操作影响。
- 文档中的“实现边界”不是逐条标准认证，不能作为变更兼容行为的唯一依据。

## 验证命令

```bash
npm test -w packages/ts -- sm2
npm run parity
mvn -f packages/java/pom.xml -B -ntp -pl gmkit test
```

- [GM/T 0009 实现边界与验证状态](/standards/GMT-0009-COMPLIANCE)
- [GM/T 0009 快速参考](/standards/GMT-0009-快速参考)
