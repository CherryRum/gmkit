<template>
  <section class="result-viewer">
    <div class="section-title">
      <h3>结果预览</h3>
      <span class="result-status" :class="status">{{ title }}</span>
    </div>
    <pre>{{ output }}</pre>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  status: 'success' | 'error' | 'info';
  output: string;
}>();
</script>
