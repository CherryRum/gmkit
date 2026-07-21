<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface ApiVersion {
  version: string;
  url: string;
}

interface ApiPackage {
  id: string;
  name: string;
  versions: ApiVersion[];
}

const packages = ref<ApiPackage[]>([]);
const error = ref('');

onMounted(async () => {
  try {
    const response = await fetch('/api/versions.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json() as { packages?: ApiPackage[] };
    packages.value = manifest.packages ?? [];
  } catch (cause) {
    error.value = `暂时无法读取版本清单：${cause instanceof Error ? cause.message : String(cause)}`;
  }
});

function open(url: string) {
  if (url) window.location.assign(url);
}
</script>

<template>
  <div class="api-version-catalog" aria-live="polite">
    <div v-for="entry in packages" :key="entry.id" class="api-version-row">
      <strong>{{ entry.name }}</strong>
      <select :aria-label="`${entry.name} API 版本`" @change="open(($event.target as HTMLSelectElement).value)">
        <option value="">选择版本</option>
        <option v-for="version in entry.versions" :key="version.version" :value="version.url">
          {{ version.version }}
        </option>
      </select>
    </div>
    <p v-if="error" class="api-version-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.api-version-catalog {
  display: grid;
  gap: 0.75rem;
  margin: 1rem 0 1.5rem;
}

.api-version-row {
  display: grid;
  grid-template-columns: minmax(10rem, 1fr) minmax(12rem, 18rem);
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--vp-c-border);
}

.api-version-row select {
  width: 100%;
  min-height: 2.25rem;
  padding: 0.35rem 0.5rem;
  color: var(--vp-c-text);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
}

.api-version-error {
  color: var(--vp-c-danger);
}

@media (max-width: 600px) {
  .api-version-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}
</style>
