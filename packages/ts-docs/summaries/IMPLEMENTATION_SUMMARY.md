---
title: 验证模型与证据
icon: code
order: 2
category: [项目参考, 质量保证]
tag: [测试, 标准向量, 互操作]
---

# 验证模型与证据

密码实现不能用单一“测试通过”结论概括。本项目按证据来源拆分验证，并明确每种证据能证明什么。

## TypeScript 验证层

| 测试类型 | 覆盖重点 | 代表文件 |
|:--|:--|:--|
| 标准向量 | SM2/SM3/SM4/ZUC/SHA 固定结果 | `standard-vectors.test.ts`、算法测试 |
| 协议往返 | 加解密、签名验签、模式和编码 | `sm2.test.ts`、`sm4.test.ts`、`zuc.test.ts` |
| 负向测试 | 非法 key、格式、tag、篡改和边界长度 | `error-handling.test.ts`、`asn1-strict-der.test.ts` |
| 属性测试 | 多种输入长度、往返和不变量 | `crypto-properties.test.ts` |
| 兼容测试 | 旧导出、默认 userId、RNG 策略 | `module-imports.test.ts`、`rng-guards.test.ts` |
| 互操作 | 消费根级共享向量 | `interop-compliance.test.ts` |

类型检查、lint、ESM/CJS/IIFE 构建和 npm tarball 审计属于工程验证，不替代算法测试。

## Java 验证层

Java 主包按算法拆分标准向量、错误处理、公共契约和工具入口测试，并由 `InteropComplianceTest` 消费同一份 `vectors/interop.json`。`DocumentationExamplesTest` 编译运行文档使用的主包示例，防止方法名和返回结构漂移。

普通 Java CI 不强制 native 可用。SM9 的签名、加密和密钥生命周期必须在 `sm9-native.yml` 中以 `-Dgmkit.sm9.requireNative=true` 强制执行，不能用 assumptions 跳过的普通测试代替。

## 跨语言示例

文档 CI 从干净环境安装固定版本并运行：

| 生态 | 固定实现 | 当前 fixture |
|:--|:--|:--|
| Go | `github.com/emmansun/gmsm v0.40.0` | SM3、SM4 标准向量 |
| Python | `gmssl==3.2.2` | SM3、SM4 标准向量 |
| Rust | RustCrypto `sm3 0.5.0`、`sm4 0.6.0` | SM3、SM4 标准向量 |
| Java/Hutool | Hutool 5.8.43、BC 1.83 | SM3、SM4 标准向量和加载验证 |
| Web Crypto | 当前 Node.js `crypto.subtle` | AES-GCM、RSA-OAEP 往返 |

这些 fixture 证明页面展示的固定依赖和最小调用可以运行，不代表外部库全部 API 已由 GMKit 审核，也不构成 SM2 跨语言互操作证明。

## 向量可信度

1. 标明标准及测试集的向量用于核对外部固定结果。
2. `source: project` 的向量用于 Java/TS 回归和协议一致性。
3. 随机 SM2 输出只验证解密、验签和篡改拒绝，不比较随机字面值。
4. 修改确定性期望值时必须引入外部标准或独立成熟实现证据，不能让两端一起改成同一个错误结果。

## 发布验证入口

```bash
npm ci
npm run verify
npm run lint -w packages/ts
npm run audit:pack -w packages/ts
npm run docs:check
npm run docs:test-examples
npm run docs:build
```

`npm run verify` 覆盖 TS 类型/测试/构建、Java 测试和 parity；文档、lint 与 pack 审计仍需显式执行。完整发布职责以[发布流程](/dev/PUBLISHING)为准。

## 证据限制

通过上述验证只说明当前提交在已列环境和输入上满足断言。它不证明：所有标准条款已逐项认证、运行时无侧信道、依赖供应链永远安全、调用方的密钥生命周期正确，或未覆盖平台可用。

- [共享互操作向量](/dev/INTEROP_VECTORS)
- [安全保证边界](/summaries/SECURITY-SUMMARY)
