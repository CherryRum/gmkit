# API 稳定性与兼容策略

GMKit 当前处于公开测试阶段：`0.x` 允许发生有迁移说明的破坏性变化，`1.x` 才进入正式稳定版本线。项目不会把测试版身份当作静默破坏现有用户的理由；所有公开 API 变更都必须按本页分类、验证并记录。

## 稳定性分级

| 级别 | 定义 | 变更要求 |
|:--|:--|:--|
| 公开 | 由 npm `exports`、TypeScript 顶层入口或 Java 公共包暴露，并在 README/技术文档中说明 | 破坏性变化必须提升相应发布单元的 breaking version、提供迁移说明并更新 CHANGELOG |
| 弃用 | 仍可编译和运行，但已有明确替代项 | 在承诺窗口内保留；删除前必须再次公告并测试迁移路径 |
| 实验性 | 文档明确标记为实验性，行为可能调整 | 仍需记录变化，不能伪装成稳定 API |
| 内部 | 未从公共入口导出，或只存在于测试/构建代码 | 可随实现调整，不提供兼容承诺 |

TypeScript 与 Java 独立版本化和发布。共享向量不意味着两者具有相同 API、ABI、异常类型或稳定性周期。

## TypeScript 公共边界

`packages/ts/package.json#exports` 当前只开放：

- `gmkitx`
- `gmkitx/package.json`

`packages/ts/src/index.ts` 是根入口的唯一公共导出清单。`src/crypto/*`、`src/core/*` 等源码路径不是 package subpath，调用方不应绕过 `exports` 深度导入。

### 弃用兼容别名

| 旧名称 | 推荐名称 |
|:--|:--|
| `generateKeyPair` | `sm2GenerateKeyPair` |
| `getPublicKeyFromPrivateKey` | `sm2GetPublicKeyFromPrivateKey` |
| `compressPublicKey` | `sm2CompressPublicKey` |
| `decompressPublicKey` | `sm2DecompressPublicKey` |
| `sign` | `sm2Sign` |
| `verify` | `sm2Verify` |
| `keyExchange` | `sm2KeyExchange` |
| `digest` | `sm3Digest` |
| `hmac` | `sm3Hmac` |

这些名称仍同时存在于具名导出和默认导出对象中。弃用标记用于引导新代码迁移，不改变运行时行为。

### 已固定兼容行为

- `sm2DecryptBytes`、`sm4DecryptBytes`、`zucDecryptBytes` 是任意二进制明文入口。
- `eea3Encrypt` 是标准 EEA3 消息加密入口；旧 `eea3` 继续返回字对齐密钥流。
- SM2 省略 `userId` 或传入 `''` 都回落到 `DEFAULT_USER_ID`。
- RNG 默认策略为 `warn`；缺少 CSPRNG 时警告并兼容降级。安全环境应启用 `strict`，受限平台应注入自定义 CSPRNG。
- 默认导出继续保留以兼容 UMD/CDN 和旧调用；新代码优先具名导出。

改变上述行为属于兼容性变更，不能作为普通内部重构处理。

## Java 公共边界

Java 公开 API 以发布 JAR 中的 `cn.gmkit` 公共类型和 `packages/java/README.md` 为准。主包保持 Java 8 API/字节码基线，并在 release verify 中通过 Animal Sniffer 检查。

主要公共入口包括：

- `cn.gmkit.sm2.SM2`、`SM2Util`
- `cn.gmkit.sm3.SM3`、`SM3Util`
- `cn.gmkit.sm4.SM4`、`SM4Util`
- `cn.gmkit.zuc.ZUC`、`ZUCUtil`
- `cn.gmkit.core` 中公开的编码、模式、格式和异常类型

`cn.gmkit.sm9` 依赖 JNI/GmSSL；单一 `gmkit-sm9` JAR 内置已支持平台的 runtime，并只加载当前平台资源。其支持范围由 `sm9-native.yml` 和 Java 发布工作流的强制测试矩阵决定。`cn.gmkit.test` 只存在于测试源码，不属于发布 API。

## 共享协议数据

`vectors/interop.json` 的 case `id` 视为稳定测试标识。新增字段应保持消费者向后兼容；字段重命名、删除或语义改变必须在同一变更中更新 Java/TypeScript 消费者和 CHANGELOG。

项目互操作向量只验证已固定字段下的两端一致性，不建立跨语言 API 稳定承诺。

## 变更检查

公开 API 变更至少需要：

1. 更新 TypeScript API 清单或 Java README/Javadoc。
2. 增加编译级和运行时兼容测试。
3. 记录弃用、替代项、默认值和迁移步骤。
4. 对协议字段运行 Java/TypeScript parity。
5. 对 breaking change 使用清晰版本号和 CHANGELOG，不复用已发布 tag。

完整 TypeScript 导出见 [`docs/site/dev/API-SURFACE.zh-CN.md`](site/dev/API-SURFACE.zh-CN.md)。
