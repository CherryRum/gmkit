# GMKit Studio Vue3 原型

GMKit Studio 是 monorepo 内的 Vue3 + Vite + TypeScript 产品原型，用于展示和验证 GMKit 的工具平台体验。

## 技术栈

- Vue 3 + Vue Router
- Vite 7 + TypeScript
- 自定义 CSS 视觉系统，不依赖 Element Plus / Naive UI
- `gmkitx` workspace 依赖提供浏览器端 SM2、SM3、SM4、ZUC、SHA 工具能力

## 本地命令

```bash
npm run dev -w apps/gmkit-studio
npm run type-check -w apps/gmkit-studio
npm run build -w apps/gmkit-studio
```

根目录快捷命令：

```bash
npm run studio:dev
npm run studio:type-check
npm run studio:build
```

## 页面范围

- 首页：产品级概览、能力分组和快速入口。
- 工具工作台：SM2、SM3/SHA、SM4、ZUC、SM9、密钥、证书、编码、API Playground、数据工具。
- 关于项目：Java / TypeScript 能力矩阵与 SM9 边界说明。

## 能力边界

- TypeScript 侧真实执行：SM2、SM3、SM4、ZUC、SHA、编码转换、随机数据、JSON/UUID/时间戳工具。
- SM9 不在 TypeScript 包中实现；前端只保留 `JavaApiSm9Runtime` 和 `WasmSm9Runtime` 接入边界。
- 当前证书 ASN.1 解析仍为产品原型入口，后续可接 Java API 或浏览器 parser。
