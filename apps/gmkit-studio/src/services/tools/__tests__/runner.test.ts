import { describe, expect, it } from 'vitest';

import { getTool, tools } from '@/data/studio-tools';
import { runStudioTool } from '@/services/tools/runner';
import type { ToolOutputField, ToolRunResult, ToolValues } from '@/services/tools/types';
import { formatJsonTextForTest } from '@/workers/json.worker';

function tool(id: string) {
  const item = getTool(id);
  if (!item) throw new Error(`missing tool ${id}`);
  return item;
}

function field(result: ToolRunResult, key: string): ToolOutputField {
  const item = result.fields?.find((candidate) => candidate.key === key);
  if (!item) throw new Error(`missing field ${key}`);
  return item;
}

async function run(id: string, tab: string, input: string, options: ToolValues = {}) {
  return runStudioTool({ tool: tool(id), tab, input, output: '', options });
}

describe('studio tool runners', () => {
  it('formats JSON with the worker pure formatter', () => {
    expect(formatJsonTextForTest('{"b":1,"a":2}', '2')).toContain('\n  "b": 1');
  });

  it('runs Base64 encoding', async () => {
    const result = await run('base64', '编码', 'GMKit');
    expect(result.status).toBe('success');
    expect(result.output).toBe('R01LaXQ=');
    expect(field(result, 'base64').copyable).toBe(true);
  });

  it('runs SM3 digest through gmkitx', async () => {
    const result = await run('sm3', '摘要', 'abc', { outputEncoding: 'Hex', case: 'Lower' });
    expect(result.status).toBe('success');
    expect(result.output).toContain('66c7f0f4');
  });

  it('returns SM2 keys as copyable hex/base64 fields including compressed public key', async () => {
    const result = await run('sm2', '密钥', '');
    expect(result.status).toBe('success');
    expect(field(result, 'privateKeyHex').secret).toBe(true);
    expect(field(result, 'publicKeyBase64').value).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(field(result, 'compressedPublicKeyHex').value).toHaveLength(66);
  });

  it('generates symmetric keys as separate key and iv fields', async () => {
    const result = await run('keygen', '生成', '', { type: 'SM4' });
    expect(result.status).toBe('success');
    expect(field(result, 'keyHex').value).toHaveLength(32);
    expect(field(result, 'keyBase64').value).toBeTruthy();
    expect(field(result, 'ivHex').value).toHaveLength(32);
  });

  it('runs RSA OAEP encrypt/decrypt and PSS sign/verify', async () => {
    const oaep = await run('rsa', '生成密钥', '', { usage: 'OAEP 加解密', hash: 'SHA-256', keyLength: '2048' });
    const publicJwk = JSON.parse(field(oaep, 'publicJwk').value);
    const privateJwk = JSON.parse(field(oaep, 'privateJwk').value);
    const encrypted = await run('rsa', '加密', JSON.stringify({ publicJwk, message: 'GMKit' }), { hash: 'SHA-256' });
    const decrypted = await run('rsa', '解密', JSON.stringify({ privateJwk, ciphertext: field(encrypted, 'ciphertext').value }), { hash: 'SHA-256' });
    expect(field(decrypted, 'plaintext').value).toBe('GMKit');

    const pss = await run('rsa', '生成密钥', '', { usage: 'PSS 签名验签', hash: 'SHA-256', keyLength: '2048' });
    const signPublicJwk = JSON.parse(field(pss, 'publicJwk').value);
    const signPrivateJwk = JSON.parse(field(pss, 'privateJwk').value);
    const signed = await run('rsa', '签名', JSON.stringify({ privateJwk: signPrivateJwk, message: 'GMKit' }), { hash: 'SHA-256', saltLength: '32' });
    const verified = await run('rsa', '验签', JSON.stringify({ publicJwk: signPublicJwk, message: 'GMKit', signature: field(signed, 'signature').value }), { hash: 'SHA-256', saltLength: '32' });
    expect(field(verified, 'valid').value).toBe('true');
  });

  it('generates and verifies JWT with jose and rejects wrong secrets', async () => {
    const generated = await run('jwt', '生成', '{"name":"GMKit"}', { algorithm: 'HS256', secret: 'correct' });
    const token = field(generated, 'token').value;
    const verified = await run('jwt', '验签', token, { algorithm: 'HS256', secret: 'correct' });
    expect(field(verified, 'valid').value).toBe('true');

    const rejected = await run('jwt', '验签', token, { algorithm: 'HS256', secret: 'wrong' });
    expect(rejected.status).toBe('error');
  });

  it('uses mature libraries for text and status helpers', async () => {
    const diff = await run('diff', '转换', 'hello\n---\nhello world', { mode: '词' });
    expect(field(diff, 'diff').value).toContain('+ world');

    const casing = await run('case', '转换', 'gmkit studio');
    expect(field(casing, 'pascalCase').value).toBe('GmkitStudio');

    const slug = await run('slug', '转换', 'GMKit Studio!!');
    expect(field(slug, 'slug').value).toBe('gmkit-studio');

    const status = await run('httpstatus', '查询', '418');
    expect(field(status, 'status').value).toContain("I'm a Teapot");
  });

  it('reports SM9 runtime errors instead of fake success', async () => {
    const result = await run('sm9', 'Java API', '{"operation":"sign","payload":{"message":"abc"}}', { endpoint: '' });
    expect(result.status).toBe('error');
    expect(result.detail).toContain('endpoint');
  });

  it('calculates CIDR ranges offline', async () => {
    const result = await run('cidr', '解析', '192.168.1.0/24');
    expect(result.status).toBe('success');
    expect(field(result, 'broadcast').value).toBe('192.168.1.255');
  });

  it('does not expose stale boolean options in the generic workbench catalog', () => {
    expect(tools.flatMap((item) => item.options).filter((option) => option.kind === 'boolean')).toHaveLength(0);
    expect(tool('sm2').options.some((option) => option.key === 'compressPublicKey')).toBe(false);
  });
});
