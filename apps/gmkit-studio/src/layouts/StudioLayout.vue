<template>
  <div class="studio-app">
    <TopBar />
    <div class="studio-shell">
      <CategoryNav />
      <main class="main-pane">
        <slot />
      </main>
      <AdRail />
    </div>
  </div>
</template>

<script setup lang="ts">
import AdRail from '@/components/ads/AdRail.vue';
import CategoryNav from '@/components/nav/CategoryNav.vue';
import TopBar from '@/components/nav/TopBar.vue';
</script>
