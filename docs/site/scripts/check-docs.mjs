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
  if (relative === 'README.md') return '/';
  if (relative.endsWith('/README.md')) return `/${relative.slice(0, -'README.md'.length)}`;
  return `/${relative.replace(/\.md$/, '')}`;
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

function requireMatch(content, pattern, label) {
  const value = content.match(pattern)?.[1];
  if (!value) failures.push(`无法从 ${label} 读取版本`);
  return value;
}

function requireDocumentedVersion(document, version, label) {
  if (version && !document.includes(version)) failures.push(`${label} 未声明清单版本 ${version}`);
}

function linkCandidates(source, link) {
  const cleaned = stripQueryAndHash(link);
  const base = cleaned.startsWith('/')
    ? path.join(docsRoot, cleaned.slice(1))
    : path.resolve(path.dirname(source), cleaned);
  // `.zh-CN` 是页面名的一部分，不是 Markdown 扩展名；只有明确的文件后缀才直接读取。
  if (/\.(?:md|png|jpe?g|gif|svg|webp|pdf|zip)$/i.test(base)) return [base];
  return [base, `${base}.md`, path.join(base, 'README.md')];
}

const markdownFiles = await walk(docsRoot);
const config = await readFile(configPath, 'utf8');
const failures = [];
const forbiddenClaims = [
  '生产级',
  '完全兼容',
  '完整合规',
  '绝对安全',
  '性能领先',
  '100%兼容',
  '全面支持所有',
  '完全符合',
];

async function checkLocalLinks(file, content, relative) {
  const prose = stripFencedCode(content);
  const links = prose.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g);
  for (const [, link] of links) {
    if (/^(?:https?:|mailto:|#)/.test(link)) continue;
    // TypeDoc/Javadoc 只在构建阶段写入站点目录，不在文档源码中提交生成文件。
    if (/^\/api\/(?:typescript|java)\/(?:latest|versions\/[^/]+)\/?$/.test(stripQueryAndHash(link))) {
      continue;
    }
    const candidates = linkCandidates(file, link);
    const exists = await Promise.all(candidates.map(async (candidate) => {
      try { return (await stat(candidate)).isFile(); } catch { return false; }
    }));
    if (!exists.some(Boolean)) failures.push(`${relative}: 站内链接不存在 ${link}`);
  }
}

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
    'gmkit.oldletter.cn',
    'test/vectors/interop.json',
    'gmkitx@latest',
  ]) {
    if (content.includes(forbidden)) failures.push(`${relative}: 包含过期引用 ${forbidden}`);
  }

  // 文档只陈述可由固定测试、标准来源或发布制品核对的结论。
  for (const claim of forbiddenClaims) {
    if (prose.includes(claim)) failures.push(`${relative}: 包含缺少证据边界的表述 ${claim}`);
  }

  await checkLocalLinks(file, content, relative);

  const route = routeFor(file);
  if (route !== '/' && !config.includes(`'${route}'`)) {
    failures.push(`${relative}: 未进入 VuePress 导航或侧栏`);
  }
}

// 包 README 和根级发布文档不属于 VuePress 路由，但其中的相对链接同样会展示给使用者。
for (const relative of [
  'README.md',
  'packages/ts/README.md',
  'packages/java/README.md',
  'vectors/README.md',
  'docs/API_STABILITY.md',
]) {
  const file = path.join(repoRoot, relative);
  await checkLocalLinks(file, await readFile(file, 'utf8'), relative);
}

const apiDoc = await readFile(path.join(docsRoot, 'typescript', 'api-surface.md'), 'utf8');
const publicEntry = await readFile(path.join(repoRoot, 'packages', 'ts', 'src', 'index.ts'), 'utf8');
for (const name of publicExportNames(publicEntry)) {
  if (!apiDoc.includes(`\`${name}\``)) failures.push(`API-SURFACE.zh-CN.md 缺少公开 API: ${name}`);
}

