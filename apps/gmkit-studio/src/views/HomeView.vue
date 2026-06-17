<template>
  <div class="page-stack">
    <section class="hero-panel">
      <div class="hero-content">
        <AppBadge tone="blue" dot>GMKit Studio V4</AppBadge>
        <h1>面向开发与验证场景的国密工具工作台</h1>
        <p>
          Vue3 工程版高保真原型。SM2、SM3、SM4、ZUC 与 SHA 走浏览器端 gmkitx；
          SM9 保留 Java API 与 WASM runtime 接入边界。
        </p>
        <div class="hero-actions">
          <RouterLink class="button primary" to="/tools/sm2">进入 SM2 工具</RouterLink>
          <RouterLink class="button subtle" to="/about">查看能力矩阵</RouterLink>
        </div>
      </div>
      <div class="hero-preview" aria-hidden="true">
        <div class="preview-window">
          <div class="preview-header">
            <span />
            <span />
            <span />
          </div>
          <div class="preview-grid">
            <div class="preview-card wide" />
            <div class="preview-card" />
            <div class="preview-card" />
            <div class="preview-code" />
          </div>
        </div>
      </div>
    </section>

    <section class="metric-grid">
      <StudioCard v-for="metric in metrics" :key="metric.label">
        <strong>{{ metric.value }}</strong>
        <span>{{ metric.label }}</span>
        <p>{{ metric.description }}</p>
      </StudioCard>
    </section>

    <section v-for="group in groupedTools" :key="group.category" class="tool-section">
      <div class="section-title">
        <h2>{{ group.category }}</h2>
        <span>{{ group.items.length }} 个入口</span>
      </div>
      <div class="tool-card-grid">
        <RouterLink v-for="tool in group.items" :key="tool.key" class="tool-card-link" :to="tool.path">
          <IconTile :tone="tool.tone">{{ tool.icon }}</IconTile>
          <span>
            <strong>{{ tool.title }}</strong>
            <small>{{ tool.subtitle }}</small>
          </span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import AppBadge from '@/components/common/AppBadge.vue';
import IconTile from '@/components/common/IconTile.vue';
import StudioCard from '@/components/common/StudioCard.vue';
import { homeMetrics as metrics } from '@/data/pages';
import { tools } from '@/data/tools';

const groupedTools = Object.values(
  tools.reduce<Record<string, { category: string; items: typeof tools }>>((groups, tool) => {
    groups[tool.category] ??= { category: tool.category, items: [] };
    groups[tool.category].items.push(tool);
    return groups;
  }, {}),
);
</script>
