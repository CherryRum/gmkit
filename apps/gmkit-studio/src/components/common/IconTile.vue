<template>
  <span class="icon-tile" :class="`tone-${tone}`">
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'slate';
  }>(),
  {
    tone: 'blue',
  },
);
</script>
