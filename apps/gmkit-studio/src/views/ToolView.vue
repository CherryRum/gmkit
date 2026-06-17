<template>
  <ToolWorkbench :tool="tool" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

import ToolWorkbench from '@/components/workbench/ToolWorkbench.vue';
import { getTool, type ToolKey } from '@/data/tools';

const props = defineProps<{
  toolKey: ToolKey;
}>();

const tool = computed(() => getTool(props.toolKey));
</script>
