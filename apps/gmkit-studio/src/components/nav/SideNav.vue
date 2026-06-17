<template>
  <aside class="sidenav">
    <div class="sidenav-section">
      <RouterLink
        v-for="item in navItems"
        :key="item.label"
        class="side-item"
        :to="item.to"
        :class="{ active: isActive(item) }"
        @click="$emit('navigate')"
      >
        <span class="side-icon" :class="`tone-${item.tone}`">{{ item.icon }}</span>
        <span class="side-copy">
          <strong>{{ item.label }}</strong>
          <small>{{ item.description }}</small>
        </span>
        <span v-if="item.count" class="side-count">{{ item.count }}</span>
      </RouterLink>
    </div>

    <div class="sidenav-card">
      <span class="status-dot" />
      <strong>Studio V4</strong>
      <p>Vue3 工程化原型。TS 工具直接运行，SM9 预留 Java API / WASM 接入。</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

type NavTone = 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'slate';

interface NavItem {
  label: string;
  description: string;
  icon: string;
  to: string;
  match: string[];
  tone: NavTone;
  count?: number;
}

defineEmits<{
  navigate: [];
}>();

const route = useRoute();

const navItems: NavItem[] = [
  { label: '首页', description: '平台总览', icon: '首', to: '/', match: ['/'], tone: 'blue' },
  {
    label: '加密解密',
    description: 'SM2 / SM4 / SM9 / ZUC',
    icon: '密',
    to: '/tools/sm2',
    match: ['/tools/sm2', '/tools/sm4', '/tools/sm9', '/tools/zuc'],
    tone: 'green',
    count: 4,
  },
  {
    label: '摘要哈希',
    description: 'SM3 / SHA / HMAC',
    icon: '摘',
    to: '/tools/sm3',
    match: ['/tools/sm3'],
    tone: 'blue',
    count: 2,
  },
  {
    label: '密钥与证书',
    description: '密钥生成与证书解析',
    icon: '证',
    to: '/tools/key',
    match: ['/tools/key', '/tools/cert'],
    tone: 'purple',
    count: 2,
  },
  {
    label: '编码转换',
    description: 'Hex / Base64 / URL',
    icon: '编',
    to: '/tools/encoding',
    match: ['/tools/encoding'],
    tone: 'orange',
    count: 1,
  },
  {
    label: '开发调试',
    description: 'API Playground',
    icon: '调',
    to: '/tools/api-playground',
    match: ['/tools/api-playground'],
    tone: 'cyan',
    count: 1,
  },
  {
    label: '数据与生成',
    description: 'JSON / UUID / 随机数',
    icon: '数',
    to: '/tools/data',
    match: ['/tools/data'],
    tone: 'slate',
    count: 1,
  },
  { label: '关于项目', description: '边界与矩阵', icon: '关', to: '/about', match: ['/about'], tone: 'slate' },
];

function isActive(item: NavItem): boolean {
  if (item.to === '/') {
    return route.path === '/';
  }
  return item.match.some((path) => route.path === path || route.path.startsWith(`${path}/`));
}
</script>
