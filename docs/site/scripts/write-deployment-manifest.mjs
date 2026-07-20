import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(docsRoot, '..', '..');
const output = path.join(docsRoot, '.vuepress', 'dist', 'deployment.json');
const rootPackage = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
const catalog = JSON.parse(await readFile(path.join(docsRoot, 'catalog', 'packages.json'), 'utf8'));
const commit = process.env.GITHUB_SHA
  ?? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();

const deployment = {
  schemaVersion: 1,
  commit,
  builtAt: new Date().toISOString(),
  runId: process.env.GITHUB_RUN_ID ?? null,
  runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
  workspaceVersion: rootPackage.version,
  packages: Object.fromEntries(catalog.packages.map(({ id, version }) => [id, version])),
};

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(deployment, null, 2)}\n`, 'utf8');
console.log(`Deployment manifest written for ${commit}`);
