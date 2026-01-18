import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AppLayout from '../components/AppLayout.vue'
import SM2View from '../views/SM2View.vue'
import SM3View from '../views/SM3View.vue'
import SM4View from '../views/SM4View.vue'
import AllApiView from '../views/AllApiView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    // 信创国密算法工具路由 Chinese National Cryptographic Algorithm Tool Routes
    {
      path: '/sm2',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'sm2',
          component: SM2View,
        },
      ],
    },
    {
      path: '/sm3',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'sm3',
          component: SM3View,
        },
      ],
    },
    {
      path: '/sm4',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'sm4',
          component: SM4View,
        },
      ],
    },
    {
      path: '/api',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'api',
          component: AllApiView,
        },
      ],
    },
  ],
})

export default router
