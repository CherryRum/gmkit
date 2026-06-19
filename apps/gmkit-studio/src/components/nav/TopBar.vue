<template>
  <header class="topbar">
    <RouterLink class="brand" to="/">
      <span class="logo">GM</span>
      <strong>GMKit Studio</strong>
    </RouterLink>

    <label class="search">
      <span>⌕</span>
      <input ref="searchInput" v-model="query" type="search" placeholder="搜索工具" @input="syncQuery" />
      <span class="kbd">Ctrl K</span>
    </label>

    <nav class="top-actions" aria-label="顶部导航">
      <RouterLink to="/">工具</RouterLink>
      <a href="https://github.com/gmkits/gmkit" target="_blank" rel="noreferrer">GitHub</a>
      <RouterLink to="/about">关于</RouterLink>
      <button class="icon-btn" type="button" aria-label="主题占位">☼</button>
      <a class="primary-btn" href="https://github.com/gmkits/gmkit" target="_blank" rel="noreferrer">仓库</a>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const searchInput = ref<HTMLInputElement>();
const query = ref(readQuery());

watch(
  () => route.query.q,
  () => {
    query.value = readQuery();
  },
);

function readQuery(): string {
  const raw = route.query.q;
  return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
}

function syncQuery(): void {
  const nextQuery = { ...route.query };
  if (query.value.trim()) {
    nextQuery.q = query.value.trim();
    delete nextQuery.category;
  } else {
    delete nextQuery.q;
  }
  router.replace({ path: '/', query: nextQuery });
}

function handleKeydown(event: KeyboardEvent): void {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.value?.focus();
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown));
</script>
