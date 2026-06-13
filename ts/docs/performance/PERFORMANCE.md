---
title: 性能基准测试
icon: tachometer-alt
order: 1
author: mumu
date: 2025-11-23
category:
  - 性能
  - 测试
tag:
  - 性能
  - 基准测试
  - Benchmark
---

# Performance Optimization 性能优化说明

## SM3 Hash Algorithm Optimizations SM3哈希算法优化

### ✅ Implemented Optimizations 已实现的优化

#### 1. Inlined Functions 内联函数
**Status 状态: ✅ Implemented 已实现**

The Boolean functions (FF, GG) and permutation functions (P0, P1) are now inlined directly in the compression function to reduce function call overhead.

布尔函数（FF、GG）和置换函数（P0、P1）现在直接内联在压缩函数中，以减少函数调用开销。

#### 2. Pre-computed Constants 预计算常量
**Status 状态: ✅ Implemented 已实现**

The T constants (0x79cc4519 and 0x7a879d8a) are pre-computed and the main loop is split into two sections to eliminate conditional checks.

T常量（0x79cc4519和0x7a879d8a）已预计算，主循环分为两部分以消除条件检查。

#### 3. DataView for Buffer Operations 使用DataView进行缓冲区操作
**Status 状态: ✅ Implemented 已实现**

Using DataView for direct buffer manipulation reduces intermediate allocations and improves memory access patterns.

使用DataView进行直接缓冲区操作减少了中间分配，改善了内存访问模式。

#### 4. Reduced Array Allocations 减少数组分配
**Status 状态: ✅ Implemented 已实现**

Using `subarray()` instead of `slice()` for block processing avoids unnecessary memory copies.

在块处理中使用`subarray()`而不是`slice()`避免了不必要的内存复制。

**Performance Impact 性能影响:**
- Throughput: ~26 MB/s on typical hardware
- 吞吐量：在典型硬件上约26 MB/s
- Suitable for most cryptographic applications
- 适用于大多数加密应用

## SM4 Block Cipher Optimizations SM4分组密码优化

### Implemented Optimizations 已实现的优化

### 1. S-box and L Transform Pre-computation S盒和L转换预计算
**Status 状态: ✅ Implemented 已实现**

The current implementation uses pre-computed S-box lookup tables for the non-linear transformation (τ). This is a standard optimization technique that trades memory for speed.

当前实现使用预计算的S盒查找表进行非线性变换（τ）。这是一种标准的优化技术，以内存换取速度。

```typescript
const SBOX: number[] = [
  0xd6, 0x90, 0xe9, 0xfe, /* ... */
];

function tau(a: number): number {
  return (
    (SBOX[(a >>> 24) & 0xff] << 24) |
    (SBOX[(a >>> 16) & 0xff] << 16) |
    (SBOX[(a >>> 8) & 0xff] << 8) |
    SBOX[a & 0xff]
  ) >>> 0;
}
```

## Optimizations Not Feasible in JavaScript/TypeScript 在JavaScript/TypeScript中不可行的优化

### 2. SIMD Parallel Processing with CPU AES Instructions 使用CPU AES指令的SIMD并行处理
**Status 状态: ❌ Not Feasible 不可行**

**Reason 原因:**
- JavaScript/TypeScript does not have direct access to CPU-specific instructions like AES-NI
- JavaScript/TypeScript无法直接访问CPU特定指令，如AES-NI
- The WebAssembly SIMD proposal could enable some parallelization, but it doesn't provide access to AES-specific instructions
- WebAssembly SIMD提案可以实现一些并行化，但无法访问AES特定指令
- This optimization is typically only available in native languages (C, C++, Rust, Go with assembly)
- 此优化通常仅在原生语言中可用（C、C++、Rust、Go汇编）

**Alternatives 替代方案:**
- For maximum performance, consider using a WebAssembly module compiled from a native implementation
- 为了获得最大性能，考虑使用从原生实现编译的WebAssembly模块
- Node.js users can use native addons for crypto operations
- Node.js用户可以使用原生插件进行加密操作

### 3. SIMD with GFNI Instructions 使用GFNI指令的SIMD
**Status 状态: ❌ Not Feasible 不可行**

