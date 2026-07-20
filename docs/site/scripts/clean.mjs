import { rm } from 'node:fs/promises';

await Promise.all([
  rm(new URL('../.vuepress/.cache', import.meta.url), { recursive: true, force: true }),
  rm(new URL('../.vuepress/.temp', import.meta.url), { recursive: true, force: true }),
]);
