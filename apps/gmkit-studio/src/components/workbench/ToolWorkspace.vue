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
            <label class="field" :class="{ wide: outputFields.length > 0 }">
              <span>{{ tool.inputLabel ?? '输入' }}</span>
              <textarea v-model="input" spellcheck="false" placeholder="输入内容" />
            </label>
            <label v-if="outputFields.length === 0" class="field">
              <span>{{ tool.outputLabel ?? '输出' }}</span>
              <textarea v-model="output" spellcheck="false" placeholder="输出结果" />
            </label>
            <div v-else class="field-output">
              <div class="field-output-head">
                <span>{{ tool.outputLabel ?? '输出字段' }}</span>
                <button class="text-button" type="button" @click="copyAllFields">复制全部</button>
              </div>
              <div class="output-field-grid">
                <article v-for="field in outputFields" :key="field.key" class="output-card" :class="{ primary: field.primary }">
                  <div class="output-card-head">
                    <div>
                      <strong>{{ field.label }}</strong>
                      <small>{{ field.kind }}</small>
                    </div>
                    <div class="output-card-actions">
                      <button
                        v-if="field.secret"
                        class="mini-btn"
                        type="button"
                        @click="toggleSecret(field.key)"
                      >
                        {{ visibleSecrets[field.key] ? '隐藏' : '显示' }}
                      </button>
                      <button v-if="field.copyable" class="mini-btn" type="button" @click="copyField(field)">复制</button>
                    </div>
                  </div>
                  <pre>{{ field.secret && !visibleSecrets[field.key] ? maskSecret(field.value) : field.value }}</pre>
                  <p v-if="field.note">{{ field.note }}</p>
                </article>
              </div>
            </div>
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
            <label v-for="option in visibleOptions" :key="option.key" class="field compact">
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
                :type="option.kind === 'number' ? 'number' : option.inputMode === 'password' ? 'password' : 'text'"
                :value="String(optionValues[option.key] ?? option.defaultValue)"
                :placeholder="option.placeholder"
                @input="setOption(option.key, ($event.target as HTMLInputElement).value)"
              />
              <small v-if="option.help" class="field-help">{{ option.help }}</small>
            </label>
            <p v-if="visibleOptions.length === 0" class="empty-options">当前页签无需额外选项。</p>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { StudioTool, ToolOption } from '@/data/studio-tools';
import { runStudioTool } from '@/services/tools/runner';
import type { ToolOutputField, ToolValues } from '@/services/tools/types';

const props = defineProps<{
  tool: StudioTool;
}>();

const activeTab = ref(props.tool.tabs[0]?.key ?? '');
const input = ref('');
const output = ref('');
const result = ref('等待执行');
const resultStatus = ref<'success' | 'error' | 'info'>('info');
const optionValues = ref<ToolValues>({});
const outputFields = ref<ToolOutputField[]>([]);
const visibleSecrets = ref<Record<string, boolean>>({});

const visibleOptions = computed<ToolOption[]>(() => props.tool.options.filter((option) => !option.tabs || option.tabs.includes(activeTab.value)));

watch(
  () => props.tool.id,
  () => {
    activeTab.value = props.tool.tabs[0]?.key ?? '';
    input.value = '';
    output.value = '';
    outputFields.value = [];
    visibleSecrets.value = {};
    result.value = '等待执行';
    resultStatus.value = 'info';
    optionValues.value = Object.fromEntries(props.tool.options.map((option) => [option.key, option.defaultValue]));
  },
  { immediate: true },
);

watch(activeTab, () => {
  output.value = '';
  outputFields.value = [];
  visibleSecrets.value = {};
  result.value = '等待执行';
  resultStatus.value = 'info';
});

function setOption(key: string, value: string | boolean): void {
  optionValues.value = { ...optionValues.value, [key]: value };
}

async function run(): Promise<void> {
  result.value = '执行中...';
  resultStatus.value = 'info';
  const next = await runStudioTool({
    tool: props.tool,
    tab: activeTab.value,
    input: input.value,
    output: output.value,
    options: optionValues.value,
  });
  output.value = next.output;
  outputFields.value = next.fields ?? [];
  visibleSecrets.value = {};
  result.value = next.detail;
  resultStatus.value = next.status;
  if (next.options) {
    optionValues.value = { ...optionValues.value, ...next.options };
  }
}

function fillSample(): void {
  input.value = props.tool.sample;
  outputFields.value = [];
  result.value = '已填入示例';
  resultStatus.value = 'success';
}

function clear(): void {
  input.value = '';
  output.value = '';
  outputFields.value = [];
  visibleSecrets.value = {};
  result.value = '等待执行';
  resultStatus.value = 'info';
}

async function copy(): Promise<void> {
  await navigator.clipboard?.writeText(outputFields.value.length ? serializeFields() : output.value || result.value);
  result.value = '已复制';
  resultStatus.value = 'success';
}

async function copyField(field: ToolOutputField): Promise<void> {
  await navigator.clipboard?.writeText(field.value);
  result.value = `已复制：${field.label}`;
  resultStatus.value = 'success';
}

async function copyAllFields(): Promise<void> {
  await navigator.clipboard?.writeText(serializeFields());
  result.value = '已复制全部字段';
  resultStatus.value = 'success';
}

function swap(): void {
  const next = input.value;
  input.value = output.value;
  output.value = next;
  outputFields.value = [];
}

function toggleSecret(key: string): void {
  visibleSecrets.value = { ...visibleSecrets.value, [key]: !visibleSecrets.value[key] };
}

function maskSecret(value: string): string {
  if (!value) return '';
  if (value.includes('\n')) return value.split(/\r?\n/).map((line) => (line.startsWith('-----') ? line : '•'.repeat(Math.min(Math.max(line.length, 8), 64)))).join('\n');
  return `${value.slice(0, 4)}${'•'.repeat(Math.min(Math.max(value.length - 8, 8), 48))}${value.slice(-4)}`;
}

function serializeFields(): string {
  return outputFields.value.map((field) => `${field.label}\n${field.value}`).join('\n\n');
}
</script>