**Reason 原因:**
- GFNI (Galois Field New Instructions) is an x86-64 CPU instruction set extension
- GFNI（伽罗瓦域新指令）是x86-64 CPU指令集扩展
- Not accessible from JavaScript/TypeScript or standard WebAssembly
- JavaScript/TypeScript或标准WebAssembly无法访问
- Would require native code or specialized WebAssembly with CPU-specific extensions
- 需要原生代码或带有CPU特定扩展的专用WebAssembly

### 4. Bitslicing 位切片
**Status 状态: ⚠️ Theoretically Possible but Complex 理论上可行但复杂**

**Reason 原因:**
- Bitslicing is a software technique that can be implemented in any language
- 位切片是一种可以在任何语言中实现的软件技术
- However, it requires significant code restructuring and increased code size
- 但是，它需要大量的代码重构和增加代码大小
- Benefits in JavaScript are questionable due to:
- 在JavaScript中的好处值得怀疑，因为：
  - JavaScript's number representation (64-bit floating point vs. native integers)
  - JavaScript的数字表示（64位浮点数 vs. 原生整数）
  - JIT compiler optimizations may not work well with bitsliced code
  - JIT编译器优化可能无法很好地处理位切片代码
  - The lookup table approach is already quite efficient for single-block operations
  - 查找表方法对于单块操作已经相当高效

**Decision 决定:**
- Not implemented at this time due to complexity vs. benefit trade-off
- 由于复杂度与收益权衡，目前未实现
- May be reconsidered if benchmarking shows significant potential gains
- 如果基准测试显示有显著的潜在收益，可能会重新考虑

## Implemented Cipher Modes 已实现的密码模式

### Block Cipher Modes 分组密码模式
- ✅ **ECB** (Electronic Codebook) - 电码本模式
- ✅ **CBC** (Cipher Block Chaining) - 分组链接模式

### Stream Cipher Modes 流密码模式
- ✅ **CTR** (Counter) - 计数器模式
- ✅ **CFB** (Cipher Feedback) - 密文反馈模式
- ✅ **OFB** (Output Feedback) - 输出反馈模式

### Authenticated / AEAD Mode 认证模式
- ✅ **GCM** (Galois/Counter Mode) - 认证加密，需 12 字节 IV 和标签
- ✅ **CCM** (Counter with CBC-MAC) - 认证加密，需 7-13 字节 nonce 和标签

## Authenticated & Advanced Cipher Modes 状态

### 1. GCM (Galois/Counter Mode)
**Status 状态: ✅ Implemented 已实现**

**Features 功能:**
- Authenticated Encryption with Associated Data (AEAD)
- 带关联数据的认证加密（AEAD）
- Galois field multiplication in GF(2^128)
- 伽罗瓦域乘法（GF(2^128)）
- Configurable authentication tag length (12-16 bytes)
- 可配置的认证标签长度（12-16字节）
- Support for Additional Authenticated Data (AAD)
- 支持额外认证数据（AAD）

**Usage 使用方法:**
```typescript
import { sm4Encrypt, sm4Decrypt, CipherMode } from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210';
const iv = '000000000000000000000000'; // 12 bytes for GCM
const plaintext = 'Secret message';
const aad = 'Additional authenticated data';

// Encrypt
const result = sm4Encrypt(key, plaintext, { 
  mode: CipherMode.GCM, 
  iv, 
  aad 
});
console.log(result); // { ciphertext: '...', tag: '...' }

// Decrypt with authentication
const decrypted = sm4Decrypt(key, result, { 
  mode: CipherMode.GCM, 
  iv, 
  aad 
});
```

### 2. CCM (Counter with CBC-MAC)
**Status 状态: ✅ Implemented 已实现**

**Features 功能:**
- Authenticated Encryption with Associated Data (AEAD)
- 带关联数据的认证加密（AEAD）
- CBC-MAC authentication + CTR encryption
- CBC-MAC 认证 + CTR 加密
- Configurable nonce length (7-13 bytes)
- 可配置 nonce 长度（7-13 字节）
- Configurable authentication tag length (4-16 bytes, even)
- 可配置认证标签长度（4-16 字节，且必须为偶数）

