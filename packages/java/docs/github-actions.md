# GitHub Actions 使用说明

## 工作流一览

| 工作流                     | 文件                                              | 作用                                                       | 触发方式                          |
|-------------------------|-------------------------------------------------|----------------------------------------------------------|-------------------------------|
| CI                      | `.github/workflows/ci.yml`                      | 运行 JDK 8/11/17 测试矩阵，并在 JDK 17 上执行 `verify`               | push、pull_request             |
| Parity                  | `.github/workflows/parity.yml`                  | 运行 Java / TypeScript 共享互操作向量校验                     | push、pull_request、手动触发       |
| SM9 Native              | `.github/workflows/sm9-native.yml`              | 在 Linux/macOS/Windows runner 编译 GmSSL/JNI 并强制运行 SM9 native 测试 | 手动触发、相关路径变更             |
| Publish Java            | `.github/workflows/publish-java.yml`            | 发布 Java artifacts 到 GitHub Packages / Maven Central       | `java-v*` tag、手动触发            |

## 触发策略

- `ci.yml` 会在所有 push 和 PR 上执行，作为日常代码校验。
- `ci.yml` 不强制运行 SM9 native 测试；没有 native runtime 时，SM9 相关测试通过 JUnit assumptions 跳过。
- `sm9-native.yml` 是唯一强制 GmSSL/JNI native 可用性的工作流；本地普通测试不要求安装 CMake/GmSSL。
- `publish-java.yml` 使用 `java-v*` 标签发布正式版本，并可手动发布快照或执行 release 校验。

## 必要 Secrets

### GitHub Packages

- 不需要额外自定义 secret，工作流直接使用 GitHub 自带的 `GITHUB_TOKEN`。

### Maven Central

请在仓库 `Settings -> Secrets and variables -> Actions` 中配置以下 secrets：

- `CENTRAL_TOKEN_USERNAME`
  Sonatype Central Portal 生成的 user token username。
- `CENTRAL_TOKEN_PASSWORD`
  Sonatype Central Portal 生成的 user token password。
- `MAVEN_GPG_PRIVATE_KEY`
  ASCII armored 的 GPG 私钥全文。
- `MAVEN_GPG_PASSPHRASE`
  对应私钥的口令。

## 发布前准备

1. 确认 `packages/java/pom.xml` 里的版本号正确。
2. 发布 Maven Central 前，把版本改成非 `-SNAPSHOT`，例如 `0.10.0-preview.0`。
3. 如果需要，同时创建与版本对应的 Git tag，例如 `java-v0.10.0-preview.0`。
4. 先执行 `Release Verify`，确认 sources/javadocs 构建正常。
5. 再执行 `Publish Maven Central`；发布 workflow 会先调用 `scripts/sm9-native.ps1` 构建各平台 runtime。

## 本地命令对照

```bash
# 日常校验
mvn -f packages/java/pom.xml clean test
mvn -f packages/java/pom.xml -DskipTests verify

# release 构建校验（本地跳过 GPG）
mvn -f packages/java/pom.xml -Prelease -Dgpg.skip=true -DskipTests verify

# SM9 native 平台校验交给 GitHub Actions；本地只在已安装 CMake/编译器时可选执行
pwsh ./scripts/sm9-native.ps1 -Platform current -Stage -PackageRuntime -Test

# 发布到 GitHub Packages
mvn -f packages/java/pom.xml -DskipTests deploy \
  -DaltDeploymentRepository=github::default::https://maven.pkg.github.com/gmkits/gmkit

# 发布到 Maven Central
mvn -f packages/java/pom.xml -Prelease -DskipTests deploy
```

如果你在 Windows PowerShell 里本地执行 release 校验，请改用下面这条，避免 `-Dgpg.skip=true` 被 PowerShell 错误拆分：

```powershell
mvn -f packages/java/pom.xml -Prelease "-Dgpg.skip=true" -DskipTests verify
```

## 说明

- 当前 workflow 默认分支按仓库现状使用 `main`。
- GitHub Packages 发布仓库地址固定为 `https://maven.pkg.github.com/gmkits/gmkit`。
- 普通 Java CI 只要求 `gmkit`、`gmkit-sm9` Java API 编译和可跳过测试通过；SM9 native runtime 只在 `sm9-native.yml` 中强制。
- `sm9-native.yml` 使用 `scripts/sm9-native.ps1` 统一构建 GmSSL 与 `gmkitsm9`，当前矩阵覆盖 `linux-x86_64`、`linux-aarch64`、`darwin-x86_64`、`darwin-aarch64`、`windows-x86_64`。
- Maven Central 发布基于 Sonatype 官方 `central-publishing-maven-plugin`，并使用 `setup-java` 动态生成 `settings.xml` 与导入 GPG key。
