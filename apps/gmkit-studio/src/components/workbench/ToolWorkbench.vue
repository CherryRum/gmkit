<template>
  <div class="page-stack">
    <div class="breadcrumb">{{ tool.category }} / {{ tool.title }}</div>
    <section class="workbench-head">
      <div>
        <AppBadge :tone="tool.tone" dot>{{ tool.badge }}</AppBadge>
        <h1>{{ tool.title }}</h1>
        <p>{{ tool.subtitle }}</p>
      </div>
      <IconTile :tone="tool.tone">{{ tool.icon }}</IconTile>
    </section>

    <div class="workbench-grid">
      <div class="workbench-main">
        <ToolTabs v-model:active-key="activeKey" :tabs="tool.tabs" />
        <ToolPanel :tab="activeTab" />
        <ResultViewer :value="resultPreview" />
      </div>
      <aside class="workbench-aside">
        <ParameterCard v-for="card in tool.infoCards" :key="card.title" :card="card" />
        <CodeExampleCard :examples="tool.codeExamples" />
      </aside>
    </div>

    <RelatedTools :related="tool.related" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import AppBadge from '@/components/common/AppBadge.vue';
import IconTile from '@/components/common/IconTile.vue';
import type { ToolDefinition } from '@/data/tools';

import CodeExampleCard from './CodeExampleCard.vue';
import ParameterCard from './ParameterCard.vue';
import RelatedTools from './RelatedTools.vue';
import ResultViewer from './ResultViewer.vue';
import ToolPanel from './ToolPanel.vue';
import ToolTabs from './ToolTabs.vue';

const props = defineProps<{
  tool: ToolDefinition;
}>();

const activeKey = ref(props.tool.tabs[0]?.key ?? '');

watch(
  () => props.tool.key,
  () => {
    activeKey.value = props.tool.tabs[0]?.key ?? '';
  },
);

const activeTab = computed(() => props.tool.tabs.find((tab) => tab.key === activeKey.value) ?? props.tool.tabs[0]);

const resultPreview = computed(() =>
  JSON.stringify(
    {
      tool: props.tool.key,
      tab: activeTab.value.key,
      status: 'ready-for-runtime',
      message: '下一迭代接入 gmkitx / SM9 runtime 后，这里展示真实执行结果。',
    },
    null,
    2,
  ),
);
</script>
