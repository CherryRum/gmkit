---
title: 发布精简与内容审计清单
icon: checklist
order: 10
category: [开发指南, 发布维护]
tag: [npm pack, 文档审计]
---

# 发布精简与内容审计清单

本页不是一次性内部删除清单，而是每次 npm/文档发布前可重复执行的维护记录。目标是控制发布包内容和文档准确性，不通过删除有价值页面规避验证。

## 自动检查

```bash
npm run docs:check
npm run docs:test-examples
npm run docs:build
npm run audit:pack -w packages/ts
```

| 检查 | 失败含义 |
|:--|:--|
| `docs:check` | 站内链接、导航、仓库引用或核心 API 文档不一致 |
| `docs:test-examples` | Node/Go/Python/Rust/Hutool 示例无法运行或向量不符 |
| `docs:build` | VuePress 配置、Markdown 或主题构建失败 |
| `audit:pack` | npm tarball 超出体积/文件策略 |

## 人工检查

- 每个算法页说明 key、IV/nonce、模式、填充、输入输出编码和错误语义。
- 随机算法示例验证往返/验签，不比较随机字面值。
- 外部库写明精确版本、实现来源和验证范围，不包装成 gmkitx API。
- 性能结论有环境、命令和原始结果，不发布“典型值”。
- 文档没有真实密钥、token、内部 endpoint、个人目录或构建缓存。
- 旧 API 若仍为兼容面，文档标为 deprecated 而不是假装已删除。

## npm tarball

`packages/ts/package.json#files` 应只允许：

```text
dist/
README.md
LICENSE
```

通过 `npm run audit:pack -w packages/ts` 查看实际清单。不要只依赖 `.npmignore`，`files` 白名单是发布边界。

## 版本发布最小结论

只有以下检查全部成功后才创建 `ts-v*` 标签：TS 类型/测试/lint/build、pack 审计、Java/TS parity、docs check/build，以及本次修改涉及的外部语言 fixture。失败项不能以“示例页不重要”为理由跳过。

- [TypeScript 发布流程](/dev/PUBLISHING)
- [项目状态](/summaries/PROJECT_SUMMARY)
