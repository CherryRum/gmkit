<template>
  <label class="tool-field">
    <span>{{ field.label }}</span>
    <textarea
      v-if="field.kind === 'textarea'"
      :placeholder="field.placeholder"
      :value="field.value"
      rows="6"
      readonly
    />
    <select v-else-if="field.kind === 'select'" :value="field.value ?? field.options?.[0]">
      <option v-for="option in field.options" :key="option">{{ option }}</option>
    </select>
    <input v-else :placeholder="field.placeholder" :value="field.value" readonly />
  </label>
</template>

<script setup lang="ts">
import type { ToolField } from '@/data/tools';

defineProps<{
  field: ToolField;
}>();
</script>
