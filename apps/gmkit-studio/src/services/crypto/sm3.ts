import { hmacSha256, hmacSha384, hmacSha512, sha1, sha256, sha384, sha512, sm3Digest, sm3Hmac } from 'gmkitx';

import { makeJson, required, type ToolValues } from '../format';

export function runDigestTool(tabKey: string, action: string, values: ToolValues): string {
  if (tabKey === 'file') {
    throw new Error('文件摘要仍是原型占位，后续接浏览器 File API。');
  }

  if (tabKey === 'hmac' || action.includes('HMAC')) {
    const algorithm = values.algorithm || 'HMAC-SM3';
    const key = required(values, 'key', 'Key');
    const message = required(values, 'message', '消息');
    const digest = hmacByAlgorithm(algorithm, key, message);
    return makeJson({ algorithm, digest });
  }

  const algorithm = values.algorithm || 'SM3';
  const message = required(values, 'message', '输入');
  const digest = digestByAlgorithm(algorithm, message);
  return makeJson({ algorithm, digest });
}

function digestByAlgorithm(algorithm: string, message: string): string {
  if (algorithm === 'SM3') return sm3Digest(message);
  if (algorithm === 'SHA-1') return sha1(message);
  if (algorithm === 'SHA-256') return sha256(message);
  if (algorithm === 'SHA-384') return sha384(message);
  if (algorithm === 'SHA-512') return sha512(message);
  throw new Error(`不支持的摘要算法: ${algorithm}`);
}

function hmacByAlgorithm(algorithm: string, key: string, message: string): string {
  if (algorithm === 'HMAC-SM3') return sm3Hmac(key, message);
  if (algorithm === 'HMAC-SHA256') return hmacSha256(key, message);
  if (algorithm === 'HMAC-SHA384') return hmacSha384(key, message);
  if (algorithm === 'HMAC-SHA512') return hmacSha512(key, message);
  throw new Error(`不支持的 HMAC 算法: ${algorithm}`);
}
