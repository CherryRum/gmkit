import { defineClientConfig } from 'vuepress/client';
import ApiTable from './components/ApiTable.vue';
import ApiVersionCatalog from './components/ApiVersionCatalog.vue';

export default defineClientConfig({
  enhance({ app }) {
    app.component('ApiTable', ApiTable);
    app.component('ApiVersionCatalog', ApiVersionCatalog);
  },
});
