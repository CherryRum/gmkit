---
title: 性能基准与解释方法
description: 说明怎样在固定环境运行 GMKit 基准并正确记录吞吐、延迟与可复现条件。
icon: gauge
order: 1
category: [性能]
tag: [Benchmark, Vitest, 可复现性]
---

# 性能基准与解释方法

密码算法性能数据只有在代码版本、运行时、硬件、输入大小和参数全部固定时才可比较。本项目提供可复现的基准入口，不发布脱离环境的“典型 MB/s”或单次运行截图。

## TypeScript 基准范围

`packages/ts/bench/crypto.bench.ts` 当前包含：

| 算法 | 场景 | 输入 |
|:--|:--|:--|
| SM3 | 一次性摘要 | 1 KiB |
| SM4 | ECB/CBC/CTR 加密 | 1 KiB |
| ZUC | 通用流加密 | 1 KiB |
| EEA3 | 密钥流生成 | 8192 bit |
| EIA3 | 完整性标签 | 1 KiB |

```bash
npm run bench -w packages/ts
```

当前文件不覆盖 SM2、SM4-GCM/CCM、解密、编码转换和浏览器 Worker。没有对应场景时，不应从其他基准外推这些操作的性能。

## 结果记录

每份可比较结果至少包含：

```text
commit: <完整或可定位的 git sha>
dirty worktree: yes/no
os/arch: <系统与架构>
cpu: <准确型号>
node/npm: <版本>
power mode: <电源/CPU governor>
command: npm run bench -w packages/ts
input/options: <基准文件中的固定参数>
warmup/samples: <Vitest 原始输出>
result: <未经挑选的完整输出>
```

比较前后版本时，在同一机器、同一 Node 主版本和相同电源状态下交替运行多轮。报告中位数及离散程度，不只选择最快一次，也不把不同 runner 的绝对数值直接相减。

## 指标解释

- `ops/s` 适合比较固定工作量的吞吐；输入大小不同不能直接比较。
- 平均延迟会受到 JIT 预热、垃圾回收、系统调度和后台负载影响。
- hex/base64 编解码和 `Uint8Array` 复制属于端到端成本，但算法微基准可能没有覆盖。
- 公钥操作包含随机源和大整数运算，必须分别报告密钥生成、签名、验签、加密和解密。
- Worker 可以改善 UI 响应性，但序列化、复制和调度会增加总耗时，不等于算法更快。

## 安全语义优先

以下变化不能作为性能优化接受：

| 做法 | 破坏的语义 |
|:--|:--|
| 关闭 C3、tag 或签名验证 | 完整性和真实性 |
| GCM/CCM 重用 nonce | 机密性和认证安全 |
| 默认启用 `skipZComputation` | 标准 SM2 签名语义 |
| 缺 CSPRNG 时静默降级 | 密钥和随机数安全 |
| 从 AEAD 退回 ECB/CBC | 完整性保护和协议安全 |

模式、填充和编码改变后，即使吞吐提高，也属于协议变更而不是等价优化。

## CI 策略

共享 GitHub runner 噪声较大，当前 CI 不设置绝对吞吐门槛。涉及热路径的变更应提交同机前后原始结果、正确性测试和分配变化；只有在固定专用 runner、样本策略和容忍区间后，才适合用性能数值阻断合并。

- [性能优化与评审](/maintenance/performance/optimization)
- [验证模型](/maintenance/reports/validation-model)
