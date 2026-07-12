---
title: 性能优化方法
icon: rocket
order: 2
category: [性能, 维护]
tag: [性能优化, Profiling]
---

# 性能优化方法

本页保留项目的优化检查流程，不宣称未经当前基准复现的百分比。密码实现优化遵循“正确性向量 -> profile -> 小改动 -> 差分测试 -> 同机基准”的顺序。

## 已有工程选择

- SM2 KDF 预分配计数器输入缓冲区，并在生成过程中检测全零派生结果。
- SM3 类使用增量状态，不为流式输入缓存完整消息。
- SM4/ZUC 的二进制 API 避免 UTF-8 往返。
- SHA 使用 `@noble/hashes`，SM2 曲线运算使用 `@noble/curves`。
- 构建输出开启 tree-shaking、minify，ESM/CJS/IIFE 使用同一公开入口。

这些是代码事实，不等于在所有引擎上都有固定提升比例。

## 优化流程

1. 用标准向量和 `npm test -w packages/ts` 建立正确性基线。
2. 用 `npm run bench -w packages/ts` 记录原始输出和环境。
3. 通过 CPU profile / allocation profile 定位热点，不凭直觉改密码流程。
4. 保持协议输出不变；涉及确定性结果时运行 `npm run parity`。
5. 同机交替运行前后版本，报告样本分布。

## 数据与内存

- 输入已经是二进制时传 `Uint8Array`，避免 hex/base64 的重复解码。
- 大文件摘要使用增量 `SM3`/`SHA*` 类；分组/流加密是否可分块取决于 mode 状态，不能把一次性 API 对每个分片重复调用。
- Worker 可隔离 CPU 任务，但密钥和数据复制会增加成本；优先用 transferable buffer，并限制密钥在多个执行上下文中的副本。
- `Uint8Array.fill(0)` 只能清除当前可见缓冲区，无法保证清除 JIT、字符串和历史复制。

## 不允许的“优化”

| 做法 | 问题 |
|:--|:--|
| `skipZComputation: true` 作为默认 | 改变标准 SM2 签名语义 |
| SM4-CBC 不加 MAC | 失去密文完整性，不是 AEAD |
| GCM/CCM 重用 nonce | 可能破坏机密性和认证安全 |
| 缺 CSPRNG 时静默降级 | 当前默认会警告；高安全环境应使用 strict |
| 为省解析时间自动猜测协议 | 格式歧义会导致互操作和安全问题 |

## 公钥与格式

压缩 SM2 公钥从 65 字节降到 33 字节，适合带宽受限协议；非压缩公钥避免解压步骤。该选择应由协议载荷和测量结果决定，而不是固定推荐某一种。

raw SM2 签名固定 64 字节，DER 长度可变。跨语言 Java/JCA 场景常使用 DER；优先互操作正确，再讨论编码成本。

## 提交证据

性能 PR 应包含：测试命令、基准环境、前后原始输出、正确性差分结果、是否改变内存分配和协议字段。没有这些证据时，只能把改动描述为实现调整，不能声称性能提升。

- [性能与基准](/performance/PERFORMANCE)
- [跨语言互操作向量](/dev/INTEROP_VECTORS)
