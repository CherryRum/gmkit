<template>
  <aside class="category-nav" aria-label="工具分类">
    <RouterLink class="side-mark" to="/">
      <span>GM</span>
    </RouterLink>

    <nav class="category-list">
      <RouterLink
        v-for="category in categories"
        :key="category.id"
        class="category-button"
        :class="{ active: activeCategory === category.id }"
        :to="{ path: '/', query: category.id === 'home' ? currentSearchQuery : { ...currentSearchQuery, category: category.id } }"
        :title="category.description"
      >
        <span class="category-icon">{{ category.icon }}</span>
        <span>{{ category.name }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { categories, isToolCategoryId } from '@/data/studio-tools';

const route = useRoute();

const activeCategory = computed(() => {
  const value = route.query.category;
  const category = Array.isArray(value) ? value[0] : value;
  return isToolCategoryId(category) ? category : 'home';
});

const currentSearchQuery = computed(() => {
  const query = route.query.q;
  const q = Array.isArray(query) ? query[0] : query;
  return q ? { q } : {};
});
</script>
