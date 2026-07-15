#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const nativeEntries = Object.freeze([
  'native/darwin-aarch64/libgmkitsm9.dylib',
  'native/darwin-aarch64/libgmssl.3.dylib',
  'native/darwin-x86_64/libgmkitsm9.dylib',
  'native/darwin-x86_64/libgmssl.3.dylib',
  'native/linux-aarch64/libgmkitsm9.so',
  'native/linux-aarch64/libgmssl.so.3',
  'native/linux-x86_64/libgmkitsm9.so',
  'native/linux-x86_64/libgmssl.so.3',
  'native/windows-x86_64/gmkitsm9.dll',
  'native/windows-x86_64/gmssl.dll',
])

function parseArgs(argv) {
  const args = new Map()
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index]
    if (!key?.startsWith('--')) throw new Error(`参数格式错误：${key}`)
    if (key === '--require-signatures') {
      args.set('require-signatures', 'true')
      continue
    }
    const value = argv[index + 1]
    if (!value) throw new Error(`缺少 ${key} 的值`)
    args.set(key.slice(2), value)
    index += 1
  }
  return args
}

function required(args, key) {
  const value = args.get(key)
  if (!value) throw new Error(`缺少参数 --${key}`)
  return value
}

async function requireFile(path) {
  if (!(await stat(path).catch(() => null))?.isFile()) {
    throw new Error(`缺少发布文件：${path}`)
  }
}

async function verifyArtifact(repository, artifact, version, files, signatures) {
  const directory = join(repository, 'cn', 'gmkit', artifact, version)
  for (const suffix of files) {
    const file = join(directory, `${artifact}-${version}${suffix}`)
    await requireFile(file)
    if (signatures) await requireFile(`${file}.asc`)
  }
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

async function verifySm9Jar(jarFile, gmsslCommit) {
  const listing = execFileSync('jar', ['--list', '--file', jarFile], { encoding: 'utf8' })
    .split(/\r?\n/u)
    .filter(Boolean)
  const actualNative = listing.filter((entry) => entry.startsWith('native/') && !entry.endsWith('/')).sort()
  if (JSON.stringify(actualNative) !== JSON.stringify(nativeEntries)) {
    throw new Error(`SM9 native 文件清单不正确：\n${actualNative.join('\n')}`)
  }

  for (const entry of [
    'META-INF/LICENSE',
    'META-INF/NOTICE',
    'META-INF/licenses/gmssl/LICENSE',
    'META-INF/gmkit/sm9-native.properties',
    'META-INF/gmkit/sm9-native.sha256',
  ]) {
    if (!listing.includes(entry)) throw new Error(`SM9 JAR 缺少 ${entry}`)
  }

  const extractDir = await mkdtemp(join(tmpdir(), 'gmkit-sm9-audit-'))
  try {
    execFileSync('jar', ['--extract', '--file', jarFile], { cwd: extractDir })
    const properties = await readFile(join(extractDir, 'META-INF', 'gmkit', 'sm9-native.properties'), 'utf8')
    if (!properties.includes(`gmssl.commit=${gmsslCommit}`)) {
      throw new Error(`SM9 JAR 未记录 GmSSL commit ${gmsslCommit}`)
    }

    const manifest = await readFile(join(extractDir, 'META-INF', 'gmkit', 'sm9-native.sha256'), 'utf8')
    const declared = new Map(manifest.trim().split(/\r?\n/u).map((line) => {
      const match = /^([0-9a-f]{64})  (native\/.+)$/u.exec(line)
      if (!match) throw new Error(`非法 SHA-256 记录：${line}`)
      return [match[2], match[1]]
    }))
    for (const entry of nativeEntries) {
      const actual = await sha256(join(extractDir, ...entry.split('/')))
      if (declared.get(entry) !== actual) throw new Error(`SHA-256 不匹配：${entry}`)
    }
    if (declared.size !== nativeEntries.length) throw new Error('SHA-256 清单包含非预期文件')
  } finally {
    await rm(extractDir, { recursive: true, force: true })
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const repository = resolve(required(args, 'repository'))
  const version = required(args, 'version')
  const gmsslCommit = required(args, 'gmssl-commit')
  const signatures = args.get('require-signatures') === 'true'
  const groupDir = join(repository, 'cn', 'gmkit')
  const expectedArtifacts = ['gmkit', 'gmkit-bom', 'gmkit-parent', 'gmkit-sm9']
  const actualArtifacts = (await readdir(groupDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  if (JSON.stringify(actualArtifacts) !== JSON.stringify(expectedArtifacts)) {
    throw new Error(`发布仓库只能包含四个 artifact，实际为：${actualArtifacts.join(', ')}`)
  }

  await verifyArtifact(repository, 'gmkit-parent', version, ['.pom'], signatures)
  await verifyArtifact(repository, 'gmkit-bom', version, ['.pom'], signatures)
  await verifyArtifact(repository, 'gmkit', version, ['.pom', '.jar', '-sources.jar', '-javadoc.jar'], signatures)
  await verifyArtifact(repository, 'gmkit-sm9', version, ['.pom', '.jar', '-sources.jar', '-javadoc.jar'], signatures)
  await verifySm9Jar(join(groupDir, 'gmkit-sm9', version, `gmkit-sm9-${version}.jar`), gmsslCommit)

  process.stdout.write(`Maven release audit passed: cn.gmkit:*:${version}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`)
  process.exitCode = 1
})
