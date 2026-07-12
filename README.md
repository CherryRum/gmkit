# GMKit - 国密算法多语言工具库

GMKit 是一个 Java + TypeScript monorepo，维护 JVM 后端与前端/Node.js 侧的国密算法实现。项目目标不是让两个语言共享完全相同的 ABI，而是通过共享互操作向量和明确的协议边界，保证常用密文、签名、摘要和 MAC 能跨语言验证。

## 仓库结构

```text
gmkit/
├── packages/
│   ├── ts/        # npm 包 gmkitx；SM2/SM3/SM4/ZUC/SHA，纯 TypeScript
│   ├── ts-docs/   # VuePress 文档站
│   └── java/      # Maven 多模块；主包 gmkit，SM9 独立 JNI/GmSSL 模块
├── apps/
│   └── gmkit-studio/  # Vue3 + Vite 工具站；V5 三栏工具工作台
├── vectors/       # Java / TypeScript 共享互操作测试向量
├── scripts/       # 本地校验与 SM9 native 构建脚本
└── .github/       # monorepo CI、发布、文档和 SM9 native 工作流
```

## 支持矩阵

| 算法  | Java   | TypeScript | 说明                                                                 |
|-----|--------|------------|--------------------------------------------------------------------|
| SM2 | 支持     | 支持         | 加解密、签名/验签、密钥交换；跨语言需固定 userId、密文模式和签名格式                             |
| SM3 | 支持     | 支持         | 摘要与 HMAC                                                           |
| SM4 | 支持     | 支持         | ECB/CBC/CTR/CFB/OFB/GCM/CCM，AEAD 需传递 tag/AAD                       |
| ZUC | 支持     | 支持         | ZUC-128、标准 EEA3 消息加密、EIA3 MAC；保留旧密钥流入口，不支持 ZUC-256             |
| SM9 | 支持     | 不支持        | 仅 Java 侧通过 `gmkit-sm9` + `gmkit-sm9-native-*` JNI/GmSSL runtime 交付 |
| SHA | JDK 自带 | 支持         | TS 包提供 SHA-1/256/384/512 与 HMAC；SHA-1 仅用于兼容旧系统                     |

## 统一命令

```bash
npm ci
npm run verify          # TS type-check/test/build + Java reactor test + parity；不含 lint/pack/docs
npm run test:ts
npm run test:java
npm run parity
npm run build:ts
npm run docs:build
npm run studio:type-check
npm run studio:build    # 构建 GMKit Studio V5 工具站
```

Java 单独校验：

```bash
mvn -f packages/java/pom.xml -B -ntp test
mvn -f packages/java/pom.xml -B -ntp -Prelease "-Dgpg.skip=true" -DskipTests verify
```

SM9 Java native runtime 可在需要时本地构建：

```powershell
./scripts/sm9-native.ps1 -Platform current -Stage -PackageRuntime -Test
```

普通本地验收不要求 GmSSL/JNI。正式发布由 `sm9-native.yml` 在 GitHub Actions 的 Linux、macOS、Windows 矩阵中构建 runtime，并用 `-Dgmkit.sm9.requireNative=true` 强制测试；本地脚本仅用于维护者调试。

## CI 与发布标签

- `ci.yml`：TS 与普通 Java 测试；不强制 SM9 native。
- `parity.yml`：运行共享 `vectors/interop.json` 互操作校验。
- `sm9-native.yml`：在 Linux、macOS、Windows 上编译 GmSSL/JNI runtime 并强制运行 SM9 native 测试。
- `docs.yml`：构建 TypeScript 包与 VuePress 文档，并执行 Node/Go/Python/Rust/Hutool 文档 fixture；不构建 Studio。
- `publish-ts.yml`：`ts-v*` 标签发布 npm 包。
- `publish-java.yml`：`java-v*` 标签验证 release、构建各平台 `gmkit-sm9-native-*` runtime，并在凭据完整时发布 Maven Central。

## 文档入口

- [TypeScript 包说明](packages/ts/README.md)
- [Java 包说明](packages/java/README.md)
- [共享向量说明](vectors/README.md)
- [API 稳定性策略](docs/API_STABILITY.md)
- [VuePress 技术文档](packages/ts-docs/README.md)
- [GMKit Studio V5 工具站](apps/gmkit-studio/README.md)

## 许可证

Apache License 2.0，见 [LICENSE](LICENSE)。
