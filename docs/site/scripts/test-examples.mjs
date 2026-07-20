import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const examplesRoot = path.join(docsRoot, 'examples');
const only = process.env.DOC_EXAMPLE_ONLY?.split(',').map((item) => item.trim()).filter(Boolean);
const mavenExample = process.platform === 'win32'
  ? { command: process.env.ComSpec ?? 'cmd.exe', args: ['/d', '/s', '/c', 'mvn -B -ntp test'] }
  : { command: 'mvn', args: ['-B', '-ntp', 'test'] };

const examples = [
  { name: 'gmkit', command: process.execPath, args: ['gmkit-release.mjs'], cwd: path.join(examplesRoot, 'node') },
  { name: 'api-typescript', command: process.execPath, args: ['public-api-manual.mjs'], cwd: path.join(examplesRoot, 'node') },
  { name: 'node', command: process.execPath, args: ['international-crypto.mjs'], cwd: path.join(examplesRoot, 'node') },
  { name: 'go', command: 'go', args: ['test', './...'], cwd: path.join(examplesRoot, 'go') },
  { name: 'python', custom: runPythonExample },
  { name: 'rust', custom: runRustExample },
  {
    name: 'hutool',
    ...mavenExample,
    cwd: path.join(examplesRoot, 'hutool'),
  },
].filter(({ name }) => !only || only.includes(name));

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    console.log(`[docs-examples] $ ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: 'inherit',
      shell: false,
      env: options.env ?? process.env,
    });
    child.on('error', reject);
    child.on('exit', (code) => code === 0
      ? resolve()
      : reject(new Error(`${command} 退出码 ${code}`)));
  });
}

async function runPythonExample() {
  const cwd = path.join(examplesRoot, 'python');
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'gmkit-docs-python-'));
  const venv = path.join(temporary, '.venv');
  const systemPython = process.env.PYTHON
    ?? (process.platform === 'win32' ? 'python' : 'python3');
  const python = process.platform === 'win32'
    ? path.join(venv, 'Scripts', 'python.exe')
    : path.join(venv, 'bin', 'python');
  try {
    await runCommand(systemPython, ['-m', 'venv', venv], { cwd });
    await runCommand(python, ['-m', 'pip', 'install', '--disable-pip-version-check', '-r', 'requirements.txt'], { cwd });
    await runCommand(python, ['verify_vectors.py'], { cwd });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

async function runRustExample() {
  const cwd = path.join(examplesRoot, 'rust');
  const cargoHome = await mkdtemp(path.join(os.tmpdir(), 'gmkit-docs-cargo-'));
  await mkdir(cargoHome, { recursive: true });
  try {
    await runCommand('cargo', ['test', '--locked'], {
      cwd,
      env: {
        ...process.env,
        CARGO_HOME: cargoHome,
        CARGO_REGISTRIES_CRATES_IO_PROTOCOL: 'sparse',
      },
    });
  } finally {
    await rm(cargoHome, { recursive: true, force: true });
  }
}

for (const example of examples) {
  console.log(`\n[docs-examples] ${example.name}`);
  if (example.custom) await example.custom();
  else await runCommand(example.command, example.args, { cwd: example.cwd });
}
console.log(`\n[docs-examples] PASS: ${examples.map(({ name }) => name).join(', ')}`);
