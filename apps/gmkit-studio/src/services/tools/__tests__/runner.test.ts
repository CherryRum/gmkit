import { describe, expect, it } from 'vitest';

import { getTool } from '@/data/studio-tools';
import { runStudioTool } from '@/services/tools/runner';
import { formatJsonTextForTest } from '@/workers/json.worker';

function tool(id: string) {
  const item = getTool(id);
  if (!item) throw new Error(`missing tool ${id}`);
  return item;
}

describe('studio tool runners', () => {
  it('formats JSON with the worker pure formatter', () => {
    expect(formatJsonTextForTest('{"b":1,"a":2}', '2')).toContain('\n  "b": 1');
  });

  it('runs Base64 encoding', async () => {
    const result = await runStudioTool({
      tool: tool('base64'),
      tab: '编码',
      input: 'GMKit',
      output: '',
      options: {},
    });
    expect(result.status).toBe('success');
    expect(result.output).toBe('R01LaXQ=');
  });

  it('runs SM3 digest through gmkitx', async () => {
    const result = await runStudioTool({
      tool: tool('sm3'),
      tab: '摘要',
      input: 'abc',
      output: '',
      options: { outputEncoding: 'Hex', case: 'Lower' },
    });
    expect(result.status).toBe('success');
    expect(result.output).toContain('66c7f0f4');
  });

  it('reports SM9 runtime errors instead of fake success', async () => {
    const result = await runStudioTool({
      tool: tool('sm9'),
      tab: 'Java API',
      input: '{"operation":"sign","payload":{"message":"abc"}}',
      output: '',
      options: { endpoint: '' },
    });
    expect(result.status).toBe('error');
    expect(result.detail).toContain('endpoint');
  });

  it('calculates CIDR ranges offline', async () => {
    const result = await runStudioTool({
      tool: tool('cidr'),
      tab: '解析',
      input: '192.168.1.0/24',
      output: '',
      options: {},
    });
    expect(result.status).toBe('success');
    expect(result.output).toContain('192.168.1.255');
  });
});
