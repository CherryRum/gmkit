# GMKit Studio V5 工具站

GMKit Studio 是 monorepo 内的 Vue3 + Vite + TypeScript 工具站应用。V5 不再是产品展示页，而是面向开发者的在线工具体验：顶部搜索、左侧分类、中间工具网格/工作台、右侧预留投放 rail。

## 结构

- 首页只显示最近使用或常用工具，不重复渲染分类分组。
- 分类使用 query 驱动，例如 `/?category=crypto`。
- 工具统一使用 `/tools/:toolId` 路由。
- 最近使用保存在 `localStorage: gmkit_recent_tools_v5`，最多 8 个。
- 右侧 rail 仅保留空槽位，不包含广告文案。

## 工具能力

- GMKit：SM2、SM3、SM4、ZUC 使用 workspace 依赖 `gmkitx` 真实执行。
- SM9：不在 TypeScript 中实现；保留 Java API / WASM runtime 边界，未配置时直接报错。
- JSON：专用 `JsonWorkspace` + Web Worker，支持格式化、压缩、校验、修复、JSONPath、Schema、树视图和错误行列定位。
- 通用工具：AES/RSA/PBKDF2、3DES、摘要、编码、JWT、YAML/TOML、Mock、UUID/ULID/Cron、文本处理、CIDR/UA/DNS/cURL 等均通过浏览器 API 或依赖真实执行。
- 网络工具会发真实请求；请求失败时展示错误，不返回 mock 成功。

## 命令

```bash
npm run dev -w apps/gmkit-studio
npm run type-check -w apps/gmkit-studio
npm run test:unit -w apps/gmkit-studio
npm run build -w apps/gmkit-studio
```

根目录快捷命令：

```bash
npm run studio:dev
npm run studio:type-check
npm run studio:build
```

## 说明

- V5 视觉参考 `gmkit-studio-clean-vue-redesign-v5.html`，但实现是组件化 Vue 工程，不复制静态 HTML。
- `curlconverter` 会按需动态加载；构建时可能出现其 `web-tree-sitter` 相关 warning，不影响构建退出码。
