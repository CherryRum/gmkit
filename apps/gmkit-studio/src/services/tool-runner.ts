import { sm2GenerateKeyPair, sm2Sign } from 'gmkitx';

import type { ToolKey } from '@/data/tools';

import { runSm2 } from './crypto/sm2';
import { runDigestTool } from './crypto/sm3';
import { runSm4 } from './crypto/sm4';
import { runZuc } from './crypto/zuc';
import { convertEncoding, makeJson, normalizeLength, randomBase64, randomHex, required, type ToolValues } from './format';
import { JavaApiSm9Runtime, WasmSm9Runtime, type Sm9RuntimeRequest } from './sm9/runtime';

export interface ToolActionResult {
  status: 'success' | 'error' | 'info';
  title: string;
  output: string;
  values?: ToolValues;
}

export async function runToolAction(
  toolKey: ToolKey,
  tabKey: string,
  action: string,
  values: ToolValues,
): Promise<ToolActionResult> {
  try {
    if (action === '填入示例') {
      const valuesWithSample = {
        ...values,
        ...getSampleValues(toolKey, tabKey),
      };
      return {
        status: 'info',
        title: '已填入示例',
        output: makeJson({ tool: toolKey, tab: tabKey, sampleReady: true }),
        values: valuesWithSample,
      };
    }

    const result = await dispatchToolAction(toolKey, tabKey, action, values);
    return {
      status: 'success',
      title: `${action}完成`,
      output: typeof result === 'string' ? result : result.output,
      values: typeof result === 'string' ? undefined : result.values,
    };
  } catch (error) {
    return {
      status: 'error',
      title: `${action}失败`,
      output: error instanceof Error ? error.message : String(error),
    };
  }
}

async function dispatchToolAction(
  toolKey: ToolKey,
  tabKey: string,
  action: string,
  values: ToolValues,
): Promise<string | { output: string; values?: ToolValues }> {
  if (action === '复制结果') {
    return makeJson({ copied: true, note: '结果区复制由浏览器剪贴板执行。' });
  }

  if (toolKey === 'sm2') return runSm2(tabKey, action, values);
  if (toolKey === 'sm3') return runDigestTool(tabKey, action, values);
  if (toolKey === 'sm4') return runSm4(tabKey, action, values);
  if (toolKey === 'zuc') return runZuc(tabKey, action, values);
  if (toolKey === 'sm9') return runSm9(tabKey, action, values);
  if (toolKey === 'key') return runKeyTool(tabKey, action, values);
  if (toolKey === 'cert') return runCertTool(tabKey, action, values);
  if (toolKey === 'encoding') return runEncodingTool(action, values);
  if (toolKey === 'api-playground') return runApiPlayground(action, values);
  if (toolKey === 'data') return runDataTool(tabKey, action, values);

  throw new Error(`未知工具: ${toolKey}`);
}

async function runSm9(tabKey: string, action: string, values: ToolValues): Promise<string> {
  const operation = (values.operation || 'sign') as Sm9RuntimeRequest['operation'];
  const payload = parseJson(values.payload || '{}');
  const request: Sm9RuntimeRequest = { operation, payload };

  if (action === '生成请求' || tabKey === 'capability') {
    return makeJson({
      runtime: tabKey,
      request,
      note: 'SM9 不由 TypeScript 包实现，需接 Java API 或 WASM runtime。',
    });
  }

  if (tabKey === 'java-api') {
    const runtime = new JavaApiSm9Runtime(values.endpoint || '');
    return makeJson(await runtime.execute(request));
  }

  const runtime = new WasmSm9Runtime(values.wasmUrl || '');
  return makeJson(await runtime.execute(request));
}

function runKeyTool(tabKey: string, action: string, values: ToolValues): { output: string; values?: ToolValues } {
  if (action === '生成随机值' || tabKey === 'random') {
    const length = normalizeLength(values.length, 16);
    const format = values.format || 'Hex';
    return {
      output: makeJson({ format, length, value: format === 'Base64' ? randomBase64(length) : randomHex(length) }),
    };
  }

  if ((values.type || '').includes('SM2')) {
    return { output: makeJson(sm2GenerateKeyPair()) };
  }
  if ((values.type || '').includes('SM4')) {
    const key = randomHex(16);
    const iv = randomHex(16);
    return {
      output: makeJson({ key, iv }),
      values: { ...values, key, iv },
    };
  }
  const length = normalizeLength(values.length, 16);
  return { output: makeJson({ hex: randomHex(length), base64: randomBase64(length) }) };
}

