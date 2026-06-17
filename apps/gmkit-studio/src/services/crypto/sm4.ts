import {
  sm4Decrypt,
  sm4Encrypt,
  type CipherModeType,
  type InputFormatType,
  type OutputFormatType,
  type PaddingModeType,
} from 'gmkitx';

import { makeJson, randomHex, required, type ToolValues } from '../format';

export function runSm4(tabKey: string, action: string, values: ToolValues): { output: string; values?: ToolValues } {
  if (action === '生成 Key/IV') {
    return {
      output: makeJson({ key: '已生成', iv: '已生成' }),
      values: { ...values, key: randomHex(16), iv: randomHex(16) },
    };
  }

  if (tabKey === 'aead') {
    return { output: makeJson({ note: 'AEAD 页签当前生成接口模板，真实 GCM/CCM 可后续接入。', aad: values.aad || '' }) };
  }

  const mode = normalizeMode(values.mode);
  const padding = normalizePadding(values.padding);
  const outputFormat = normalizeOutput(values.output);
  const key = required(values, 'key', 'Key');
  const iv = values.iv?.trim() || undefined;

  if (action === '加密') {
    const result = sm4Encrypt(key, required(values, 'message', '输入'), {
      mode,
      padding,
      iv,
      outputFormat,
    });
    return { output: makeJson(result) };
  }

  if (action === '解密') {
    const plaintext = sm4Decrypt(key, required(values, 'message', '密文'), {
      mode,
      padding,
      iv,
      inputFormat: outputFormat as InputFormatType,
    });
    return { output: makeJson({ plaintext }) };
  }

  return { output: makeJson({ mode, padding, outputFormat, ivRequired: mode !== 'ecb' }) };
}

function normalizeMode(value?: string): CipherModeType {
  const mode = (value || 'ECB').toLowerCase();
  if (['ecb', 'cbc', 'ctr', 'cfb', 'ofb'].includes(mode)) return mode as CipherModeType;
  throw new Error(`不支持的 SM4 模式: ${value}`);
}

function normalizePadding(value?: string): PaddingModeType {
  if (value === 'None') return 'none';
  if (value === 'Zero') return 'zero';
  return 'pkcs7';
}

function normalizeOutput(value?: string): OutputFormatType {
  return value === 'Base64' ? 'base64' : 'hex';
}
