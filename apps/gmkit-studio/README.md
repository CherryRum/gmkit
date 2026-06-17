# GMKit Studio V4 静态原型

这是放在 monorepo `apps/` 下的 GMKit Studio 产品原型。技术栈保持为静态 HTML/CSS/JS，便于直接打开、审阅和后续迁移到 Vue 3 或 React。

## 本次升级重点
- 更精致的卡片样式：增加更柔和的层级、顶部高光、玻璃感与更细的阴影
- 更细的图标体系：统一的小型图标容器与渐变底色
- 更像设计稿：整体留白更舒适，主视觉、面板、按钮、标签和输入框更统一
- 保持一级分类左侧导航：首页、加密解密、摘要哈希、密钥与证书、编码转换、开发调试、数据与生成、关于项目

## 本地运行

```bash
npm run build -w apps/gmkit-studio
npm run dev -w apps/gmkit-studio
```

也可以直接打开 `index.html` 查看。`build` 脚本会校验页面、静态资源和本地链接，避免原型文件在 CI 中静默失效。

## 页面清单
- index.html
- sm2.html
- sm3.html
- sm4.html
- sm9.html
- zuc.html
- key-tools.html
- cert-tools.html
- encoding-tools.html
- api-playground.html
- data-tools.html
- about.html

## 工程边界

- 不依赖 Vue/Vite/React，当前阶段只交付完整静态原型。
- `assets/styles.css` 承载统一视觉系统，`assets/app.js` 只保留页签和复制按钮等轻交互。
- `CODEX_GOAL_GMKit_Studio_V4.md` 保留为后续工程化迁移的验收说明。
