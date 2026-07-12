---
title: TypeScript 发布流程
icon: upload
order: 9
category: [开发指南, 发布]
tag: [npm, GitHub Actions, Provenance]
---

# TypeScript 发布流程

本文与 `.github/workflows/publish-ts.yml` 对齐。Monorepo 的 TypeScript 发布标签使用 `ts-v<package version>`；工作流暂时兼容旧 `v*` 标签，但新发布不要继续创建无语言前缀标签。

## 产物

| 格式 | 文件 | 入口 |
|:--|:--|:--|
| ESM | `dist/index.js` | `exports.import` |
| CommonJS | `dist/index.cjs` | `exports.require` |
| IIFE | `dist/index.global.js` | 全局 `GMKit` |
| 类型 | `dist/index.d.ts` | `types` |

发布包只包含 `dist`、`README.md`、`LICENSE`。源码、测试、docs 和 Studio 不进入 npm tarball。

## 发布前检查

1. 同步 `packages/ts/package.json`、根版本记录和 `CHANGELOG.md`。
2. 保留旧顶层兼容 API，breaking change 必须单独评估，不在小版本静默删除。
3. 从仓库根执行：

```bash
npm ci
npm run type-check -w packages/ts
npm test -w packages/ts
npm run lint -w packages/ts
npm run build -w packages/ts
npm run audit:pack -w packages/ts
npm run parity
npm run docs:check
npm run docs:build
```

跨语言文档有变化时还需执行 `npm run docs:test-examples`。

## 标签与自动发布

假设 `packages/ts/package.json` 为 `0.10.0-preview.1`：

```bash
git tag ts-v0.10.0-preview.1
git push origin ts-v0.10.0-preview.1
```

工作流会核对标签版本与 package version，执行 type-check、测试、构建和 pack 审计。版本包含 `-` 时发布到 npm `preview` tag，否则发布到 `latest`。配置 `NPM_TOKEN` 时执行带 provenance 的发布；缺少 token 时只完成验证并明确跳过发布。

## 发布后验证

不要直接用浮动 `latest` 做首次验收。创建空目录，安装刚发布的精确版本并验证 ESM/CJS：

```bash
npm init -y
npm install gmkitx@0.10.0-preview.1
node --input-type=module -e "import { sm3Digest } from 'gmkitx'; if (sm3Digest('abc') !== '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') process.exit(1)"
node -e "const { sm3Digest } = require('gmkitx'); if (sm3Digest('abc') !== '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') process.exit(1)"
```

再检查 npm 页面 provenance、dist-tag、tarball 文件列表和 CDN 的精确版本 URL。

## 回滚

npm 已发布版本不可覆盖。发现问题时：

1. 视影响使用 `npm deprecate gmkitx@<bad-version> "reason"` 标记。
2. 修复后发布新版本，不重写已有 tag 或 tarball。
3. 若泄露 token 或密钥，立即吊销并按安全事件处理，不只撤销版本。

- [项目发布精简清单](/dev/PROJECT-SLIMMING-CHECKLIST.zh-CN)
- [安全状态](/summaries/SECURITY-SUMMARY)
