import { createApp } from 'vue';

import App from './App.vue';
import router from './router';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/responsive.css';

createApp(App).use(router).mount('#app');