function runCertTool(tabKey: string, action: string, values: ToolValues): string {
  const source = values.cert || values.csr || '';
  if (!source.trim()) throw new Error('请粘贴证书或 CSR 内容');
  return makeJson({
    mode: tabKey,
    action,
    parsed: false,
    preview: source.slice(0, 120),
    note: '证书 ASN.1 解析将在后续接 Java API 或浏览器 parser。',
  });
}

function runEncodingTool(action: string, values: ToolValues): string | { output: string; values?: ToolValues } {
  if (action === '交换格式') {
    const next = { ...values, from: values.to || 'Hex', to: values.from || 'UTF-8' };
    return { output: makeJson({ swapped: true, from: next.from, to: next.to }), values: next };
  }
  const output = convertEncoding(values.from || 'UTF-8', values.to || 'Hex', required(values, 'value', '内容'));
  return makeJson({ from: values.from || 'UTF-8', to: values.to || 'Hex', output });
}

function runApiPlayground(action: string, values: ToolValues): string {
  return makeJson({
    environment: values.environment || 'Mock',
    path: values.path || '/api/sm2/encrypt',
    action,
    request: parseJson(values.body || '{}'),
    response: { mocked: true, status: 200, traceId: crypto.randomUUID() },
  });
}

function runDataTool(tabKey: string, action: string, values: ToolValues): string {
  if (tabKey === 'json') {
    const input = required(values, 'json', 'JSON');
    const parsed = parseJson(input);
    return makeJson({ action, output: action === '压缩' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2) });
  }

  const kind = values.kind || 'UUID';
  if (kind === 'UUID') return makeJson({ uuid: crypto.randomUUID() });
  if (kind === '时间戳') return makeJson({ timestamp: Date.now(), iso: new Date().toISOString() });
  return makeJson({ random: randomHex(16) });
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('JSON 格式不正确');
  }
}

function getSampleValues(toolKey: ToolKey, tabKey: string): ToolValues {
  const sm4Key = '0123456789abcdeffedcba9876543210';
  const iv = '00000000000000000000000000000000';
  const zucKey = '00000000000000000000000000000000';
  const keyPair = sm2GenerateKeyPair();

  if (toolKey === 'sm2' && tabKey === 'encrypt') {
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      message: 'GMKit Studio',
      cipherMode: 'C1C3C2',
    };
  }
  if (toolKey === 'sm2' && tabKey === 'sign') {
    const message = 'GMKit Studio';
    return {
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      message,
      signature: sm2Sign(keyPair.privateKey, message, { userId: '1234567812345678' }),
      userId: '1234567812345678',
    };
  }
  if (toolKey === 'sm2' && tabKey === 'keys') {
    return { publicKey: keyPair.publicKey, format: 'Hex' };
  }
  if (toolKey === 'sm3') {
    return tabKey === 'hmac'
      ? { algorithm: 'HMAC-SM3', key: 'gmkit-secret', message: 'GMKit Studio' }
      : { algorithm: 'SM3', message: 'GMKit Studio' };
  }
  if (toolKey === 'sm4') {
    return {
      mode: 'CBC',
      key: sm4Key,
      iv,
      padding: 'PKCS7',
      output: 'Hex',
      message: 'GMKit Studio',
      aad: 'gmkit-aad',
    };
  }
  if (toolKey === 'zuc') {
    return {
      key: zucKey,
      iv,
      length: '32',
      count: '66051',
      bearer: '15',
      direction: '0',
      message: 'GMKit Studio',
    };
  }
  if (toolKey === 'sm9') {
    return {
      endpoint: 'http://localhost:8080/api/sm9',
      operation: 'sign',
      payload: '{\n  "userId": "alice@example.com",\n  "message": "GMKit Studio"\n}',
      wasmUrl: '/runtime/sm9.wasm',
    };
  }
  if (toolKey === 'key') return { type: 'SM2 密钥对', format: 'Hex', length: '16' };
  if (toolKey === 'cert') return { cert: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----' };
  if (toolKey === 'encoding') return { from: 'UTF-8', to: 'Hex', value: 'GMKit Studio' };
  if (toolKey === 'api-playground') {
    return { environment: 'Mock', path: '/api/sm2/encrypt', body: '{\n  "message": "GMKit Studio"\n}' };
  }
  if (toolKey === 'data') {
    return tabKey === 'json' ? { json: '{ "name": "GMKit Studio" }' } : { kind: 'UUID' };
  }
  return {};
}
