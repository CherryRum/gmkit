<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const props = withDefaults(defineProps<{
  label: string;
  minWidth?: string;
}>(), {
  minWidth: '44rem',
});

const viewport = ref<HTMLElement>();
const overflowed = ref(false);
let observer: ResizeObserver | undefined;

function measure() {
  const element = viewport.value;
  overflowed.value = Boolean(element && element.scrollWidth > element.clientWidth + 1);
}

onMounted(async () => {
  await nextTick();
  measure();
  if (typeof ResizeObserver !== 'undefined' && viewport.value) {
    observer = new ResizeObserver(measure);
    observer.observe(viewport.value);
  }
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <figure class="api-table" :style="{ '--api-table-min-width': props.minWidth }">
    <div
      ref="viewport"
      class="api-table__viewport"
      role="region"
      :aria-label="props.label"
      tabindex="0"
      @scroll="measure"
    >
      <slot />
    </div>
    <figcaption v-if="overflowed" class="api-table__hint">
      表格可横向滚动
    </figcaption>
  </figure>
</template>
