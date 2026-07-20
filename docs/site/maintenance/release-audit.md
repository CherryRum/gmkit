---
title: 发布内容审计
description: 在发布前审计 npm 与 Maven 制品内容、文档、许可证、来源和供应链边界。
icon: checklist
order: 10
category: [项目维护, 发布]
tag: [npm pack, 文档审计, 供应链]
---

# 发布内容审计

本页是每次 TypeScript 与文档发布前可重复执行的检查表。目标是验证产物最小、内容准确和示例可复现，而不是通过删除有价值页面降低维护成本。

## 自动门禁

```bash
npm run type-check -w packages/ts
npm test -w packages/ts
npm run lint -w packages/ts
npm run build -w packages/ts
npm run audit:pack -w packages/ts
npm run test:package -w packages/ts
npm run parity
npm run docs:check
npm run docs:test-examples
npm run docs:build
```

| 门禁 | 主要失败含义 |
|:--|:--|
| type-check/lint | 公共类型或源码约束被破坏 |
| 单测/parity | 算法、边界或跨语言协议回归 |
| build | ESM/CJS/IIFE/类型产物失败或出现未知警告 |
| pack 审计 | tarball 文件、体积或 source map 策略异常 |
| tarball 消费 | 临时安装后的 ESM/CJS/IIFE、exports 或兼容别名异常 |
| docs check | 链接、导航、API、版本或 fixture 依赖声明漂移 |
| docs examples | Node/Go/Python/Rust/Hutool 示例不能从固定依赖运行 |
| docs build | VuePress 配置、Markdown 或客户端渲染构建失败 |

## npm tarball

当前白名单为：

```text
dist/
README.md
LICENSE
THIRD_PARTY_NOTICES.md
package.json
```

`package.json` 由 npm 自动包含。`audit:pack` 使用 `npm pack --json --dry-run` 检查真实清单、压缩/解压体积和 source map，而不是只相信 `.npmignore`。

人工确认 tarball 不包含：测试、benchmark、文档源码、Studio、构建缓存、真实密钥、token、内部 endpoint、个人目录或临时日志。

## 文档内容

- 每个算法页明确 key、IV/nonce、模式、填充、编码和错误语义。
- 随机算法示例检查往返/验签与篡改拒绝，不固化一次随机输出。
- 外部语言页面锁定依赖版本，并有 CI 可执行 fixture。
- 项目向量与外部标准向量明确区分，不用自身输出自证正确性。
- 性能结论附环境、commit、命令和完整结果，不发布无法复现的“典型值”。
- 兼容 API、空 userId 和 RNG 默认策略与当前代码一致。
- SM9 只在 Java/native 边界描述，不出现 TypeScript 假实现。

## 发布结论

只有所有适用门禁成功、工作区和 tag 版本核对完成后才创建 `ts-v*` 标签。任何失败都必须修复或形成公开、可评估的阻断说明，不能以“只是示例”“只是文档”跳过。

- [TypeScript 发布与验收](/maintenance/publishing)
- [验证模型与证据](/maintenance/reports/validation-model)
