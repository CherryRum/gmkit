<template>
  <section class="home-view">
    <div class="home-panel">
      <div class="page-head">
        <div>
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </div>
        <button v-if="showClearRecent" class="hint-pill" type="button" @click="clearRecent">清空记录</button>
      </div>

      <div class="grid-head">
        <h2>{{ gridTitle }}</h2>
        <span>{{ visibleTools.length }} 个工具</span>
      </div>

      <div class="tool-grid">
        <RouterLink v-for="tool in visibleTools" :key="tool.id" class="wide-card" :to="`/tools/${tool.id}`">
          <span class="tool-badge" :class="`tone-${tool.tone}`">{{ tool.short }}</span>
          <span>
            <strong>{{ tool.name }}</strong>
            <small>{{ tool.description }}</small>
          </span>
        </RouterLink>
        <div v-if="visibleTools.length === 0" class="wide-card empty">
          <span class="tool-badge tone-slate">?</span>
          <span>
            <strong>未找到工具</strong>
            <small>调整搜索关键词或切换分类。</small>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  commonToolIds,
  getCategory,
  getTool,
  isToolCategoryId,
  searchTools,
  type StudioTool,
  type ToolCategoryId,
} from '@/data/studio-tools';
import { clearRecentToolIds, readRecentToolIds } from '@/services/recent-tools';

const route = useRoute();
const recentVersion = ref(0);

const categoryId = computed<ToolCategoryId>(() => {
  const raw = route.query.category;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return isToolCategoryId(value) ? value : 'home';
});

const query = computed(() => {
  const raw = route.query.q;
  return (Array.isArray(raw) ? raw[0] : raw) ?? '';
});

const recentTools = computed(() => {
  recentVersion.value;
  return readRecentToolIds()
    .map((id) => getTool(id))
    .filter((tool): tool is StudioTool => Boolean(tool));
});

const visibleTools = computed(() => {
  if (query.value.trim()) return searchTools(query.value, 'home');
  if (categoryId.value !== 'home') return searchTools('', categoryId.value);
  const recent = recentTools.value;
  if (recent.length) return recent;
  return commonToolIds.map((id) => getTool(id)).filter((tool): tool is StudioTool => Boolean(tool));
});

const title = computed(() => {
  if (query.value.trim()) return '搜索结果';
  return categoryId.value === 'home' ? 'GMKit Studio' : getCategory(categoryId.value).name;
});

const subtitle = computed(() => {
  if (query.value.trim()) return `匹配 “${query.value.trim()}” 的工具`;
  return categoryId.value === 'home' ? '常用与最近使用工具' : getCategory(categoryId.value).description;
});

const gridTitle = computed(() => {
  if (query.value.trim()) return '匹配工具';
  if (categoryId.value !== 'home') return getCategory(categoryId.value).name;
  return recentTools.value.length ? '最近使用' : '常用工具';
});

const showClearRecent = computed(() => categoryId.value === 'home' && !query.value.trim() && recentTools.value.length > 0);

function clearRecent(): void {
  clearRecentToolIds();
  recentVersion.value += 1;
}
</script>
