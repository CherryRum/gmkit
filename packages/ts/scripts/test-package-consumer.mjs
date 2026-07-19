#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');

function runNpm(args, cwd) {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) {
    execFileSync(process.execPath, [npmExecPath, ...args], { cwd, stdio: 'inherit' });
    return;
  }
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  execFileSync(npmCommand, args, { cwd, stdio: 'inherit' });
}

function runNode(script, cwd) {
  execFileSync(process.execPath, [script], { cwd, stdio: 'inherit' });
}

const esmConsumer = `
import assert from 'node:assert/strict';
import gmkit, { DEFAULT_USER_ID, digest, sm2GenerateKeyPair, sm3Digest } from 'gmkitx';

const expected = '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0';
assert.equal(sm3Digest('abc'), expected);
assert.equal(digest('abc'), expected);
assert.equal(gmkit.sm3Digest('abc'), expected);
assert.equal(DEFAULT_USER_ID, '1234567812345678');
const keyPair = sm2GenerateKeyPair();
assert.match(keyPair.privateKey, /^[0-9a-f]{64}$/u);
assert.match(keyPair.publicKey, /^04[0-9a-f]{128}$/u);
`;

const cjsConsumer = `
'use strict';
const assert = require('node:assert/strict');
const gmkit = require('gmkitx');

const expected = '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0';
assert.equal(gmkit.sm3Digest('abc'), expected);
assert.equal(gmkit.digest('abc'), expected);
assert.equal(gmkit.default.sm3Digest('abc'), expected);
assert.equal(gmkit.DEFAULT_USER_ID, '1234567812345678');
`;

const tempRoot = await mkdtemp(path.join(tmpdir(), 'gmkitx-package-consumer-'));
try {
  const packDir = path.join(tempRoot, 'pack');
  const consumerDir = path.join(tempRoot, 'consumer');
  await mkdir(packDir);
  await mkdir(consumerDir);

  // 只测试真实 tarball，避免源码目录或 workspace 链接掩盖 exports/files 配置错误。
  runNpm(['pack', '--json', '--pack-destination', packDir], packageRoot);
  const tarballs = (await readdir(packDir)).filter((name) => name.endsWith('.tgz'));
  if (tarballs.length !== 1) {
    throw new Error(`expected one gmkitx tarball, received ${tarballs.length}`);
  }

  await writeFile(
    path.join(consumerDir, 'package.json'),
    JSON.stringify({ name: 'gmkitx-release-consumer', private: true, type: 'module' }, null, 2),
    'utf8',
  );
  const tarball = path.join(packDir, tarballs[0]);
  runNpm(
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', tarball],
    consumerDir,
  );

  const installedManifest = JSON.parse(
    await readFile(path.join(consumerDir, 'node_modules', 'gmkitx', 'package.json'), 'utf8'),
  );
  if (installedManifest.dependencies && Object.keys(installedManifest.dependencies).length > 0) {
    throw new Error('gmkitx tarball unexpectedly contains runtime dependencies');
  }

  const esmPath = path.join(consumerDir, 'consumer.mjs');
  const cjsPath = path.join(consumerDir, 'consumer.cjs');
  await writeFile(esmPath, esmConsumer, 'utf8');
  await writeFile(cjsPath, cjsConsumer, 'utf8');
  runNode(esmPath, consumerDir);
  runNode(cjsPath, consumerDir);

  const globalBundle = await readFile(
    path.join(consumerDir, 'node_modules', 'gmkitx', installedManifest.jsdelivr),
    'utf8',
  );
  const sandbox = { console, Uint8Array, TextEncoder, TextDecoder };
  vm.runInNewContext(globalBundle, sandbox, { filename: installedManifest.jsdelivr });
  const expected = '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0';
  if (sandbox.GMKit?.sm3Digest('abc') !== expected) {
    throw new Error('browser IIFE entry did not expose a working GMKit global');
  }

  process.stdout.write(`gmkitx package consumer passed on Node ${process.version}\n`);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
