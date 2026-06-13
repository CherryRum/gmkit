import { execSync } from 'node:child_process';
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
  packInfo = data[0];
} catch (error) {
  console.error('[audit-pack-size] Failed to parse npm pack json output.');
  console.error(String(error));
  process.exit(1);
}

const packedKB = packInfo.size / 1024;
const unpackedKB = packInfo.unpackedSize / 1024;
const files = [...packInfo.files].sort((a, b) => b.size - a.size);
const mapFiles = files.filter((file) => file.path.endsWith('.map'));

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
