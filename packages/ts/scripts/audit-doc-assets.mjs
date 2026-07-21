import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const docsRoot = path.resolve(root, '..', '..', 'docs', 'site');
const publicDir = path.join(docsRoot, '.vuepress', 'public');
const maxAssetKB = Number(process.env.DOC_ASSET_MAX_KB || 200);

function walk(dir, relativeDir = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // TypeDoc/Javadoc 签名索引由各自门禁检查，不纳入手工静态资源大小限制。
      if (relativeDir === '' && entry.name === 'api') continue;
      files.push(...walk(fullPath, relativePath));
      continue;
    }
    const stat = fs.statSync(fullPath);
    files.push({
      path: path.relative(root, fullPath).replace(/\\/g, '/'),
      size: stat.size,
    });
  }
  return files;
}

if (!fs.existsSync(publicDir)) {
  console.error(`[audit-doc-assets] directory not found: ${publicDir}`);
  process.exit(1);
}

const assets = walk(publicDir).sort((a, b) => b.size - a.size);
const totalKB = assets.reduce((sum, item) => sum + item.size, 0) / 1024;
const oversized = assets.filter((item) => item.size / 1024 > maxAssetKB);

console.log('[audit-doc-assets] hand-maintained docs static assets');
console.log(`- directory: ${path.relative(root, publicDir).replace(/\\/g, '/')}`);
console.log(`- file count: ${assets.length}`);
console.log(`- total size: ${totalKB.toFixed(2)} KB`);
console.log('- top assets:');
for (const asset of assets.slice(0, 10)) {
  console.log(`  - ${asset.path} (${(asset.size / 1024).toFixed(2)} KB)`);
}

if (oversized.length > 0) {
  console.error('\n[audit-doc-assets] FAILED');
  for (const asset of oversized) {
    console.error(`- ${asset.path} exceeds ${maxAssetKB} KB (${(asset.size / 1024).toFixed(2)} KB)`);
  }
  console.error('\nHint: compress or replace large assets, or raise DOC_ASSET_MAX_KB if intentional.');
  process.exit(1);
}

console.log('\n[audit-doc-assets] PASS');
