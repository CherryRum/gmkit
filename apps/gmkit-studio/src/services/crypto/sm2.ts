import {
  bytesToBase64,
  hexToBytes,
  sm2CompressPublicKey,
  sm2Decrypt,
  sm2Encrypt,
  sm2GenerateKeyPair,
  sm2Sign,
  sm2Verify,
} from 'gmkitx';

import { makeJson, required, type ToolValues } from '../format';

export function runSm2(tabKey: string, action: string, values: ToolValues): string {
  if (tabKey === 'encrypt') {
    const mode = (values.cipherMode || 'C1C3C2') as 'C1C3C2' | 'C1C2C3';
    if (action === '加密') {
      const ciphertext = sm2Encrypt(required(values, 'publicKey', '公钥'), required(values, 'message', '明文'), { mode });
      return makeJson({ ciphertext, mode });
    }
    if (action === '解密') {
      const plaintext = sm2Decrypt(required(values, 'privateKey', '私钥'), required(values, 'message', '密文'), { mode });
      return makeJson({ plaintext, mode });
    }
  }

  if (tabKey === 'sign') {
    if (action === '签名') {
      const signature = sm2Sign(required(values, 'privateKey', '签名私钥'), required(values, 'message', '消息'), {
        userId: values.userId || '1234567812345678',
        signatureFormat: 'raw',
      });
      return makeJson({ signature, format: 'raw', userId: values.userId || '1234567812345678' });
    }
    if (action === '验签') {
      const valid = sm2Verify(
        required(values, 'publicKey', '验签公钥'),
        required(values, 'message', '消息'),
        required(values, 'signature', '签名'),
        {
          userId: values.userId || '1234567812345678',
          signatureFormat: 'auto',
        },
      );
      return makeJson({ valid });
    }
  }

  if (tabKey === 'keys' || action === '生成密钥对') {
    const format = values.format === 'Base64' ? 'base64' : 'hex';
    if (action === '压缩公钥') {
      const compressed = sm2CompressPublicKey(required(values, 'publicKey', '公钥压缩输入'));
      return makeJson({
        format,
        compressedPublicKey: format === 'base64' ? hexToBase64(compressed) : compressed,
        compressedPublicKeyHex: compressed,
      });
    }
    const keyPair = sm2GenerateKeyPair();
    return makeJson(
      format === 'base64'
        ? {
            format,
            publicKey: hexToBase64(keyPair.publicKey),
            privateKey: hexToBase64(keyPair.privateKey),
            publicKeyHex: keyPair.publicKey,
            privateKeyHex: keyPair.privateKey,
          }
        : { format, ...keyPair },
    );
  }

  throw new Error(`SM2 暂不支持操作: ${action}`);
}

function hexToBase64(hex: string): string {
  return bytesToBase64(hexToBytes(hex));
}
