import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(docsRoot, '..', '..');
const failures = [];

async function requireFile(file, label) {
  try {
    if (!(await stat(file)).isFile()) failures.push(`${label} 不是文件: ${file}`);
  } catch {
    failures.push(`${label} 不存在: ${file}`);
  }
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
      names.add(cleaned.split(/\s+as\s+/).at(-1));
    }
  }
  return [...names].sort();
}

function collectNames(value, names = new Set()) {
  if (Array.isArray(value)) {
    for (const entry of value) collectNames(entry, names);
  } else if (value && typeof value === 'object') {
    if (typeof value.name === 'string') names.add(value.name);
    for (const entry of Object.values(value)) collectNames(entry, names);
  }
  return names;
}

const rootPackage = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
const tsPackage = JSON.parse(await readFile(path.join(repoRoot, 'packages', 'ts', 'package.json'), 'utf8'));
const docsPackage = JSON.parse(await readFile(path.join(docsRoot, 'package.json'), 'utf8'));
const catalog = JSON.parse(await readFile(path.join(docsRoot, 'catalog', 'packages.json'), 'utf8'));
const packageIds = new Set();

for (const entry of catalog.packages) {
  if (packageIds.has(entry.id)) failures.push(`包目录 id 重复: ${entry.id}`);
  packageIds.add(entry.id);
  for (const field of ['id', 'name', 'ecosystem', 'coordinates', 'version', 'tagPrefix', 'guide', 'api', 'apiGenerator', 'testCommand']) {
    if (entry[field] === undefined || entry[field] === '') failures.push(`包目录 ${entry.id ?? '<unknown>'} 缺少 ${field}`);
  }
}

const tsCatalog = catalog.packages.find(({ id }) => id === 'typescript');
const javaCatalog = catalog.packages.find(({ id }) => id === 'java');
if (tsCatalog?.version !== tsPackage.version || tsPackage.version !== rootPackage.version || docsPackage.version !== rootPackage.version) {
  failures.push(`TypeScript/workspace 版本不一致: catalog=${tsCatalog?.version}, package=${tsPackage.version}, docs=${docsPackage.version}, root=${rootPackage.version}`);
}

const javaPom = await readFile(path.join(repoRoot, 'packages', 'java', 'pom.xml'), 'utf8');
const javaVersion = javaPom.match(/<artifactId>gmkit-parent<\/artifactId>\s*<version>([^<]+)<\/version>/)?.[1];
if (!javaVersion || javaCatalog?.version !== javaVersion) {
  failures.push(`Java 版本不一致: catalog=${javaCatalog?.version}, pom=${javaVersion ?? '<missing>'}`);
}

const tsJsonPath = path.join(docsRoot, '.vuepress', 'api-typescript.json');
const tsReflection = JSON.parse(await readFile(tsJsonPath, 'utf8'));
const documentedNames = collectNames(tsReflection);
const tsEntry = await readFile(path.join(repoRoot, 'packages', 'ts', 'src', 'index.ts'), 'utf8');
for (const exported of publicExportNames(tsEntry)) {
  if (!documentedNames.has(exported)) failures.push(`TypeDoc 缺少公开导出: ${exported}`);
}

const publicApi = path.join(docsRoot, '.vuepress', 'public', 'api');
await requireFile(path.join(publicApi, 'typescript', 'latest', 'index.html'), 'TypeDoc 首页');
await requireFile(path.join(publicApi, 'java', 'latest', 'index.html'), 'Javadoc 首页');
await requireFile(path.join(publicApi, 'java', 'latest', 'cn', 'gmkit', 'sm2', 'SM2.html'), 'SM2 Javadoc');
await requireFile(path.join(publicApi, 'java', 'latest', 'cn', 'gmkit', 'sm3', 'SM3.html'), 'SM3 Javadoc');
await requireFile(path.join(publicApi, 'java', 'latest', 'cn', 'gmkit', 'sm4', 'SM4.html'), 'SM4 Javadoc');
await requireFile(path.join(publicApi, 'java', 'latest', 'cn', 'gmkit', 'zuc', 'ZUC.html'), 'ZUC Javadoc');
await requireFile(path.join(publicApi, 'java', 'latest', 'cn', 'gmkit', 'sm9', 'SM9.html'), 'SM9 Javadoc');
await requireFile(path.join(publicApi, 'manifest.json'), 'API 生成清单');
const versionsPath = path.join(publicApi, 'versions.json');
await requireFile(versionsPath, 'API 版本清单');
const versionsManifest = JSON.parse(await readFile(versionsPath, 'utf8'));
for (const entry of versionsManifest.packages ?? []) {
  if (!packageIds.has(entry.id)) failures.push(`API 版本清单包含未知包: ${entry.id}`);
  for (const version of entry.versions ?? []) {
    if (!/^\d+\.\d+\.\d+$/.test(version.version)) {
      failures.push(`API 版本清单包含非稳定版本: ${entry.id} ${version.version}`);
    }
    if (version.url !== `/api/${entry.id}/versions/${version.version}/`) {
      failures.push(`API 版本清单 URL 错误: ${entry.id} ${version.version}`);
    }
  }
}
for (const id of packageIds) {
  const entry = versionsManifest.packages?.find((candidate) => candidate.id === id);
  if (!entry || !Array.isArray(entry.versions) || entry.versions.length === 0) {
    failures.push(`API 版本清单缺少已发布版本: ${id}`);
  }
}

if (failures.length > 0) {
  console.error('[docs-api-check] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[docs-api-check] PASS: ${publicExportNames(tsEntry).length} 个 TypeScript 顶层导出，Java/SM9 聚合 Javadoc 已生成`);
