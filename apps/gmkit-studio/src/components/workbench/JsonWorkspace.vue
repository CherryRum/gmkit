<template>
  <section class="workspace-shell json-workspace">
    <div class="workspace-title">
      <div class="title-left">
        <span class="tool-badge tone-green">{{ tool.short }}</span>
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

      <div class="json-toolbar">
        <label class="field compact">
          <span>缩进</span>
          <select v-model="indent">
            <option>2</option>
            <option>4</option>
            <option>Tab</option>
            <option>0</option>
          </select>
        </label>
        <label class="check-chip"><input v-model="sortKeys" type="checkbox" />排序键名</label>
        <label class="check-chip"><input v-model="escapeUnicode" type="checkbox" />转义Unicode</label>
        <label class="field compact grow">
          <span>JSONPath / Schema</span>
          <input v-model="query" type="text" placeholder="$.data[*] 或 JSON Schema" />
        </label>
      </div>

      <div class="editor-grid json-editor-grid">
        <label class="field">
          <span>JSON 输入</span>
          <textarea v-model="input" spellcheck="false" placeholder="粘贴 JSON / JSONC / 待修复内容" />
        </label>
        <label class="field">
          <span>输出</span>
          <textarea v-model="output" spellcheck="false" placeholder="格式化、压缩、查询或校验结果" />
        </label>
      </div>

      <div class="actions">
        <div class="actions-left">
          <button class="btn primary" type="button" :disabled="running" @click="run">{{ running ? '执行中' : '执行' }}</button>
          <button class="btn" type="button" @click="fillSample">示例</button>
          <button class="btn danger" type="button" @click="clear">清空</button>
        </div>
        <div class="actions-right">
          <button class="btn" type="button" @click="copy">复制</button>
          <button class="btn" type="button" @click="download">下载</button>
        </div>
      </div>

      <pre class="result-box" :class="status">{{ detail }}</pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';

import type { StudioTool } from '@/data/studio-tools';

interface JsonWorkerResponse {
  id: number;
  status: 'success' | 'error' | 'info';
  output: string;
  detail: string;
}

const props = defineProps<{
  tool: StudioTool;
}>();

const activeTab = ref(props.tool.tabs[0]?.key ?? '格式化');
const input = ref('');
const output = ref('');
const detail = ref('等待执行');
const status = ref<'success' | 'error' | 'info'>('info');
const indent = ref('2');
const sortKeys = ref(false);
const escapeUnicode = ref(false);
const query = ref('$.data[*]');
const running = ref(false);
const seq = ref(0);
const worker = new Worker(new URL('../../workers/json.worker.ts', import.meta.url), { type: 'module' });

worker.onmessage = (event: MessageEvent<JsonWorkerResponse>) => {
  const response = event.data;
  if (response.id !== seq.value) return;
  running.value = false;
  output.value = response.output;
  detail.value = response.detail;
  status.value = response.status;
};

worker.onerror = (event) => {
  running.value = false;
  status.value = 'error';
  detail.value = event.message;
};

onBeforeUnmount(() => worker.terminate());

function run(): void {
  running.value = true;
  status.value = 'info';
  detail.value = 'Worker 执行中...';
  seq.value += 1;
  worker.postMessage({
    id: seq.value,
    action: activeTab.value,
    input: input.value,
    options: {
      indent: indent.value,
      sortKeys: sortKeys.value,
      escapeUnicode: escapeUnicode.value,
      query: query.value,
    },
  });
}

function fillSample(): void {
  input.value = props.tool.sample;
  detail.value = '已填入示例';
  status.value = 'success';
}

function clear(): void {
  input.value = '';
  output.value = '';
  detail.value = '等待执行';
  status.value = 'info';
}

async function copy(): Promise<void> {
  await navigator.clipboard?.writeText(output.value || detail.value);
  detail.value = '已复制';
  status.value = 'success';
}

function download(): void {
  const blob = new Blob([output.value || input.value], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gmkit.json';
  link.click();
  URL.revokeObjectURL(url);
}
</script>