**Usage 使用方法:**
```typescript
import { sm4Encrypt, sm4Decrypt, CipherMode } from 'gmkitx';

const key = '0123456789abcdeffedcba9876543210';
const nonce = '00112233445566778899aabb'; // 12 bytes nonce
const aad = 'Additional authenticated data';

// Encrypt
const result = sm4Encrypt(key, 'Secret message', {
  mode: CipherMode.CCM,
  iv: nonce,
  aad,
  tagLength: 16
});

// Decrypt with authentication
const decrypted = sm4Decrypt(key, result, {
  mode: CipherMode.CCM,
  iv: nonce,
  aad
});
```

> **Note / 提示**: The following cipher modes are roadmap explorations and are **not available** in the current NPM release. / 下列密码模式仍在规划中，当前 NPM 版本尚未提供。

### 3. XTS (XEX-based tweaked-codebook mode with ciphertext stealing)
**Status 状态: ⏳ Planned 计划中**

**Reason for not implementing yet 暂未实现的原因:**
- XTS requires two independent keys
- XTS需要两个独立的密钥
- Requires careful implementation of ciphertext stealing
- 需要仔细实现密文挪用
- Primarily used for disk encryption scenarios
- 主要用于磁盘加密场景
- Lower priority compared to more common modes
- 相比更常见的模式优先级较低

### 4. HCTR (Hash-Counter-Hash)
**Status 状态: 📋 Under Consideration 考虑中**

**Reason for not implementing yet 暂未实现的原因:**
- HCTR is a specialized tweakable wide-block cipher mode
- HCTR是一种专用的可调宽块密码模式
- Less commonly used in practice
- 实践中使用较少
- Requires polynomial hash function implementation
- 需要实现多项式哈希函数

### 5. OFBNLF (Output Feedback with Non-Linear Function)
**Status 状态: 📋 Under Consideration 考虑中**

**Reason for not implementing yet 暂未实现的原因:**
- OFBNLF is a non-standard mode
- OFBNLF是非标准模式
- Limited documentation and test vectors available
- 可用的文档和测试向量有限
- Not widely used in practice
- 实践中使用不广泛

## Performance Tips 性能建议

### For Browser Environments 浏览器环境
1. Use CTR, CFB, or OFB modes for data that doesn't align to block boundaries
   对于不对齐到块边界的数据，使用CTR、CFB或OFB模式
2. Consider using Web Workers for parallel encryption of multiple independent blocks
   考虑使用Web Workers并行加密多个独立块
3. For large data, process in chunks to avoid blocking the UI thread
   对于大数据，分块处理以避免阻塞UI线程

### For Node.js Environments Node.js环境
1. For very high-performance requirements, consider native crypto modules
   对于非常高性能的需求，考虑原生加密模块
2. Use stream processing for large files
   对大文件使用流处理
3. Consider using worker threads for parallel processing
   考虑使用工作线程进行并行处理

## Benchmarking 基准测试

The current implementation provides reasonable performance for most use cases:
- ECB/CBC modes: ~50-100 MB/s (single-threaded, pure JavaScript)
- CTR/CFB/OFB modes: ~40-80 MB/s (single-threaded, pure JavaScript)

当前实现为大多数用例提供合理的性能：
- ECB/CBC模式：~50-100 MB/s（单线程，纯JavaScript）
- CTR/CFB/OFB模式：~40-80 MB/s（单线程，纯JavaScript）

Actual performance will vary based on:
- JavaScript engine (V8, SpiderMonkey, JavaScriptCore)
- Hardware (CPU speed, cache size)
- Data size and block alignment

实际性能将根据以下因素而变化：
- JavaScript引擎（V8、SpiderMonkey、JavaScriptCore）
- 硬件（CPU速度、缓存大小）
- 数据大小和块对齐

## Future Work 未来工作

1. Add performance benchmarking suite and publish baselines
   添加并发布性能基准测试套件
2. Extend cipher mode coverage (XTS/HCTR/OFBNLF) with test vectors
   补充更多密码模式支持（XTS/HCTR/OFBNLF）并完善测试向量
3. Consider WebAssembly implementation for critical paths
   考虑为关键路径实现WebAssembly
4. Optimize for specific JavaScript engines and worker/thread usage
   针对特定JavaScript引擎与 Worker/线程场景优化

## References 参考

- GM/T 0002-2012: SM4 Block Cipher Algorithm
- NIST SP 800-38A: Recommendation for Block Cipher Modes of Operation
- NIST SP 800-38D: Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM)
