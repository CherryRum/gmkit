import { createRouter, createWebHistory } from 'vue-router';

import { tools } from '@/data/tools';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    ...tools.map((tool) => ({
      path: tool.path,
      name: `tool-${tool.key}`,
      component: () => import('@/views/ToolView.vue'),
      props: { toolKey: tool.key },
    })),
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

export default router;
