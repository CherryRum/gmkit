# Java CI、SM9 Native 与发布工作流

本文以 `.github/workflows/*.yml` 当前内容为准，说明 Java 代码、跨语言向量和 SM9 聚合 runtime 分别由哪条工作流验证。

## 工作流矩阵

| 工作流 | 触发 | 当前验证 |
|:--|:--|:--|
| `ci.yml` | 相关路径 push/PR、手动 | Java 在 JDK 8/11/17/21/25 上执行 Maven reactor 测试；不强制 SM9 native |
| `parity.yml` | Java/TS/vector 变更、手动 | Java 在 JDK 17/21/25、TS 在 Node 20/22 消费共享向量 |
| `sm9-native.yml` | SM9/native 变更、手动 | 5 个平台分别构建 GmSSL/JNI、打包 `gmkit-sm9` 并强制测试 |
| `release.yml` | 手动 | 从源码版本创建 `java-v*` 或 `ts-v*` 标签，并显式启动对应发布工作流 |
| `publish-java.yml` | `java-v*`、手动 | 聚合 5 平台 runtime、5 平台消费同一个 JAR、签名审计并自动发布 Maven Central |
| `docs.yml` | TS/docs 变更、手动 | 构建 TS，运行文档审计和 Go/Python/Rust/Hutool/Node fixture |

## 普通 Java CI

`ci.yml` 执行：

```bash
mvn -f packages/java/pom.xml -B -ntp test
```

该命令验证 Maven reactor 和 Java API。没有 native runtime 时，SM9 native 用例可以通过 JUnit assumptions 跳过，因此普通 CI 变绿不能证明 SM9 平台交付可用。

## SM9 Native 强制验证

`sm9-native.yml` 固定经过审计的 GmSSL commit，通过 `scripts/sm9-native.ps1` 构建并测试：

| runtime 标识 | GitHub runner |
|:--|:--|
| `linux-x86_64` | `ubuntu-latest` |
| `linux-aarch64` | `ubuntu-24.04-arm` |
| `darwin-x86_64` | `macos-15-intel` |
| `darwin-aarch64` | `macos-14` |
| `windows-x86_64` | `windows-2022` |

脚本以 `-Dgmkit.sm9.requireNative=true` 语义强制运行 native 测试。任一平台构建、加载或算法测试失败都会使矩阵失败。未列入矩阵的平台不属于已验证发布范围。日常 `sm9-native.yml` 验证各平台本地产物；正式发布还会把五份产物聚合进同一个 JAR 后再次执行消费测试。

本地只在需要调试 JNI 时运行：

```powershell
pwsh ./scripts/sm9-native.ps1 -Platform current -Stage -PackageRuntime -Test
```

普通开发和主包测试不要求本机安装 CMake、编译器或 GmSSL。

## Java 发布流程

新版本只使用 `java-v<project version>` 标签。无语言前缀的 `v*` 和 TypeScript 的 `ts-v*` 都不会触发 Java 发布。推荐从默认分支运行统一 Release 工作流，它会读取 POM 版本、创建 annotated tag，并以该 tag 为 ref 启动 Java 发布：

```powershell
gh workflow run release.yml --repo gmkits/gmkit --ref main -f target=java -f publish=true
```

在 Actions 页面手动运行时，选择 `target=java` 并勾选 `publish`。不勾选时只核对版本、目标 tag 和发布工作流，不创建 tag，也不发布。Release 工作流使用仓库自带的短期 `GITHUB_TOKEN`，无需新增 PAT；它会显式 dispatch 发布工作流，因为 Actions 使用 `GITHUB_TOKEN` 推送的 tag 不会再次触发普通 push 工作流。

发布工作流按以下阶段执行：

1. 核对标签版本与 `packages/java/pom.xml`，执行普通 Java 测试、Java/TS parity 和 release verify。
2. 在 5 个 runner 构建并测试 GmSSL/JNI，把每个平台的两个动态库上传为临时构建产物。
3. 下载五份产物，组装包含十个动态库、固定 GmSSL commit、平台清单和 SHA-256 的单一 `gmkit-sm9` JAR。
4. 向临时 file repository 部署并审计制品；只允许 `gmkit-parent`、`gmkit-bom`、`gmkit`、`gmkit-sm9`，`gmkit-benchmarks` 不发布。
5. 在五个平台分别消费同一个聚合 JAR，强制执行 SM9 签名、验签、加密、解密和资源释放测试。
6. 校验 Maven Central/GPG 凭据，对 sources、Javadoc、POM、许可证、native 清单和签名做最终审计，然后使用 Central Publishing Portal 自动发布。

标签发布缺少任一 Central/GPG 凭据时直接失败，不允许成功跳过。直接手动触发 `publish-java.yml` 时，默认只运行构建与消费验证；只有选择现有 `java-v*` tag 作为 ref 并显式勾选 `publish` 才执行正式 Central 发布。正常发版应使用上面的统一 Release 工作流自动创建 tag 和传递参数。

## 发布凭据

正式发布 job 固定使用 GitHub Environment `maven-central`，并从该 Environment 读取以下四个 secret：

- `CENTRAL_TOKEN_USERNAME`
- `CENTRAL_TOKEN_PASSWORD`
- `MAVEN_GPG_PRIVATE_KEY`
- `MAVEN_GPG_PASSPHRASE`

其中 Central 用户名/密码必须使用 [Central Publishing Portal](https://central.sonatype.com/) 生成的 User Token，不能使用网站登录密码；GPG 私钥必须与 Maven 签名公钥匹配，并且能用所填 passphrase 非交互解锁。

仓库管理员可用 GitHub CLI 创建 Environment：

```powershell
gh auth status
gh api --method PUT repos/gmkits/gmkit/environments/maven-central
```

前三个单行 secret 可逐个执行命令并按提示输入。`gh` 只回显 secret 名称，不允许读回明文：

```powershell
gh secret set CENTRAL_TOKEN_USERNAME --env maven-central --repo gmkits/gmkit
gh secret set CENTRAL_TOKEN_PASSWORD --env maven-central --repo gmkits/gmkit
gh secret set MAVEN_GPG_PASSPHRASE --env maven-central --repo gmkits/gmkit
```

ASCII-armored 私钥是多行文本，应从文件通过标准输入写入，避免放进命令参数、PowerShell 历史或临时文件：

```powershell
Get-Content -Raw -LiteralPath C:\secure\gmkit-private-key.asc |
    gh secret set MAVEN_GPG_PRIVATE_KEY --env maven-central --repo gmkits/gmkit
```

最后只核对名称和更新时间，不在日志中打印真实值：

```powershell
gh secret list --env maven-central --repo gmkits/gmkit
```

这四项必须配置为 Environment **secret**，不能配置成 Actions variable，因为 `publish-java.yml` 使用 `secrets.*` 读取。凭据不写入 POM、仓库脚本、测试输出或文档样例，也不要通过 issue、PR 或聊天消息传递。

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
