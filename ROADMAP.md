# GMKitX 开发路线图 / Development Roadmap

> 当前版本：v0.9.3  
> 更新日期：2026-03-10

---

## 一、当前版本已完成功能

### 算法实现
- ✅ SM2 椭圆曲线密码算法（加密、签名、密钥交换）
- ✅ SM3 密码杂凑算法（哈希、HMAC）
- ✅ SM4 分组密码算法（ECB、CBC、CTR、CFB、OFB、GCM、CCM）
- ✅ ZUC 流密码算法（EEA3、EIA3）
- ✅ SHA 系列（SHA-1、SHA-256、SHA-384、SHA-512 及对应 HMAC）

### 工程质量
- ✅ 470+ 测试用例全部通过
- ✅ TypeScript 强类型（零 `any` 类型）
- ✅ 函数式 + OOP 双 API
- ✅ Hex / Base64 输入输出格式
- ✅ ASN.1 DER 编码/解码
- ✅ 跨平台 RNG（WebCrypto → Node.js → 降级回退）
- ✅ ESM / CJS / UMD 三格式输出
- ✅ 完善的中英双语文档

---

## 二、已知问题 / Known Issues

### 🔴 安全相关（建议在 v0.10 修复）

| # | 问题 | 说明 | 优先级 |
|---|------|------|--------|
| S1 | **GCM/CCM 模式缺少 nonce 重用警告** | GCM 模式下相同 key+nonce 加密不同明文会完全破坏安全性。当前实现没有文档级别的强提醒或运行时检测。 | 高 |
| S2 | **CTR 模式计数器溢出未检测** | CTR/GCM 模式下加密超过 2^32 个块（约 64GB）后计数器会回绕，导致密钥流重用。应在大数据加密时抛出异常。 | 中 |
| S3 | **密钥材料无内存清理** | JavaScript 无法保证内存清零（GC 可能移动对象），但应在操作完成后尽量清理敏感缓冲区，如 `roundKeys`。 | 中 |
| S4 | **CCM 短标签未警告** | CCM 模式允许 4 字节标签，但安全性较弱，应在使用短标签时输出警告。 | 低 |

### 🟡 功能缺陷

| # | 问题 | 说明 | 优先级 |
|---|------|------|--------|
| F1 | **SM4 不支持流式加密** | 当前只支持一次性加密整个数据，无法分块处理大文件。 | 高 |
| F2 | **缺少独立的密钥验证函数** | 用户无法在加密前校验密钥是否合法（格式、长度、曲线上的点）。 | 中 |
| F3 | **SM2 零长度明文加密行为不明确** | 加密空字符串时的行为没有明确文档说明。 | 低 |
| F4 | **缺少结构化错误码** | 所有错误都是字符串消息，无法通过错误码进行程序化处理。 | 中 |

### 🟢 代码优化

| # | 问题 | 说明 | 优先级 |
|---|------|------|--------|
| O1 | **SM4 expandKey 每次加密重复计算** | 同一密钥多次加密时重复执行密钥扩展，应支持预计算缓存。 | 中 |
| O2 | **SM3 digest 内部 hex→bytes 转换冗余** | KDF 等内部调用 `sm3Digest` 返回 hex 再转 bytes，应提供直接返回 bytes 的内部 API。 | 低 |
| O3 | **缺少性能基准测试** | 没有系统化的 benchmark，无法量化优化效果。 | 低 |

---

## 三、下一版本功能规划 / Next Version Features

### v0.10.0 — 安全加固与 API 补全

#### 🔒 安全加固
- [ ] **添加 nonce 唯一性文档和最佳实践指南**
  - GCM/CTR/CFB/OFB 模式必须使用唯一 nonce
  - 提供随机 nonce 生成的示例代码
  - 在 API 文档中添加安全警告
- [ ] **CTR/GCM 计数器溢出检测**
  - 加密数据超过安全限制时抛出明确错误
  - GCM: 最大 2^39 - 256 位（约 64GB）
  - CTR: 最大 2^128 位（理论上不会溢出，但应有计数器回绕检测）
- [ ] **敏感数据清理工具**
  - 提供 `wipeBuffer(buf: Uint8Array)` 工具函数
  - 在 SM4 密钥扩展、SM2 私钥运算完成后清理中间变量
  - 注意：JavaScript 的 GC 机制限制了清理的可靠性
- [ ] **CCM 短标签警告**
  - tagLength < 8 时在控制台输出安全警告

