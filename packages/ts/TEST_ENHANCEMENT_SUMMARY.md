# GMKitX 测试与验证说明

本文记录当前测试体系的职责和发版门禁。测试数量会随用例增长而变化，因此不在文档中固化某次运行的计数；以 CI 和本地命令的实际输出为准。

## 验证分层

| 层级 | 主要证据 | 代表文件 |
|:--|:--|:--|
| 标准固定向量 | SM2、SM3、SM4、ZUC、SHA 的公开标准结果 | `test/standard-vectors.test.ts`、各算法测试 |
| 独立实现差分 | SM4 CTR/CFB/OFB/GCM/CCM 与 Java/Bouncy Castle 固定输出一致 | `test/sm4.test.ts`、Java `SM4StandardVectorsTest` |
| Java/TS 互操作 | 两端消费同一份协议字段和确定性期望 | `test/interop-compliance.test.ts`、`vectors/interop.json` |
| 协议往返 | 加解密、签名验签、密钥交换、编码转换 | `test/sm2.test.ts`、`test/sm4.test.ts`、`test/zuc.test.ts` |
| 负向边界 | 非法密钥、DER、Base64、tag、C3、长度和篡改拒绝 | `test/error-handling.test.ts`、`test/asn1-strict-der.test.ts` |
| 状态与兼容 | 流式摘要复用、旧导出、空 userId、RNG 降级策略 | `test/sha.test.ts`、`test/oop.test.ts`、`test/module-imports.test.ts`、`test/rng-guards.test.ts` |

## 已固定的算法边界

### SM2

- 加密拒绝空明文，避免零长度 KDF 没有有效派生字节的歧义。
- 非空明文若遇到 KDF 全零结果，会重新选择临时标量，最多执行有界次数；不会返回错误密文。
- 签名私钥标量范围是 `[1, n-2]`，因为 `n-1` 无法计算 `(1+d)^-1`；公钥派生等通用 EC 操作仍接受 `n-1`。
- 密钥交换由 Java/Bouncy Castle 和 TypeScript 同时消费固定静态/临时私钥、UTF-8 userId、共享密钥及 S1/S2。
- raw/DER 签名、raw/ASN.1 密文、C1C3C2/C1C2C3、压缩/非压缩公钥分别覆盖。
- DER 解码拒绝 BER、非最短长度、非法 INTEGER、尾随数据；ASN.1 XML 调试入口限制容器边界和嵌套深度。

### SM3 与 SHA

- 使用公开摘要和 HMAC 固定向量。
- 流式实例在 `digest()` 后重置，可安全复用；测试同时覆盖 finalize 后的状态约束。
- SHA-1 仅作为旧协议兼容能力，不作为新协议推荐算法。

### SM4

- 标准单分组向量验证轮密钥和分组原语。
- CTR/CFB/OFB/GCM/CCM 使用 Bouncy Castle 差分结果，不只做自身往返。
- AEAD 测试要求错误 tag、AAD、nonce 或密钥不能返回明文。
- ECB、CBC、CTR、CFB、OFB 的 padding 和 IV 边界分别验证。

### ZUC

- 当前只支持 ZUC-128，不包含 ZUC-256 占位实现。
- ZUC-128 密钥流使用公开固定向量；128-EEA3 和 128-EIA3 使用 3GPP 测试集。
- 覆盖非整字节消息、末位掩码、COUNT/BEARER/DIRECTION 和长度边界。

## 随机源测试

默认策略保持 `warn` 兼容：没有 CSPRNG 时警告一次并使用非安全降级源。生产环境应启用 `configureRNG('strict')`，受限小程序应通过 `setCustomRNG()` 注入平台 CSPRNG。

测试会验证：

- Web Crypto 大请求按 65536 字节分块。
- 自定义 RNG 必须返回精确长度的 `Uint8Array`。
- 持续返回非法标量或全零派生结果时，算法会在有界次数后失败，不会无限循环。
- 测试注入的确定性 RNG 可清理，不应进入生产配置。

## 发版命令

```bash
npm run type-check -w packages/ts
npm test -w packages/ts
npm run lint -w packages/ts
npm run build -w packages/ts
npm run audit:pack -w packages/ts
npm run parity
```

根级 `npm run verify` 不包含 lint、tarball 审计和文档门禁，正式发版必须额外执行这些命令以及 `npm run docs:check`、`npm run docs:test-examples`、`npm run docs:build`。

## 证据限制

测试通过只说明当前提交在已覆盖环境和输入上满足断言，不等于项目完成独立第三方安全审计，也不证明所有标准条款、侧信道、密钥生命周期和业务协议均安全。项目生成的互操作向量只能证明 Java/TS 边界一致；只有标明外部来源并经核对的值才能作为标准固定向量证据。
