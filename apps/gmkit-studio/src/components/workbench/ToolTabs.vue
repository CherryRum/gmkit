<template>
  <div class="tool-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tool-tab"
      :class="{ active: tab.key === activeKey }"
      type="button"
      role="tab"
      @click="$emit('update:activeKey', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ToolTab } from '@/data/tools';

defineProps<{
  tabs: ToolTab[];
  activeKey: string;
}>();

defineEmits<{
  'update:activeKey': [value: string];
}>();
</script>
