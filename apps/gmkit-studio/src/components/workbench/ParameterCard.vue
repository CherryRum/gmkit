<template>
  <section class="info-card">
    <h3>{{ card.title }}</h3>
    <p>{{ card.body }}</p>
    <ul v-if="card.items?.length">
      <li v-for="item in card.items" :key="item">{{ item }}</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { InfoCard } from '@/data/tools';

defineProps<{
  card: InfoCard;
}>();
</script>
