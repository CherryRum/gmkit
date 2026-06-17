import { eea3, eia3, zucDecrypt, zucEncrypt, zucKeystream } from 'gmkitx';

import { makeJson, normalizeLength, required, type ToolValues } from '../format';

export function runZuc(tabKey: string, action: string, values: ToolValues): string {
  const key = required(values, 'key', 'Key');

  if (tabKey === 'keystream') {
    const stream = zucKeystream(key, required(values, 'iv', 'IV'), normalizeLength(values.length, 32));
    return makeJson({ keystream: stream, bytes: normalizeLength(values.length, 32) });
  }

  if (tabKey === 'cipher') {
    const iv = required(values, 'iv', 'IV');
    if (action === '解密') {
      return makeJson({ plaintext: zucDecrypt(key, iv, required(values, 'message', '密文')) });
    }
    return makeJson({ ciphertext: zucEncrypt(key, iv, required(values, 'message', '明文')) });
  }

  const count = Number(required(values, 'count', 'COUNT'));
  const bearer = Number(required(values, 'bearer', 'BEARER'));
  const direction = Number(values.direction || 0);
  if (action === '运行 EIA3') {
    return makeJson({ mac: eia3(key, count, bearer, direction, required(values, 'message', '消息')) });
  }
  return makeJson({ keystream: eea3(key, count, bearer, direction, required(values, 'message', '消息').length * 8) });
}
