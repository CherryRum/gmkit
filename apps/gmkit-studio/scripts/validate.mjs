import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const pages = [
  'index.html',
  'sm2.html',
  'sm3.html',
  'sm4.html',
  'sm9.html',
  'zuc.html',
  'key-tools.html',
  'cert-tools.html',
  'encoding-tools.html',
  'api-playground.html',
  'data-tools.html',
  'about.html',
];

const assets = ['assets/styles.css', 'assets/app.js'];
const failures = [];

async function exists(relativePath) {
  try {
    const info = await stat(path.join(root, relativePath));
    return info.isFile();
  } catch {
    return false;
  }
}

for (const asset of assets) {
  if (!(await exists(asset))) {
    failures.push(`缺少静态资源: ${asset}`);
  }
}

const pageSet = new Set(pages);
const localLinkPattern = /(?:href|src)="([^"]+)"/g;

for (const page of pages) {
  if (!(await exists(page))) {
    failures.push(`缺少页面: ${page}`);
    continue;
  }

  const html = await readFile(path.join(root, page), 'utf8');
  if (!html.includes('assets/styles.css')) {
    failures.push(`${page} 未引入 assets/styles.css`);
  }
  if (!html.includes('assets/app.js')) {
    failures.push(`${page} 未引入 assets/app.js`);
  }
  const staleMarkers = [`页面原型（V${3}）`, `V${3} 视觉`, `demo${'-'}vue`];
  if (staleMarkers.some((marker) => html.includes(marker))) {
    failures.push(`${page} 存在旧版 V3 或旧 demo 标识`);
  }

  for (const match of html.matchAll(localLinkPattern)) {
    const rawTarget = match[1];
    if (
      rawTarget.startsWith('#') ||
      rawTarget.startsWith('http://') ||
      rawTarget.startsWith('https://') ||
      rawTarget.startsWith('mailto:')
    ) {
      continue;
    }

    const target = rawTarget.split('#')[0].split('?')[0];
    if (!target || target.startsWith('assets/')) {
      continue;
    }
    if (target.endsWith('.html') && !pageSet.has(target)) {
      failures.push(`${page} 链接到不存在的页面: ${rawTarget}`);
    }
  }
}

if (failures.length > 0) {
  console.error('GMKit Studio 原型校验失败:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`GMKit Studio V4 static prototype validated: ${pages.length} pages, ${assets.length} assets.`);
