<template>
  <section class="tool-panel">
    <div class="panel-copy">
      <h2>{{ tab.label }}</h2>
      <p>{{ tab.description }}</p>
    </div>

    <div class="field-grid">
      <ToolField
        v-for="field in tab.fields"
        :key="field.name"
        :field="field"
        :model-value="values[field.name] ?? ''"
        @update:model-value="$emit('update-field', field.name, $event)"
      />
    </div>

    <div class="action-row">
      <button
        v-for="(action, index) in tab.actions"
        :key="action"
        class="button"
        :class="index === 0 ? 'primary' : 'subtle'"
        type="button"
        @click="$emit('run-action', action)"
      >
        {{ action }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ToolTab } from '@/data/tools';

import ToolField from './ToolField.vue';

defineProps<{
  tab: ToolTab;
  values: Record<string, string>;
}>();

defineEmits<{
  'update-field': [name: string, value: string];
  'run-action': [action: string];
}>();
</script>
