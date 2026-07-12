import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(docsRoot, '..', '..');
const configPath = path.join(docsRoot, '.vuepress', 'config.ts');

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.vuepress') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.name.endsWith('.md')) files.push(absolute);
  }
  return files;
}

function routeFor(file) {
  const relative = path.relative(docsRoot, file).replaceAll('\\', '/');
  return relative === 'README.md' ? '/' : `/${relative.replace(/\.md$/, '')}`;
}

function stripQueryAndHash(link) {
  return decodeURI(link.split('#')[0].split('?')[0]);
}

function linkCandidates(source, link) {
  const cleaned = stripQueryAndHash(link);
  const base = cleaned.startsWith('/')
    ? path.join(docsRoot, cleaned.slice(1))
    : path.resolve(path.dirname(source), cleaned);
  // `.zh-CN` 是页面名的一部分，不是 Markdown 扩展名；只有明确的文件后缀才直接读取。
  if (/\.(?:md|png|jpe?g|gif|svg|webp|pdf|zip)$/i.test(base)) return [base];
  return [`${base}.md`, path.join(base, 'README.md')];
}

const markdownFiles = await walk(docsRoot);
const config = await readFile(configPath, 'utf8');
const failures = [];

for (const file of markdownFiles) {
  const relative = path.relative(repoRoot, file).replaceAll('\\', '/');
  const content = await readFile(file, 'utf8');

  for (const forbidden of [
    'github.com/CherryRum/gmkit',
    'gmkits/gmkit-java',
    'test/vectors/interop.json',
  ]) {
    if (content.includes(forbidden)) failures.push(`${relative}: 包含过期引用 ${forbidden}`);
  }

  const links = content.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g);
  for (const [, link] of links) {
    if (/^(?:https?:|mailto:|#)/.test(link)) continue;
    const candidates = linkCandidates(file, link);
    const exists = await Promise.all(candidates.map(async (candidate) => {
      try { return (await stat(candidate)).isFile(); } catch { return false; }
    }));
    if (!exists.some(Boolean)) failures.push(`${relative}: 站内链接不存在 ${link}`);
  }

  const route = routeFor(file);
  if (route !== '/' && !config.includes(`'${route}'`)) {
    failures.push(`${relative}: 未进入 VuePress 导航或侧栏`);
  }
}

const apiDoc = await readFile(path.join(docsRoot, 'dev', 'API-SURFACE.zh-CN.md'), 'utf8');
const publicEntry = await readFile(path.join(repoRoot, 'packages', 'ts', 'src', 'index.ts'), 'utf8');
for (const name of ['sm2DecryptBytes', 'sm4DecryptBytes', 'zucDecryptBytes', 'eea3Encrypt', 'clearCustomRNG', 'hasCustomRNG', 'constantTimeEqual']) {
  if (!publicEntry.includes(name)) failures.push(`src/index.ts 缺少预期公开 API: ${name}`);
  if (!apiDoc.includes(`\`${name}\``)) failures.push(`API-SURFACE.zh-CN.md 缺少公开 API: ${name}`);
}

if (failures.length > 0) {
  console.error('[docs-check] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[docs-check] PASS: ${markdownFiles.length} 个页面均已检查`);
