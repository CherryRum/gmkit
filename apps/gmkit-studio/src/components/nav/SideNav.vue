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

import { navItems, type NavItem } from '@/data/navigation';

defineEmits<{
  navigate: [];
}>();

const route = useRoute();

function isActive(item: NavItem): boolean {
  if (item.to === '/') {
    return route.path === '/';
  }
  return item.match.some((path) => route.path === path || route.path.startsWith(`${path}/`));
}
</script>
