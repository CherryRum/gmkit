<template>
  <div class="studio-layout" :class="{ 'nav-open': isNavOpen }">
    <TopBar @toggle-nav="isNavOpen = !isNavOpen" />
    <SideNav @navigate="isNavOpen = false" />
    <button
      v-if="isNavOpen"
      class="mobile-scrim"
      type="button"
      aria-label="关闭导航"
      @click="isNavOpen = false"
    />
    <main class="studio-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import SideNav from '@/components/nav/SideNav.vue';
import TopBar from '@/components/nav/TopBar.vue';

const isNavOpen = ref(false);
</script>
