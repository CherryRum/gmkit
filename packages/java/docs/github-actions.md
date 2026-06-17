# GitHub Actions 使用说明

## 工作流一览

| 工作流                     | 文件                                              | 作用                                                       | 触发方式                          |
|-------------------------|-------------------------------------------------|----------------------------------------------------------|-------------------------------|
| CI                      | `.github/workflows/ci.yml`                      | 运行 JDK 8/11/17 测试矩阵，并在 JDK 17 上执行 `verify`               | push、pull_request             |
| Release Verify          | `.github/workflows/release-verify.yml`          | 检查 release profile 是否能正常生成 sources/javadocs/signing 所需产物 | 手动触发、`v*` tag push            |
| Publish GitHub Packages | `.github/workflows/publish-github-packages.yml` | 发布到 GitHub Packages Maven 仓库                             | 手动触发、`main` push              |
| Publish Maven Central   | `.github/workflows/publish-maven-central.yml`   | 发布到 Sonatype Central Portal / Maven Central              | 手动触发、GitHub Release published |

## 触发策略

- `ci.yml` 会在所有 push 和 PR 上执行，作为日常代码校验。
- `release-verify.yml` 默认不自动跑在每次提交上，避免 release 构建把 CI 拉长；需要时可手动点，也可在推送 `v*` 标签时自动验证。
- `publish-github-packages.yml` 在 `main` 上只会自动发布 `-SNAPSHOT` 版本；如果当前版本不是 `-SNAPSHOT`，工作流会直接跳过并给出提示。
- `publish-maven-central.yml` 会强制检查版本不能以 `-SNAPSHOT` 结尾，否则直接失败。

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

1. 确认 `pom.xml` 里的版本号正确。
2. 发布 Maven Central 前，把版本改成非 `-SNAPSHOT`，例如 `0.9.4`。
3. 如果需要，同时创建与版本对应的 Git tag，例如 `v0.9.4`。
4. 先执行 `Release Verify`，确认 sources/javadocs 构建正常。
5. 再执行 `Publish Maven Central`。

## 本地命令对照

```bash
# 日常校验
mvn clean test
mvn -DskipTests verify

# release 构建校验（本地跳过 GPG）
mvn -Prelease -Dgpg.skip=true -DskipTests verify

# 发布到 GitHub Packages
mvn -DskipTests deploy \
  -DaltDeploymentRepository=github::default::https://maven.pkg.github.com/gmkits/gmkit-java

# 发布到 Maven Central
mvn -Prelease -DskipTests deploy
```

如果你在 Windows PowerShell 里本地执行 release 校验，请改用下面这条，避免 `-Dgpg.skip=true` 被 PowerShell 错误拆分：

```powershell
mvn -Prelease "-Dgpg.skip=true" -DskipTests verify
```

## 说明

- 当前 workflow 默认分支按仓库现状使用 `main`。
- GitHub Packages 发布仓库地址固定为 `https://maven.pkg.github.com/gmkits/gmkit-java`。
- Maven Central 发布基于 Sonatype 官方 `central-publishing-maven-plugin`，并使用 `setup-java` 动态生成 `settings.xml` 与导入 GPG key。
