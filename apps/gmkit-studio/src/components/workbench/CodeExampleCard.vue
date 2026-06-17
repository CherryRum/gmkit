<template>
  <section class="info-card code-card">
    <div class="section-title">
      <h3>调用示例</h3>
      <div class="segmented">
        <button
          v-for="name in languages"
          :key="name"
          :class="{ active: name === active }"
          type="button"
          @click="active = name"
        >
          {{ name }}
        </button>
      </div>
    </div>
    <pre>{{ examples[active] }}</pre>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const languages = ['ts', 'java', 'curl'] as const;
type Language = (typeof languages)[number];

defineProps<{
  examples: Record<Language, string>;
}>();

const active = ref<Language>('ts');
</script>
