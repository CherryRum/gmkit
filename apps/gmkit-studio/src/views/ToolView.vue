<template>
  <JsonWorkspace v-if="tool?.id === 'json'" :tool="tool" />
  <ToolWorkspace v-else-if="tool" :tool="tool" />
  <section v-else class="home-panel">
    <div class="page-head">
      <div>
        <h1>工具不存在</h1>
        <p>请返回首页重新选择工具。</p>
      </div>
      <RouterLink class="hint-pill" to="/">返回首页</RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

import JsonWorkspace from '@/components/workbench/JsonWorkspace.vue';
import ToolWorkspace from '@/components/workbench/ToolWorkspace.vue';
import { getTool } from '@/data/studio-tools';
import { saveRecentToolId } from '@/services/recent-tools';

const props = defineProps<{
  toolId: string;
}>();

const tool = computed(() => getTool(props.toolId));

watch(
  tool,
  (next) => {
    if (next) saveRecentToolId(next.id);
  },
  { immediate: true },
);
</script>
