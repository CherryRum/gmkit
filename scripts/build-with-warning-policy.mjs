import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const warningIndicators = [
  /entry module .*using named and default exports together/i,
  /output\.exports:\s*"named"/i,
  /\bwarning\b/i,
  /\bwarn\b/i,
];

const knownWarnings = [
  /entry module .*using named and default exports together/i,
  /output\.exports:\s*"named"/i,
];

const ignoredNoise = [
  /npm warn unknown user config "home"/i,
  /npm warn unknown env config "home"/i,
];

const stripAnsi = (text) => text.replace(/\x1b\[[0-9;]*m/g, '');

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(`${npmCmd} run build:raw --silent`, {
      cwd: root,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let combined = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      combined += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      combined += text;
      process.stderr.write(text);
    });

    child.on('error', reject);
    child.on('close', (code) => resolve({ code, output: combined }));
  });
}

const { code, output } = await runBuild();
if (code !== 0) {
  process.exit(code ?? 1);
}

const lines = stripAnsi(output)
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const warningLines = lines.filter((line) => warningIndicators.some((rule) => rule.test(line)));
const filteredWarnings = warningLines.filter(
  (line) => !ignoredNoise.some((rule) => rule.test(line))
);
const unknownWarnings = warningLines.filter(
  (line) => !knownWarnings.some((rule) => rule.test(line)) && !ignoredNoise.some((rule) => rule.test(line))
);

if (unknownWarnings.length > 0) {
  console.error('\n[build-warning-policy] Found unexpected build warnings:');
  for (const line of unknownWarnings) {
    console.error(`- ${line}`);
  }
  process.exit(1);
}

if (filteredWarnings.length > 0) {
  console.warn('\n[build-warning-policy] Known warnings detected and accepted by policy:');
  for (const line of filteredWarnings) {
    console.warn(`- ${line}`);
  }
  console.warn('[build-warning-policy] Recommendation: keep default export for compatibility or migrate to named-only exports in a major release.');
}
