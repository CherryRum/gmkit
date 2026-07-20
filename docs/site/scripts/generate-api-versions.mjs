import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(process.env.GMKIT_GIT_ROOT ?? path.join(docsRoot, '..', '..'));
const outputArgument = process.argv.indexOf('--output');
const output = outputArgument >= 0
  ? path.resolve(process.argv[outputArgument + 1])
  : path.join(docsRoot, '.vuepress', 'public', 'api', 'versions.json');
const catalog = JSON.parse(await readFile(path.join(docsRoot, 'catalog', 'packages.json'), 'utf8'));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compareVersions(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return b[index] - a[index];
  }
  return 0;
}

const packages = catalog.packages.map(({ id, name, tagPrefix }) => {
  const stableTag = new RegExp(`^${escapeRegExp(tagPrefix)}(\\d+\\.\\d+\\.\\d+)$`);
  const tags = execFileSync('git', ['tag', '--list', `${tagPrefix}*`], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).split(/\r?\n/).filter(Boolean);
  const versions = tags
    .map((tag) => {
      const match = tag.match(stableTag);
      if (!match) return null;
      return {
        version: match[1],
        tag,
        url: `/api/${id}/versions/${match[1]}/`,
      };
    })
    .filter(Boolean)
    .sort((left, right) => compareVersions(left.version, right.version));

  if (versions.length === 0) {
    throw new Error(`没有找到 ${tagPrefix}<major.minor.patch> 稳定版本标签`);
  }

  return {
    id,
    name,
    latest: `/api/${id}/latest/`,
    versions,
  };
});

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  packages,
};

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`[docs-api] API version manifest written to ${path.relative(repoRoot, output)}`);
