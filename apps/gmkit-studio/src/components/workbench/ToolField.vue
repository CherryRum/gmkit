<template>
  <label class="tool-field">
    <span>{{ field.label }}</span>
    <textarea
      v-if="field.kind === 'textarea'"
      :placeholder="field.placeholder"
      :value="modelValue"
      rows="6"
      @input="emitValue(($event.target as HTMLTextAreaElement).value)"
    />
    <select v-else-if="field.kind === 'select'" :value="modelValue" @change="emitValue(($event.target as HTMLSelectElement).value)">
      <option v-for="option in field.options" :key="option">{{ option }}</option>
    </select>
    <input v-else :placeholder="field.placeholder" :value="modelValue" @input="emitValue(($event.target as HTMLInputElement).value)" />
  </label>
</template>

<script setup lang="ts">
import type { ToolField } from '@/data/tools';

defineProps<{
  field: ToolField;
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function emitValue(value: string): void {
  emit('update:modelValue', value);
}
</script>
