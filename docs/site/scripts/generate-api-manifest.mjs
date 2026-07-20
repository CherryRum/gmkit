import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(docsRoot, '..', '..');
const catalog = JSON.parse(await readFile(path.join(docsRoot, 'catalog', 'packages.json'), 'utf8'));
const output = path.join(docsRoot, '.vuepress', 'public', 'api', 'manifest.json');

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  packages: catalog.packages.map(({ id, name, ecosystem, coordinates, version, tagPrefix, api }) => ({
    id,
    name,
    ecosystem,
    coordinates,
    version,
    tagPrefix,
    api,
  })),
};

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`[docs-api] API manifest written to ${path.relative(repoRoot, output)}`);
