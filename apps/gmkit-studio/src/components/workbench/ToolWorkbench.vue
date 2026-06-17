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
        <ToolPanel
          :tab="activeTab"
          :values="activeValues"
          @update-field="updateField"
          @run-action="runAction"
        />
        <ResultViewer :title="result.title" :status="result.status" :output="result.output" />
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
import { runToolAction, type ToolActionResult } from '@/services/tool-runner';
import type { ToolValues } from '@/services/format';

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
const valuesByTab = ref<Record<string, ToolValues>>({});
const result = ref<ToolActionResult>({
  status: 'info',
  title: '等待操作',
  output: '请选择页签、填写参数，然后点击操作按钮。',
});

watch(
  () => props.tool.key,
  () => {
    activeKey.value = props.tool.tabs[0]?.key ?? '';
    valuesByTab.value = {};
    result.value = {
      status: 'info',
      title: '等待操作',
      output: '请选择页签、填写参数，然后点击操作按钮。',
    };
  },
  { immediate: true },
);

const activeTab = computed(() => props.tool.tabs.find((tab) => tab.key === activeKey.value) ?? props.tool.tabs[0]);

const activeValues = computed(() => {
  const key = activeTab.value.key;
  valuesByTab.value[key] ??= Object.fromEntries(
    activeTab.value.fields.map((field) => [field.name, field.value ?? field.options?.[0] ?? '']),
  );
  return valuesByTab.value[key];
});

function updateField(name: string, value: string): void {
  valuesByTab.value[activeTab.value.key] = {
    ...activeValues.value,
    [name]: value,
  };
}

async function runAction(action: string): Promise<void> {
  if (action === '清空') {
    valuesByTab.value[activeTab.value.key] = Object.fromEntries(
      activeTab.value.fields.map((field) => [field.name, field.options?.[0] ?? '']),
    );
    result.value = { status: 'info', title: '已清空', output: '当前表单已恢复为空。' };
    return;
  }

  if (action === '复制结果') {
    await navigator.clipboard?.writeText(result.value.output);
    result.value = { ...result.value, title: '已复制结果' };
    return;
  }

  const next = await runToolAction(props.tool.key, activeTab.value.key, action, activeValues.value);
  if (next.values) {
    valuesByTab.value[activeTab.value.key] = next.values;
  }
  result.value = next;
}
</script>
