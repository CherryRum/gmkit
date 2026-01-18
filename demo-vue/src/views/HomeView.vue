<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// 路由实例 Router instance
const router = useRouter()

const activeCategory = ref('chinese')

interface ToolCategory {
  id: string
  name: string
  icon: string
  description: string
  tools: Tool[]
}

interface Tool {
  id: string
  name: string
  description: string
  route: string
}

const categories = ref<ToolCategory[]>([
  {
    id: 'chinese',
    name: '🔐 信创国密算法',
    icon: '🇨🇳',
    description: '中国国家密码管理局发布的密码算法标准',
    tools: [
      {
        id: 'sm2',
        name: 'SM2 椭圆曲线算法',
        description: '公钥密码算法，用于数字签名、密钥交换和加密',
        route: '/sm2'
      },
      {
        id: 'sm3',
        name: 'SM3 哈希算法',
        description: '密码杂凑算法，用于数字签名和验证、消息认证码生成及验证',
        route: '/sm3'
      },
      {
        id: 'sm4',
        name: 'SM4 分组密码',
        description: '对称加密算法，用于数据加密',
        route: '/sm4'
      }
    ]
  },
  {
    id: 'international',
    name: '🌐 国际标准算法',
    icon: '🌍',
    description: '国际通用的密码算法标准',
    tools: [
      {
        id: 'aes',
        name: 'AES 加密算法',
        description: '高级加密标准（即将推出）',
        route: '/aes'
      },
      {
        id: 'rsa',
        name: 'RSA 公钥算法',
        description: 'RSA 加密和签名算法（即将推出）',
        route: '/rsa'
      },
      {
        id: 'sha',
        name: 'SHA 哈希算法',
        description: 'SHA-256/SHA-512 哈希算法（即将推出）',
        route: '/sha'
      }
    ]
  },
  {
    id: 'utils',
    name: '🧰 API 演示',
    icon: '🧪',
    description: '完整覆盖 gmkitx 全部公开 API 的演示入口',
    tools: [
      {
        id: 'all-api',
        name: '全部 API 演示',
        description: '一键运行：SM2/SM3/SM4/ZUC/SHA/工具/ASN.1',
        route: '/api'
      }
    ]
  }
])

const navigateToTool = (route: string) => {
  // 导航到工具页面 Navigate to tool page
  router.push(route)
}
</script>

<template>
  <div class="home-container">
    <div class="header">
      <h1 class="title">🔐 GMKit</h1>
      <p class="subtitle">密码算法工具集</p>
      <p class="description">
        提供中国国密算法（SM2、SM3、SM4）和国际标准算法的在线测试工具
      </p>
    </div>

    <div class="content">
      <div class="category-tabs">
        <button
          v-for="category in categories"
          :key="category.id"
          :class="['category-tab', { active: activeCategory === category.id }]"
          @click="activeCategory = category.id"
        >
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.name }}</span>
        </button>
      </div>

      <div
        v-for="category in categories"
        :key="category.id"
        v-show="activeCategory === category.id"
        class="category-content"
      >
        <div class="category-header">
          <h2>{{ category.name }}</h2>
          <p>{{ category.description }}</p>
        </div>

        <div class="tools-grid">
          <div
            v-for="tool in category.tools"
            :key="tool.id"
            class="tool-card"
            :class="{ disabled: category.id === 'international' }"
            @click="category.id !== 'international' ? navigateToTool(tool.route) : null"
          >
            <h3>{{ tool.name }}</h3>
            <p>{{ tool.description }}</p>
            <div v-if="category.id === 'international'" class="coming-soon">即将推出</div>
            <div v-else class="tool-action">点击使用 →</div>
          </div>
        </div>
      </div>
    </div>

    <footer class="footer">
      <p>
        <a href="https://github.com/CherryRum/GMKit" target="_blank">GitHub</a>
        · 基于 Vue 3 + TypeScript 构建
        · Apache 2.0 License
      </p>
    </footer>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
  padding: 40px 20px;
}

.title {
  font-size: 3em;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  animation: fadeInDown 0.6s ease-out;
}

.subtitle {
  font-size: 1.5em;
  margin-bottom: 15px;
  opacity: 0.95;
  animation: fadeInDown 0.8s ease-out;
}

.description {
  font-size: 1.1em;
  opacity: 0.9;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
  animation: fadeInDown 1s ease-out;
}

.content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.category-tabs {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

.category-tab {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 15px 30px;
  cursor: pointer;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-tab:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.category-tab.active {
  background: white;
  color: var(--primary-color);
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.category-icon {
  font-size: 1.3em;
}

.category-content {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.4s ease-out;
}

.category-header {
  margin-bottom: 30px;
}

.category-header h2 {
  font-size: 2em;
  color: var(--text-color);
  margin-bottom: 10px;
}

.category-header p {
  font-size: 1.1em;
  color: #666;
  line-height: 1.6;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.tool-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 30px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.tool-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.tool-card:hover::before {
  transform: scaleX(1);
}

.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  border-color: var(--primary-color);
}

.tool-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%);
}

.tool-card.disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: transparent;
}

.tool-card h3 {
  font-size: 1.4em;
  color: var(--text-color);
  margin-bottom: 10px;
}

.tool-card p {
  color: #555;
  line-height: 1.6;
  margin-bottom: 15px;
}

.tool-action {
  color: var(--primary-color);
  font-weight: 600;
  font-size: 0.95em;
}

.coming-soon {
  color: #999;
  font-style: italic;
  font-size: 0.9em;
}

.footer {
  text-align: center;
  color: white;
  padding: 30px 20px;
  margin-top: 40px;
  opacity: 0.9;
}

.footer a {
  color: white;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.3s;
}

.footer a:hover {
  opacity: 0.8;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2em;
  }

  .subtitle {
    font-size: 1.2em;
  }

  .category-content {
    padding: 25px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .category-tab {
    flex: 1;
    min-width: 150px;
    justify-content: center;
  }
}
</style>
