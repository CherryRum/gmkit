#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, parse, resolve } from 'node:path'

const platformFiles = Object.freeze({
  'linux-x86_64': ['libgmkitsm9.so', 'libgmssl.so.3'],
  'linux-aarch64': ['libgmkitsm9.so', 'libgmssl.so.3'],
  'darwin-x86_64': ['libgmkitsm9.dylib', 'libgmssl.3.dylib'],
  'darwin-aarch64': ['libgmkitsm9.dylib', 'libgmssl.3.dylib'],
  'windows-x86_64': ['gmkitsm9.dll', 'gmssl.dll'],
})

function parseArgs(argv) {
  const args = new Map()
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (!key?.startsWith('--') || !value) {
      throw new Error(`参数格式错误：${key ?? '<empty>'}`)
    }
    args.set(key.slice(2), value)
  }
  return args
}

function required(args, key) {
  const value = args.get(key)
  if (!value) throw new Error(`缺少参数 --${key}`)
  return value
}

function assertSafeOutput(output) {
  const root = parse(output).root
  if (output === root || output === resolve('.')) {
    throw new Error(`拒绝清理危险输出目录：${output}`)
  }
}

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = resolve(required(args, 'input'))
  const output = resolve(required(args, 'output'))
  const gmsslCommit = required(args, 'gmssl-commit')
  const gmsslVersion = args.get('gmssl-version') ?? '3.1.1'

  assertSafeOutput(output)
  await rm(resolve(output, 'native'), { recursive: true, force: true })
  await rm(resolve(output, 'META-INF', 'gmkit'), { recursive: true, force: true })

  const hashes = []
  for (const [platform, files] of Object.entries(platformFiles)) {
    for (const file of files) {
      const source = resolve(input, platform, file)
      const relative = `native/${platform}/${file}`
      const target = resolve(output, relative)
      await mkdir(dirname(target), { recursive: true })
      await copyFile(source, target)
      hashes.push(`${await sha256(target)}  ${relative}`)
    }
  }

  // 元数据不写构建时间，保证相同二进制生成相同 JAR 内容。
  const metadataDir = resolve(output, 'META-INF', 'gmkit')
  await mkdir(metadataDir, { recursive: true })
  const properties = [
    'bundle.format=1',
    `gmssl.version=${gmsslVersion}`,
    `gmssl.commit=${gmsslCommit}`,
    `platforms=${Object.keys(platformFiles).join(',')}`,
    '',
  ].join('\n')
  await writeFile(resolve(metadataDir, 'sm9-native.properties'), properties, 'utf8')
  await writeFile(resolve(metadataDir, 'sm9-native.sha256'), `${hashes.sort().join('\n')}\n`, 'utf8')

  process.stdout.write(`SM9 runtime bundle assembled: ${output}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`)
  process.exitCode = 1
})