// 正式发布文档中的版本必须来自构建清单，避免升级后保留可运行但过期的样例。
const rootPackage = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
const tsPackage = JSON.parse(await readFile(path.join(repoRoot, 'packages', 'ts', 'package.json'), 'utf8'));
const docsPackage = JSON.parse(await readFile(path.join(docsRoot, 'package.json'), 'utf8'));
if (rootPackage.version !== tsPackage.version || rootPackage.version !== docsPackage.version) {
  failures.push(`workspace 版本不一致: root=${rootPackage.version}, ts=${tsPackage.version}, docs=${docsPackage.version}`);
}

for (const relative of ['README.md', 'guide/README.md', 'typescript/README.md']) {
  const content = await readFile(path.join(docsRoot, relative), 'utf8');
  requireDocumentedVersion(content, tsPackage.version, relative);
}

const javaPom = await readFile(path.join(repoRoot, 'packages', 'java', 'pom.xml'), 'utf8');
const javaVersion = requireMatch(javaPom, /<artifactId>gmkit-parent<\/artifactId>\s*<version>([^<]+)<\/version>/, 'packages/java/pom.xml');
const javaGuide = await readFile(path.join(docsRoot, 'java', 'guide.md'), 'utf8');
requireDocumentedVersion(javaGuide, javaVersion, 'JAVA-LIBRARY.zh-CN.md');
for (const relative of ['README.md', 'guide/README.md', 'java/README.md']) {
  const content = await readFile(path.join(docsRoot, relative), 'utf8');
  requireDocumentedVersion(content, javaVersion, relative);
}

const goMod = await readFile(path.join(docsRoot, 'examples', 'go', 'go.mod'), 'utf8');
const goGmsmVersion = requireMatch(goMod, /github\.com\/emmansun\/gmsm\s+(v[^\s]+)/, 'examples/go/go.mod');
const goGuide = await readFile(path.join(docsRoot, 'integrations', 'go.md'), 'utf8');
requireDocumentedVersion(goGuide, goGmsmVersion, 'GO-INTEGRATION.zh-CN.md');

const requirements = await readFile(path.join(docsRoot, 'examples', 'python', 'requirements.txt'), 'utf8');
const pythonGmsslVersion = requireMatch(requirements, /^gmssl==([^\s]+)$/m, 'examples/python/requirements.txt');
const pythonGuide = await readFile(path.join(docsRoot, 'integrations', 'python.md'), 'utf8');
requireDocumentedVersion(pythonGuide, pythonGmsslVersion, 'PYTHON-INTEGRATION.zh-CN.md');

const cargoToml = await readFile(path.join(docsRoot, 'examples', 'rust', 'Cargo.toml'), 'utf8');
const rustGuide = await readFile(path.join(docsRoot, 'integrations', 'rust.md'), 'utf8');
for (const crate of ['sm3', 'sm4']) {
  const version = requireMatch(cargoToml, new RegExp(`^${crate}\\s*=\\s*"([^"]+)"$`, 'm'), `examples/rust/Cargo.toml ${crate}`);
  requireDocumentedVersion(rustGuide, version, `RUST-INTEGRATION.zh-CN.md ${crate}`);
}

const hutoolPom = await readFile(path.join(docsRoot, 'examples', 'hutool', 'pom.xml'), 'utf8');
const hutoolGuide = await readFile(path.join(docsRoot, 'integrations', 'java-hutool.md'), 'utf8');
for (const artifact of ['hutool-crypto', 'bcprov-jdk15to18']) {
  const version = requireMatch(
    hutoolPom,
    new RegExp(`<artifactId>${artifact}<\\/artifactId>\\s*<version>([^<]+)<\\/version>`),
    `examples/hutool/pom.xml ${artifact}`,
  );
  requireDocumentedVersion(hutoolGuide, version, `JAVA-INTEGRATION.zh-CN.md ${artifact}`);
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
