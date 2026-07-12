---
title: 性能与基准
icon: gauge
order: 1
category: [性能]
tag: [Benchmark, Vitest]
---

# 性能与基准

性能数据只有在代码版本、运行时、硬件、输入大小和参数都固定时才有意义。本项目不发布“典型硬件约多少 MB/s”一类不可复现数字；发布页只提供基准入口和记录格式。

## 当前基准

`packages/ts/bench/crypto.bench.ts` 覆盖：

- SM3：1 KiB 摘要。
- SM4：ECB/CBC/CTR 1 KiB 加密。
- ZUC：1 KiB 流加密、EEA3 密钥流、EIA3 MAC。

```bash
npm run bench -w packages/ts
```

SM2 操作受随机源和曲线运算影响较大，当前基准文件未覆盖，不能从本页推导 SM2 数值。

## 结果记录模板

提交性能结论时至少记录：

```text
commit: <git sha>
os/arch: Windows 11 x64 | Ubuntu 24.04 x64 | ...
cpu: <exact model>
node: <node --version>
npm: <npm --version>
power mode: <balanced/performance>
command: npm run bench -w packages/ts
warmup/samples: <Vitest output>
result: <raw benchmark output>
```

比较优化前后应在同一机器、同一 Node 主版本和相同电源状态下交替运行多轮，报告中位数和离散程度，不只截取最好一次。

## 模式与性能

| 选择 | 主要影响 |
|:--|:--|
| hex/base64 | 编码会产生额外分配；大数据优先保持 `Uint8Array` |
| SM2 压缩公钥 | 节省传输空间，解析时需要恢复点；先按协议需求选择 |
| SM4 AEAD | GCM/CCM 同时提供机密性和认证，不应为追求吞吐退回无认证模式 |
| Worker | 可避免阻塞 UI，但序列化和复制也有成本；适合批量独立任务 |

不要通过关闭 C3/tag 验证、复用 IV/nonce、启用 `skipZComputation` 或降级随机源来换取性能。这些会改变安全语义，不是优化。

## 浏览器测量

Node 基准不能代表浏览器。浏览器测量应单独记录浏览器版本、设备、页面前后台状态、Worker 数量和输入传输方式。避免在 UI 主线程用一次 `performance.now()` 推导吞吐量；使用足够预热和样本，并确认垃圾回收没有主导结果。

## 回归门槛

当前 CI 不设置跨 GitHub runner 的绝对吞吐门槛，因为共享 runner 噪声较大。涉及算法热路径的 PR 应附同机前后结果、正确性测试和内存变化；只有建立专用稳定 runner 后才适合自动阻断性能回归。

- [性能优化方法](/performance/PERFORMANCE-OPTIMIZATIONS)
- [安全边界](/guide/security)
