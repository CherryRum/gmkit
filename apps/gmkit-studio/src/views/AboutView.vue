<template>
  <div class="page-stack">
    <section class="workbench-head">
      <div>
        <AppBadge tone="slate" dot>Project Boundary</AppBadge>
        <h1>关于 GMKit Studio</h1>
        <p>这个 Vue3 原型用于沉淀 GMKit 的工具工作台体验，并明确 TypeScript、Java 与未来 WASM 的职责边界。</p>
      </div>
    </section>

    <section class="matrix-card">
      <div class="section-title">
        <h2>能力矩阵</h2>
        <span>TS 无 SM9，Java 保留 SM9</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>算法</th>
            <th>TypeScript</th>
            <th>Java</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in supportMatrix" :key="item.name">
            <td>{{ item.name }}</td>
            <td>{{ item.ts }}</td>
            <td>{{ item.java }}</td>
            <td>{{ item.note }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import AppBadge from '@/components/common/AppBadge.vue';
import { supportMatrix } from '@/data/pages';
</script>
