<template>
  <section class="result-viewer">
    <div class="section-title">
      <h3>结果预览</h3>
      <button class="ghost-button" type="button">复制</button>
    </div>
    <pre>{{ value }}</pre>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  value: string;
}>();
</script>
