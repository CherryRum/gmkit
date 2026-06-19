<template>
  <section class="workspace-shell">
    <div class="workspace-title">
      <div class="title-left">
        <span class="tool-badge" :class="`tone-${tool.tone}`">{{ tool.short }}</span>
        <div>
          <h1>{{ tool.name }}</h1>
          <p>{{ tool.description }}</p>
        </div>
      </div>
      <RouterLink class="pill" :to="{ path: '/', query: { category: tool.category } }">返回</RouterLink>
    </div>

    <div class="workspace-body">
      <div class="tabs" role="tablist">
        <button
          v-for="tab in tool.tabs"
          :key="tab.key"
          class="tab"
          :class="{ active: tab.key === activeTab }"
          type="button"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="work-layout">
        <div class="work-main">
          <div class="editor-grid">
            <label class="field">
              <span>{{ tool.inputLabel ?? '输入' }}</span>
              <textarea v-model="input" spellcheck="false" placeholder="输入内容" />
            </label>
            <label class="field">
              <span>{{ tool.outputLabel ?? '输出' }}</span>
              <textarea v-model="output" spellcheck="false" placeholder="输出结果" />
            </label>
          </div>

          <div class="actions">
            <div class="actions-left">
              <button class="btn primary" type="button" @click="run">执行</button>
              <button class="btn" type="button" @click="fillSample">示例</button>
              <button class="btn danger" type="button" @click="clear">清空</button>
            </div>
            <div class="actions-right">
              <button class="btn" type="button" @click="copy">复制</button>
              <button class="btn" type="button" @click="swap">交换</button>
            </div>
          </div>

          <pre class="result-box" :class="resultStatus">{{ result }}</pre>
        </div>

        <aside class="option-panel">
          <h2>工具选项</h2>
          <div class="options-grid">
            <label v-for="option in tool.options" :key="option.key" class="field compact">
              <span>{{ option.label }}</span>
              <select
                v-if="option.kind === 'select'"
                :value="String(optionValues[option.key] ?? option.defaultValue)"
                @change="setOption(option.key, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="value in option.options" :key="value" :value="value">{{ value }}</option>
              </select>
              <input
                v-else-if="option.kind === 'boolean'"
                type="checkbox"
                :checked="Boolean(optionValues[option.key] ?? option.defaultValue)"
                @change="setOption(option.key, ($event.target as HTMLInputElement).checked)"
              />
              <input
                v-else
                :type="option.kind === 'number' ? 'number' : 'text'"
                :value="String(optionValues[option.key] ?? option.defaultValue)"
                :placeholder="option.placeholder"
                @input="setOption(option.key, ($event.target as HTMLInputElement).value)"
              />
            </label>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { StudioTool } from '@/data/studio-tools';

const props = defineProps<{
  tool: StudioTool;
}>();

const activeTab = ref(props.tool.tabs[0]?.key ?? '');
const input = ref('');
const output = ref('');
const result = ref('等待执行');
const resultStatus = ref<'success' | 'error' | 'info'>('info');
const optionValues = ref<Record<string, string | boolean>>({});

watch(
  () => props.tool.id,
  () => {
    activeTab.value = props.tool.tabs[0]?.key ?? '';
    input.value = '';
    output.value = '';
    result.value = '等待执行';
    resultStatus.value = 'info';
    optionValues.value = Object.fromEntries(props.tool.options.map((option) => [option.key, option.defaultValue]));
  },
  { immediate: true },
);

const activeTabLabel = computed(() => props.tool.tabs.find((tab) => tab.key === activeTab.value)?.label ?? activeTab.value);

function setOption(key: string, value: string | boolean): void {
  optionValues.value = { ...optionValues.value, [key]: value };
}

function run(): void {
  output.value = input.value || props.tool.sample;
  result.value = `${props.tool.name} / ${activeTabLabel.value}\n\nrunner 将在后续提交接入真实执行。`;
  resultStatus.value = 'info';
}

function fillSample(): void {
  input.value = props.tool.sample;
  result.value = '已填入示例';
  resultStatus.value = 'success';
}

function clear(): void {
  input.value = '';
  output.value = '';
  result.value = '等待执行';
  resultStatus.value = 'info';
}

async function copy(): Promise<void> {
  await navigator.clipboard?.writeText(output.value || result.value);
  result.value = '已复制';
  resultStatus.value = 'success';
}

function swap(): void {
  const next = input.value;
  input.value = output.value;
  output.value = next;
}
</script>
