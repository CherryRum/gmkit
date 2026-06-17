# GMKit Vue 3 演示

这是 GMKit monorepo 内的 Vue 3 + TypeScript 演示应用，用于手工验证 `gmkitx` 在浏览器侧的常见交互。

## 当前范围

- SM2：密钥生成、加密/解密、签名/验签
- SM3：摘要、HMAC、文件哈希
- SM4：ECB/CBC 等基础加解密演示

TypeScript 包不包含 SM9，也不包装 native/WASM runtime；SM9 只在 Java 侧以 `gmkit-sm9` + `gmkit-sm9-native-*` 模块交付。

## 开发命令

从仓库根目录运行：

```bash
npm ci
npm run dev -w apps/demo-vue
npm run build -w apps/demo-vue
npm run preview -w apps/demo-vue
```

## 目录结构

```text
apps/demo-vue/
├── src/
│   ├── components/     # 可复用组件
│   ├── views/          # 页面视图
│   ├── router/         # 路由配置
│   ├── stores/         # Pinia 状态管理
│   ├── App.vue         # 根组件
│   └── main.ts         # 入口文件
├── public/
└── index.html
```

## 技术栈

- Vue 3
- TypeScript
- Vue Router
- Pinia
- Vite

## 许可证

Apache License 2.0。
