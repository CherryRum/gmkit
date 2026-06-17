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
  </div>
</template>

<script setup lang="ts">
import AppBadge from '@/components/common/AppBadge.vue';
import StudioCard from '@/components/common/StudioCard.vue';

const metrics = [
  { value: '5+', label: '算法域', description: 'SM2 / SM3 / SM4 / ZUC / SHA，SM9 作为 Java/WASM 边界。' },
  { value: '12', label: '产品页面', description: '首页、算法工作台、辅助工具和项目说明完整覆盖。' },
  { value: '1', label: '统一体验', description: '导航、卡片、表单、代码示例和结果展示保持同一视觉语言。' },
];
</script>
