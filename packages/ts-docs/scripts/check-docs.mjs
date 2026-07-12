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

// 文档中的 shell 注释和示例链接不属于页面结构，扫描前先移除围栏代码块。
function stripFencedCode(content) {
  return content.replace(/^(?:```|~~~)[^\r\n]*\r?\n[\s\S]*?^(?:```|~~~)\s*$/gm, '');
}

function readFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return null;
  const title = match[1].match(/^title:\s*(.+?)\s*$/m)?.[1];
  return { title };
}

function publicExportNames(source) {
  const names = new Set();

  for (const match of source.matchAll(/^export\s+(?:declare\s+)?(?:const|let|var|function|class|interface|enum|type)\s+([A-Za-z_$][\w$]*)/gm)) {
    names.add(match[1]);
  }

  for (const match of source.matchAll(/^export\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+['"][^'"]+['"];?/gm)) {
    for (const entry of match[1].split(',')) {
      const cleaned = entry.trim().replace(/^type\s+/, '');
      if (!cleaned) continue;
      const parts = cleaned.split(/\s+as\s+/);
      names.add(parts.at(-1));
    }
  }

  return [...names].sort();
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
  const prose = stripFencedCode(content);

  if (path.basename(file) !== 'README.md') {
    const frontmatter = readFrontmatter(content);
    if (!frontmatter) failures.push(`${relative}: 缺少 YAML frontmatter`);
    else if (!frontmatter.title) failures.push(`${relative}: frontmatter 缺少 title`);

    const headings = [...prose.matchAll(/^#\s+(.+?)\s*$/gm)].map((match) => match[1]);
    if (headings.length !== 1) failures.push(`${relative}: 页面正文应只有一个 H1，实际为 ${headings.length}`);
  }

  for (const forbidden of [
    'github.com/CherryRum/gmkit',
    'gmkits/gmkit-java',
    'test/vectors/interop.json',
  ]) {
    if (content.includes(forbidden)) failures.push(`${relative}: 包含过期引用 ${forbidden}`);
  }

  const links = prose.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g);
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
for (const name of publicExportNames(publicEntry)) {
  if (!apiDoc.includes(`\`${name}\``)) failures.push(`API-SURFACE.zh-CN.md 缺少公开 API: ${name}`);
}

const vectors = JSON.parse(await readFile(path.join(repoRoot, 'vectors', 'interop.json'), 'utf8'));
const vectorIds = new Set();
for (const [index, vector] of vectors.cases.entries()) {
  for (const field of ['id', 'algo', 'op', 'expected']) {
    if (vector[field] === undefined) failures.push(`vectors/interop.json cases[${index}] 缺少字段 ${field}`);
  }
  if (vectorIds.has(vector.id)) failures.push(`vectors/interop.json 包含重复 id: ${vector.id}`);
  vectorIds.add(vector.id);
  if (vector.source && typeof vector.source !== 'string') {
    failures.push(`vectors/interop.json ${vector.id} 的 source 必须是字符串`);
  }
}

if (failures.length > 0) {
  console.error('[docs-check] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[docs-check] PASS: ${markdownFiles.length} 个页面均已检查`);
