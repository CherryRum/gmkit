<template>
  <section class="related-tools">
    <div class="section-title">
      <h2>相关工具</h2>
      <span>沿同一任务链路继续操作</span>
    </div>
    <div class="related-grid">
      <RouterLink v-for="tool in related" :key="tool.to" class="related-card" :to="tool.to">
        <IconTile :tone="tool.tone">{{ tool.icon }}</IconTile>
        <span>
          <strong>{{ tool.label }}</strong>
          <small>{{ tool.description }}</small>
        </span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import IconTile from '@/components/common/IconTile.vue';
import type { RelatedTool } from '@/data/tools';

defineProps<{
  related: RelatedTool[];
}>();
</script>
