---
title: TypeScript 发布与验收
icon: upload
order: 9
category: [开发指南, 发布]
tag: [npm, GitHub Actions, Provenance]
---

# TypeScript 发布与验收

TypeScript 包只使用 `ts-v<package version>` 标签触发 `.github/workflows/publish-ts.yml`；无语言前缀的 `v*` 和 Java 的 `java-v*` 都不会触发 npm 发布。

## 发布产物

| 格式 | 文件 | package 入口 |
|:--|:--|:--|
| ESM | `dist/index.js` | `exports.import` |
| CommonJS | `dist/index.cjs` | `exports.require` |
| IIFE | `dist/index.global.js` | 全局 `GMKit` |
| TypeScript | `dist/index.d.ts`、`index.d.cts` | `types` |

`packages/ts/package.json#files` 只允许 `dist`、`README.md` 和 `LICENSE`。源码、测试、文档站、fixture 和 Studio 不应进入 npm tarball。

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

## 标签工作流

先从清洁工作区读取版本，确认标签尚不存在：

```bash
VERSION="$(node -p "require('./packages/ts/package.json').version")"
git status --short
git tag --list "ts-v${VERSION}"
git tag "ts-v${VERSION}"
git push origin "ts-v${VERSION}"
```

tag workflow 会：

1. 核对标签版本与 `packages/ts/package.json` 完全相等；
2. 执行 type-check、单测、构建和 npm pack 审计；
3. 通过 GitHub OIDC 和 npm Trusted Publisher 使用 provenance 发布；仓库不保存长期 npm 发布令牌；
4. 预发布版本发布到 npm `preview` dist-tag，普通版本发布到 `latest`。

Trusted Publisher 未配置、OIDC 权限不足或发布失败时工作流直接失败，不会伪装成成功或跳过。完整本地门禁比 tag workflow 更广；不能因为 tag workflow 变绿就推断 parity 和文档 fixture 已在该工作流中执行，它们由其他 CI 和发布前人工门禁负责。

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
