---
title: TypeScript 发布与验收
icon: upload
order: 9
category: [开发指南, 发布]
tag: [npm, GitHub Actions, Provenance]
---

# TypeScript 发布与验收

TypeScript 发布制品只对应 `ts-v<package version>` 标签。标签 push 可以直接触发 `.github/workflows/publish-ts.yml`；推荐使用统一 `release.yml` 自动创建标签并显式启动发布。无语言前缀的 `v*` 和 Java 的 `java-v*` 都不会触发 npm 发布。

## 发布产物

| 格式 | 文件 | package 入口 |
|:--|:--|:--|
| ESM | `dist/index.js` | `exports.import` |
| CommonJS | `dist/index.cjs` | `exports.require` |
| IIFE | `dist/index.global.js` | 全局 `GMKit` |
| TypeScript | `dist/index.d.ts`、`dist/index.d.cts` | `types` |
| 第三方声明 | `THIRD_PARTY_NOTICES.md` | tarball 文档 |

`packages/ts/package.json#files` 只允许 `dist`、`README.md`、`LICENSE` 和 `THIRD_PARTY_NOTICES.md`。源码、测试、文档站、fixture 和 Studio 不应进入 npm tarball。`@noble/curves` 与 `@noble/hashes` 已内联到三个 JavaScript 构建中，因此不声明为消费者运行时依赖；第三方 MIT 版权与许可证必须随 tarball 发布，类型声明不得导入 noble 类型。

## 版本准备

1. 更新 `packages/ts/package.json` 与根版本；确认 lockfile 没有非预期依赖变化。
2. 在 `CHANGELOG.md` 记录行为变化、安全修复、弃用和迁移要求。
3. 核对公开导出与 API 清单；旧兼容别名不能在小版本中静默删除。
4. 确认文档示例使用当前参数和返回结构，没有真实密钥、token 或内部地址。

## 本地完整门禁

从仓库根执行：

```bash
npm ci
npm run verify
npm run lint -w packages/ts
npm run audit:pack -w packages/ts
npm run docs:check
npm run docs:test-examples
npm run docs:build
```

`npm run verify` 包含 TS 类型/测试/构建、Java 测试和 parity，但不包含 lint、pack 审计或文档门禁，因此后续命令不能省略。
`audit:pack` 还会检查 9 个必需文件、第三方声明、source map、包体积、运行时依赖和 `.d.ts` 类型泄漏；只看压缩包大小不足以判断制品正确。

## 自动创建标签并发布

推荐从默认分支运行统一 Release 工作流。它从 `packages/ts/package.json` 读取版本，自动创建 annotated tag，再以该 tag 为 ref 显式启动 npm 发布工作流：

```powershell
gh workflow run release.yml --repo gmkits/gmkit --ref main -f target=typescript -f publish=true
```

在 Actions 页面运行时，选择 `target=typescript` 并勾选 `publish`。不勾选时只显示版本、目标 tag 和发布工作流，不创建 tag，也不发布。Release 工作流使用仓库自带的短期 `GITHUB_TOKEN`，不需要配置 PAT；它会主动 dispatch `publish-ts.yml`，避免依赖 `GITHUB_TOKEN` 推 tag 后不会递归触发 push workflow 的行为。

TypeScript 必须在同版本 Java 制品已经能从 Maven Central 解析后再发。自动 tag 工作流不会绕过这个顺序，也不会自动覆盖已存在的 tag；已有 tag 的失败发布应在 Actions 中重新运行原 publisher。

发布工作流会：

1. 核对标签版本与 `packages/ts/package.json` 完全相等；
2. 执行 type-check、单测、构建和 npm pack 审计；
3. 通过 GitHub OIDC 和 npm Trusted Publisher 使用 provenance 发布；仓库不保存长期 npm 发布令牌；
4. 预发布版本发布到 npm `preview` dist-tag，普通版本发布到 `latest`。

Trusted Publisher 未配置、OIDC 权限不足或发布失败时工作流直接失败，不会伪装成成功或跳过。完整本地门禁比 tag workflow 更广；不能因为 tag workflow 变绿就推断 parity 和文档 fixture 已在该工作流中执行，它们由其他 CI 和发布前人工门禁负责。

## npm Trusted Publisher 配置

首次使用 OIDC 发布前，需要由 `gmkitx` 包管理员在 npm 网站的 package settings 中新增 GitHub Actions Trusted Publisher。授权信息必须与工作流精确一致：

| 配置项 | 值 |
|:--|:--|
| Provider | GitHub Actions |
| Organization or user | `gmkits` |
| Repository | `gmkit` |
| Workflow filename | `publish-ts.yml` |
| Environment | 留空 |

Environment 留空是有意设计：当前 `.github/workflows/publish-ts.yml` 的 `publish` job 没有声明 GitHub Environment。如果以后给该 job 增加 Environment，npm 侧必须同步填写完全相同的名称。

仓库不需要创建 `NPM_TOKEN` secret。工作流已声明 `id-token: write`，并固定安装支持 Trusted Publishing 的 npm 12；普通版本使用 `latest`，预发布版本使用 `preview`，最终执行：

```bash
npm publish --provenance --access public --tag "$npm_tag"
```

npm 的 Trusted Publisher 授权属于 npm 包的私有设置，`gh secret list` 和 npm 公共 registry 元数据都不能证明它已经配置。创建 `ts-v<version>` 标签前，维护者需要在 npm 网站确认上述记录存在；标签触发后再从发布详情确认 provenance 指向 `gmkits/gmkit` 与 `publish-ts.yml`。

## 发布后验收

在空目录安装精确版本，不要先用浮动 `latest`：

```bash
npm init -y
npm install gmkitx@<version>
node --input-type=module -e "import { sm3Digest } from 'gmkitx'; if (sm3Digest('abc') !== '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') process.exit(1)"
node -e "const { sm3Digest } = require('gmkitx'); if (sm3Digest('abc') !== '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') process.exit(1)"
```

随后检查 npm provenance、dist-tag、tarball 文件清单和精确版本 CDN URL。IIFE 应在隔离页面中运行固定向量，而不是只确认脚本返回 200。

## 故障处理

npm 已发布版本不可覆盖：

1. 影响严重时使用 `npm deprecate gmkitx@<bad-version> "<reason>"` 标记。
2. 修复后递增版本重新发布，不重写已有 tag 或 tarball。
3. 若泄露 token 或密钥，立即吊销并按安全事件处理；删除版本不能消除已下载副本。
4. 若只发生 dist-tag 指向错误，先核对版本内容，再使用 npm dist-tag 命令修正指针。

- [发布内容审计](/dev/PROJECT-SLIMMING-CHECKLIST.zh-CN)
- [API 稳定性策略](/dev/API-SURFACE.zh-CN)
- [安全保证边界](/summaries/SECURITY-SUMMARY)
