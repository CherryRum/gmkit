# GMKit Vue 3 演示 - 开发指南

本文档提供详细的开发指南，帮助您扩展和维护 GMKit Vue 3 演示应用。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 项目结构说明

```
demo-vue/
├── src/
│   ├── App.vue              # 根组件，定义全局样式
│   ├── main.ts              # 应用入口，配置 Vue、Router、Pinia
│   ├── views/               # 页面视图组件
│   │   └── HomeView.vue     # 首页，展示工具分类
│   ├── router/              # 路由配置
│   │   └── index.ts         # 路由定义
│   ├── stores/              # Pinia 状态管理
│   ├── components/          # 可复用组件（待扩展）
│   └── assets/              # 静态资源（CSS、图片等）
├── public/                   # 公共静态文件
├── index.html               # HTML 模板
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目配置和依赖
```

## 添加新的算法工具页面

### 1. 创建视图组件

在 `src/views/` 目录下创建新的 `.vue` 文件，例如 `SM2View.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { generateKeyPair, sign, verify } from 'gmkitx'

const privateKey = ref('')
const publicKey = ref('')
const message = ref('Hello, SM2!')
const signature = ref('')

const generateKeys = () => {
  const keyPair = generateKeyPair()
  privateKey.value = keyPair.privateKey
  publicKey.value = keyPair.publicKey
}

const signMessage = () => {
  if (!privateKey.value || !message.value) return
  signature.value = sign(message.value, privateKey.value)
}
</script>

<template>
  <div class="tool-page">
    <h1>SM2 椭圆曲线算法</h1>
    
    <section class="tool-section">
      <h2>密钥生成</h2>
      <button @click="generateKeys">生成密钥对</button>
      
      <div class="form-group">
        <label>私钥：</label>
        <input v-model="privateKey" readonly />
      </div>
      
      <div class="form-group">
        <label>公钥：</label>
        <input v-model="publicKey" readonly />
      </div>
    </section>
    
    <section class="tool-section">
      <h2>数字签名</h2>
      <div class="form-group">
        <label>消息：</label>
        <textarea v-model="message"></textarea>
      </div>
      
      <button @click="signMessage">签名</button>
      
      <div class="form-group">
        <label>签名：</label>
        <input v-model="signature" readonly />
      </div>
    </section>
  </div>
</template>

<style scoped>
.tool-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
}

.tool-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin: 15px 0;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}

input, textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-family: monospace;
}

button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
</style>
```

### 2. 添加路由

在 `src/router/index.ts` 中添加路由：

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/sm2',
      name: 'sm2',
      component: () => import('../views/SM2View.vue'),
    },
    // 添加更多路由...
  ],
})

export default router
```

### 3. 更新首页工具列表

在 `src/views/HomeView.vue` 中更新 `navigateToTool` 函数：

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateToTool = (route: string) => {
  router.push(route)
}
```

## 添加新的工具分类

在 `src/views/HomeView.vue` 的 `categories` 数组中添加：

```typescript
const categories = ref<ToolCategory[]>([
  // ... 现有分类
  {
    id: 'encoding',
    name: '📝 编码工具',
    icon: '🔤',
    description: '各种编码和解码工具',
    tools: [
      {
        id: 'base64',
        name: 'Base64 编解码',
        description: 'Base64 编码和解码',
        route: '/encoding/base64'
      },
      {
        id: 'hex',
        name: '十六进制转换',
        description: '十六进制与文本互转',
        route: '/encoding/hex'
      }
    ]
  }
])
```

## 使用 Pinia 状态管理

### 1. 创建 Store

在 `src/stores/` 目录下创建新的 store 文件：

```typescript
// src/stores/crypto.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCryptoStore = defineStore('crypto', () => {
  // 状态
  const keyPairs = ref<Map<string, any>>(new Map())
  
  // 操作
  const saveKeyPair = (id: string, keyPair: any) => {
    keyPairs.value.set(id, keyPair)
  }
  
  const getKeyPair = (id: string) => {
    return keyPairs.value.get(id)
  }
  
  return {
    keyPairs,
    saveKeyPair,
    getKeyPair,
  }
})
```

### 2. 在组件中使用

```vue
<script setup lang="ts">
import { useCryptoStore } from '@/stores/crypto'

const cryptoStore = useCryptoStore()

const saveKeys = () => {
  cryptoStore.saveKeyPair('sm2-main', {
    privateKey: '...',
    publicKey: '...'
  })
}
</script>
```

## 创建可复用组件

在 `src/components/` 目录下创建组件：

```vue
<!-- src/components/KeyPairDisplay.vue -->
<script setup lang="ts">
interface Props {
  privateKey: string
  publicKey: string
}

defineProps<Props>()
</script>

<template>
  <div class="keypair-display">
    <div class="key-item">
      <label>私钥：</label>
      <input :value="privateKey" readonly />
    </div>
    <div class="key-item">
      <label>公钥：</label>
      <input :value="publicKey" readonly />
    </div>
  </div>
</template>

<style scoped>
.keypair-display {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.key-item {
  margin: 10px 0;
}
</style>
```

## 样式规范

### 全局变量

在 `src/App.vue` 中定义的 CSS 变量：

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #4caf50;
  --warning-color: #ff9800;
  --error-color: #f44336;
  --text-color: #333;
  --border-color: #e0e0e0;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 15px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.2);
}
```

### 使用示例

```css
.my-button {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  box-shadow: var(--shadow-md);
}
```

## 性能优化建议

### 1. 路由懒加载

```typescript
{
  path: '/sm2',
  name: 'sm2',
  component: () => import('../views/SM2View.vue'),
}
```

### 2. 按需导入 GMKit

```typescript
// 只导入需要的函数
import { digest } from 'gmkitx'

// 而不是
import * as gmkit from 'gmkitx'
```

### 3. 使用 computed 缓存计算结果

```typescript
import { computed } from 'vue'

const formattedKey = computed(() => {
  return privateKey.value.toUpperCase()
})
```

## 测试

### 单元测试

```typescript
// src/components/__tests__/KeyPairDisplay.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KeyPairDisplay from '../KeyPairDisplay.vue'

describe('KeyPairDisplay', () => {
  it('renders private and public keys', () => {
    const wrapper = mount(KeyPairDisplay, {
      props: {
        privateKey: 'abc123',
        publicKey: 'def456'
      }
    })
    
    expect(wrapper.text()).toContain('abc123')
    expect(wrapper.text()).toContain('def456')
  })
})
```

运行测试：

```bash
npm run test:unit
```

## 构建和部署

### 构建

```bash
npm run build
```

构建输出在 `dist/` 目录。

### 部署到 GitHub Pages

在项目根目录创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd demo-vue
          npm install
      
      - name: Build
        run: |
          cd demo-vue
          npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./demo-vue/dist
```

## 常见问题

### 1. TypeScript 类型错误

确保在 `tsconfig.json` 中正确配置路径别名：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2. Vite 热更新不工作

检查 `vite.config.ts` 配置：

```typescript
export default defineConfig({
  server: {
    watch: {
      usePolling: true
    }
  }
})
```

### 3. 生产环境样式问题

确保在生产构建中包含所有 CSS：

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    postcss: './postcss.config.js'
  }
})
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

Apache 2.0 License - 详见 [LICENSE](../LICENSE) 文件
