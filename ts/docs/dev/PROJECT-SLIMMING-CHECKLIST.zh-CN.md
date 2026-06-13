---
title: 项目精简执行清单
icon: list-check
order: 9
author: mumu
date: 2026-02-07
category:
  - 开发指南
  - 工程治理
tag:
  - 包体积
  - 构建告警
  - 文档资产
  - 审计
---

# 项目精简执行清单

目标：在不破坏 API 兼容性的前提下，持续控制文档资产体积、构建告警与 NPM 发布包大小。

## 一次性基线

```bash
# 文档静态资产审计
npm run audit:docs:assets

# 构建（含告警策略）
npm run build

# 发布包审计（npm pack dry-run）
npm run audit:pack
```

## 日常执行顺序（推荐）

1. 改代码后先跑 `npm run build`  
   目的：确保构建成功，且只出现策略允许的已知告警。
2. 发版前跑 `npm run audit:pack`  
   目的：确认 tarball / unpacked 大小和文件列表符合预期。
3. 文档更新后跑 `npm run audit:docs:assets`  
   目的：避免超大图片或资源进入文档站点。
4. 最后跑 `npm run verify`  
   目的：类型、测试、构建、包审计全链路通过。

## 阈值与策略

- 文档单文件资产阈值：`DOC_ASSET_MAX_KB`（默认 200）
- 发布包压缩大小阈值：`PACK_MAX_KB`（默认 320）
- 发布包解压大小阈值：`UNPACKED_MAX_KB`（默认 900）
- 发布包默认不允许 `.map`：如需放开，设置 `ALLOW_SOURCEMAP=1`

示例：

```bash
PACK_MAX_KB=400 UNPACKED_MAX_KB=1200 npm run audit:pack
DOC_ASSET_MAX_KB=300 npm run audit:docs:assets
```

## 失败时处理指南

1. `audit:docs:assets` 失败  
   先压缩或替换大文件（优先 SVG/WebP），再重跑审计。
2. `build` 告警策略失败  
   新告警先定位来源，确认是否兼容性风险；必要时更新白名单策略并记录原因。
3. `audit:pack` 失败  
   先检查 `npm pack --dry-run` 的 top files，优先清理 source map、demo 产物、误入发布包的文件。

## 版本发布最小清单

- [ ] `npm run verify` 通过
- [ ] `npm run audit:docs:assets` 通过（若包含文档改动）
- [ ] `npm run audit:pack` 通过
- [ ] `npm pack --dry-run` 文件列表与预期一致
