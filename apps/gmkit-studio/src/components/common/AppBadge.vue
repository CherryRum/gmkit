<template>
  <span class="app-badge" :class="`badge-${tone}`">
    <span v-if="dot" class="badge-dot" />
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'slate';
    dot?: boolean;
  }>(),
  {
    tone: 'blue',
    dot: false,
  },
);
</script>
