import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const maxPackedKB = Number(process.env.PACK_MAX_KB || 320);
const maxUnpackedKB = Number(process.env.UNPACKED_MAX_KB || 900);
const allowSourceMap = process.env.ALLOW_SOURCEMAP === '1';

let stdout = '';
try {
  stdout = execSync(`${npmCmd} pack --json --dry-run --loglevel error`, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (error) {
  const stderr = error?.stderr ? String(error.stderr) : '';
  const message = stderr || String(error);
  console.error('[audit-pack-size] npm pack failed.');
  console.error(message);
  process.exit(1);
}

let packInfo;
try {
  const data = JSON.parse(stdout);
  // npm 11 返回数组，npm 12 在 workspace 中返回以包名为键的对象。
  const candidates = Array.isArray(data)
    ? data
    : data?.name
      ? [data]
      : Object.values(data ?? {});
  if (candidates.length !== 1) {
    throw new Error(`expected one package, received ${candidates.length}`);
  }
  [packInfo] = candidates;
} catch (error) {
  console.error('[audit-pack-size] Failed to parse npm pack json output.');
  console.error(String(error));
  process.exit(1);
}

const packedKB = packInfo.size / 1024;
const unpackedKB = packInfo.unpackedSize / 1024;
const files = [...packInfo.files].sort((a, b) => b.size - a.size);
const mapFiles = files.filter((file) => file.path.endsWith('.map'));
const packedPaths = new Set(files.map((file) => file.path.replace(/\\/g, '/')));

console.log('[audit-pack-size] npm package preview');
console.log(`- name: ${packInfo.name}@${packInfo.version}`);
console.log(`- tarball: ${packInfo.filename}`);
console.log(`- packed size: ${packedKB.toFixed(2)} KB`);
console.log(`- unpacked size: ${unpackedKB.toFixed(2)} KB`);
console.log(`- file count: ${packInfo.entryCount}`);
console.log('- top files:');
for (const file of files.slice(0, 10)) {
  console.log(`  - ${file.path} (${(file.size / 1024).toFixed(2)} KB)`);
}

const violations = [];
const requiredFiles = [
  'LICENSE',
  'README.md',
  'THIRD_PARTY_NOTICES.md',
  'dist/index.cjs',
  'dist/index.d.cts',
  'dist/index.d.ts',
  'dist/index.global.js',
  'dist/index.js',
  'package.json',
];
for (const requiredFile of requiredFiles) {
  if (!packedPaths.has(requiredFile)) {
    violations.push(`required package file is missing: ${requiredFile}`);
  }
}

const manifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const dependency of ['@noble/curves', '@noble/hashes']) {
  if (manifest.dependencies?.[dependency]) {
    violations.push(`${dependency} must not be a runtime dependency because it is bundled into dist`);
  }
}

for (const declarationFile of ['dist/index.d.ts', 'dist/index.d.cts']) {
  const declarationPath = path.join(root, declarationFile);
  if (packedPaths.has(declarationFile)) {
    const declarations = readFileSync(declarationPath, 'utf8');
    if (/\bfrom\s+['"]@noble\//.test(declarations) || /\bimport\(['"]@noble\//.test(declarations)) {
      violations.push(`${declarationFile} leaks @noble types to package consumers`);
    }
  }
}

if (packedKB > maxPackedKB) {
  violations.push(`packed size ${packedKB.toFixed(2)} KB exceeds ${maxPackedKB} KB`);
}
if (unpackedKB > maxUnpackedKB) {
  violations.push(`unpacked size ${unpackedKB.toFixed(2)} KB exceeds ${maxUnpackedKB} KB`);
}
if (!allowSourceMap && mapFiles.length > 0) {
  violations.push(`source map files detected (${mapFiles.length})`);
}

if (violations.length > 0) {
  console.error('\n[audit-pack-size] FAILED');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  console.error('\nHint: disable sourcemap for release build or raise limits via PACK_MAX_KB / UNPACKED_MAX_KB.');
  process.exit(1);
}

console.log('\n[audit-pack-size] PASS');
