# Java CI、SM9 Native 与发布工作流

本文以 `.github/workflows/*.yml` 当前内容为准，说明 Java 代码、跨语言向量和 SM9 平台 runtime 分别由哪条工作流验证。

## 工作流矩阵

| 工作流 | 触发 | 当前验证 |
|:--|:--|:--|
| `ci.yml` | 相关路径 push/PR、手动 | Java 在 JDK 8/11/17/21/25 上执行 Maven reactor 测试；不强制 SM9 native |
| `parity.yml` | Java/TS/vector 变更、手动 | Java 在 JDK 17/21/25、TS 在 Node 20/22 消费共享向量 |
| `sm9-native.yml` | SM9/native 变更、手动 | 5 个平台构建 GmSSL/JNI、打包 runtime 并强制测试 |
| `publish-java.yml` | `java-v*`、历史 `v*`、手动 | release verify、5 平台 runtime 构建、GitHub Packages dry-run、按 secrets 发布 Maven Central |
| `docs.yml` | TS/docs 变更、手动 | 构建 TS，运行文档审计和 Go/Python/Rust/Hutool/Node fixture |

## 普通 Java CI

`ci.yml` 执行：

```bash
mvn -f packages/java/pom.xml -B -ntp test
```

该命令验证 Maven reactor 和 Java API。没有 native runtime 时，SM9 native 用例可以通过 JUnit assumptions 跳过，因此普通 CI 变绿不能证明 SM9 平台交付可用。

## SM9 Native 强制验证

`sm9-native.yml` 固定 `GmSSL v3.1.1`，通过 `scripts/sm9-native.ps1` 构建并测试：

| runtime 标识 | GitHub runner |
|:--|:--|
| `linux-x86_64` | `ubuntu-latest` |
| `linux-aarch64` | `ubuntu-24.04-arm` |
| `darwin-x86_64` | `macos-15-intel` |
| `darwin-aarch64` | `macos-14` |
| `windows-x86_64` | `windows-2022` |

脚本以 `-Dgmkit.sm9.requireNative=true` 语义强制运行 native 测试。任一平台构建、加载或算法测试失败都会使矩阵失败。未列入矩阵的平台不属于已验证发布范围。

本地只在需要调试 JNI 时运行：

```powershell
pwsh ./scripts/sm9-native.ps1 -Platform current -Stage -PackageRuntime -Test
```

普通开发和主包测试不要求本机安装 CMake、编译器或 GmSSL。

## Java 发布流程

新版本使用 `java-v<project version>` 标签。`publish-java.yml` 仍接受历史 `v*` 标签，但不应继续创建无语言前缀的新标签。

发布工作流按以下阶段执行：

1. 核对标签版本与 `packages/java/pom.xml`。
2. 在 JDK 17 执行 `-Prelease -Dgpg.skip=true -DskipTests verify`，验证 sources、Javadoc、Java 8 API 基线等 release 产物。
3. 在 5 个 runner 构建和测试 SM9 native resources，并上传临时 artifact。
4. 下载平台 resources，以文件仓库执行 GitHub Packages deploy dry-run，检查全部 artifact 可部署。
5. secrets 完整时使用 `native-modules,release` profile 发布 Maven Central；缺少 secrets 时明确跳过。

当前 workflow 不直接向 GitHub Packages 远程仓库发布，只执行 deploy artifact dry-run。文档和发布说明不能把该阶段描述成已经上传 GitHub Packages。

## 发布凭据

Maven Central 需要：

- `CENTRAL_TOKEN_USERNAME`
- `CENTRAL_TOKEN_PASSWORD`
- `MAVEN_GPG_PRIVATE_KEY`
- `MAVEN_GPG_PASSPHRASE`

凭据只配置在 GitHub Actions secrets，不写入 POM、仓库脚本、测试输出或文档样例。

## 本地 release 验证

```bash
mvn -f packages/java/pom.xml -B -ntp test
mvn -f packages/java/pom.xml -B -ntp -Prelease -Dgpg.skip=true -DskipTests verify
```

Windows PowerShell 可将包含点号的 Maven 属性作为单独字符串传入：

```powershell
mvn -f packages/java/pom.xml -B -ntp -Prelease "-Dgpg.skip=true" -DskipTests verify
```

发布前还需运行 `npm run parity`，并在 GitHub 上确认 SM9 native 矩阵全部成功。不要用本机单一平台测试替代发布矩阵。