#### 🛠 API 补全
- [ ] **密钥验证函数**
  ```typescript
  sm2.isValidPrivateKey(key: string): boolean
  sm2.isValidPublicKey(key: string): boolean
  sm4.isValidKey(key: BytesLike): boolean
  zuc.isValidKey(key: BytesLike): boolean
  zuc.isValidIV(iv: BytesLike): boolean
  ```
- [ ] **SM3 内部 bytes 返回 API**
  - 提供 `digestBytes(data): Uint8Array` 用于内部调用，避免 hex 中转
  - 优化 KDF 等热路径的性能
- [ ] **结构化错误码**
  ```typescript
  export enum ErrorCode {
    INVALID_KEY_LENGTH = 'INVALID_KEY_LENGTH',
    INVALID_IV_LENGTH = 'INVALID_IV_LENGTH',
    INVALID_PADDING = 'INVALID_PADDING',
    DECRYPTION_FAILED = 'DECRYPTION_FAILED',
    SIGNATURE_INVALID = 'SIGNATURE_INVALID',
    // ...
  }
  export class CryptoError extends Error {
    code: ErrorCode;
    details?: Record<string, unknown>;
  }
  ```

#### 🧪 测试补全
- [ ] GCM/CCM 零长度明文 + 非空 AAD 测试
- [ ] CCM 不同 nonce 长度（7、10、13 字节）覆盖
- [ ] SM2 空字符串加密测试
- [ ] SM4 密钥扩展缓存正确性测试
- [ ] 跨平台一致性测试（Node.js 18/20/22）

---

### v1.0.0 — 正式版 / Stable Release

#### 🚀 核心功能
- [ ] **SM4 流式加密**
  ```typescript
  // 分块加密 API
  const cipher = sm4.createCipher(key, { mode: 'cbc', iv });
  cipher.update(chunk1);
  cipher.update(chunk2);
  const result = cipher.final();
  
  // Node.js Transform Stream
  const stream = sm4.createCipherStream(key, { mode: 'cbc', iv });
  readableStream.pipe(stream).pipe(writableStream);
  ```
- [ ] **SM3 流式哈希优化**
  - 当前 SM3 类的 `update()` 方法只是缓存数据，最终一次性计算
  - 优化为真正的增量哈希：每凑满 64 字节立即压缩
- [ ] **密钥派生函数（KDF）**
  - PBKDF2-SM3：基于 SM3 的密码派生
  - HKDF-SM3：基于 SM3 的密钥扩展
- [ ] **SM2 证书解析**
  - 解析 X.509 证书中的 SM2 公钥
  - 支持 PEM/DER 格式
- [ ] **SM4-XTS 磁盘加密模式**

#### 📦 工程改进
- [ ] 导出模式迁移为纯命名导出（去除 default export）
- [ ] 添加 `@vitest/coverage-v8` 覆盖率报告
- [ ] 添加 benchmark 脚本（对比 OpenSSL、BouncyCastle）
- [ ] 添加 SECURITY.md 安全策略文件
- [ ] 完善跨语言互操作文档（Java BouncyCastle、Python gmssl、Go tjfoc/gmsm）

---

### v1.1.0 — 性能与生态

- [ ] **SM4 查找表优化**：使用预计算的 T-table（4KB 空间换取约 2x 速度提升）
- [ ] **WASM 可选加速**：为性能敏感场景提供 WebAssembly 版本
- [ ] **Web Crypto API 适配器**：将 SM 算法注册为 SubtleCrypto provider
- [ ] **React Native 支持**：确保在 Hermes 引擎上正常运行
- [ ] **微信小程序适配**：提供小程序 RNG 和文本编码的适配指南

---

## 四、贡献指南 / Contributing

欢迎对以上任何功能点提交 PR 或 Issue！

### 优先级说明
- **🔴 高优先级**：安全问题和核心功能缺失，应在下一个版本修复
- **🟡 中优先级**：API 完善和代码优化，计划在 v1.0 前完成
- **🟢 低优先级**：性能优化和生态扩展，可在 v1.1+ 逐步推进

### 引用标准
- GM/T 0002-2012: SM4 分组密码算法
- GM/T 0003-2012: SM2 椭圆曲线公钥密码算法
- GM/T 0004-2012: SM3 密码杂凑算法
- GM/T 0001-2012: ZUC 流密码算法
- GM/T 0009-2023: SM2 密码算法使用规范
- NIST SP 800-38D: GCM 模式推荐
- NIST SP 800-38C: CCM 模式推荐
- 3GPP TS 35.221: EEA3/EIA3 规范
