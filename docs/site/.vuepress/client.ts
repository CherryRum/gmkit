import { defineClientConfig } from 'vuepress/client';
import ApiVersionCatalog from './components/ApiVersionCatalog.vue';

export default defineClientConfig({
  enhance({ app }) {
    app.component('ApiVersionCatalog', ApiVersionCatalog);
  },
});
