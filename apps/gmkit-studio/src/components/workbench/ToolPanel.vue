<template>
  <section class="tool-panel">
    <div class="panel-copy">
      <h2>{{ tab.label }}</h2>
      <p>{{ tab.description }}</p>
    </div>

    <div class="field-grid">
      <ToolField v-for="field in tab.fields" :key="field.name" :field="field" />
    </div>

    <div class="action-row">
      <button
        v-for="(action, index) in tab.actions"
        :key="action"
        class="button"
        :class="index === 0 ? 'primary' : 'subtle'"
        type="button"
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
}>();
</script>
