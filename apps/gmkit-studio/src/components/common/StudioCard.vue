<template>
  <article class="studio-card" :class="{ interactive }">
    <slot />
  </article>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    interactive?: boolean;
  }>(),
  {
    interactive: false,
  },
);
</script>
