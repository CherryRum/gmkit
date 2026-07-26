import assert from 'node:assert/strict';

import {
  CipherMode,
  InputFormat,
  OutputFormat,
  PaddingMode,
  base64ToBytes,
  bytesToBase64,
  sm4Decrypt,
  sm4DecryptBytes,
  sm4Encrypt,
} from '../../../../packages/ts/dist/index.js';

// #region manual-ts-sm4
// 1. 准备参数：SM4 key 为 16 字节 Hex，GCM nonce 为 12 字节 Hex。
const key = '0123456789abcdeffedcba9876543210';
const nonce = '000102030405060708090a0b';
const aad = 'tenant=demo;schema=1';
const plaintext = 'order=GMKIT-DEMO-0001&amount=88.00';

// 2. SM4-GCM 加密：不使用分组填充，密文和 tag 都输出为 Base64。
const encrypted = sm4Encrypt(key, plaintext, {
  mode: CipherMode.GCM,
  padding: PaddingMode.NONE,
  iv: nonce,
  aad,
  tagLength: 16,
  outputFormat: OutputFormat.BASE64,
});
assert.equal(encrypted.format, OutputFormat.BASE64);
assert.equal(typeof encrypted.tag, 'string');

// 3. SM4-GCM 解密：使用同一 nonce、AAD 和 tag 恢复 UTF-8 原文。
const decrypted = sm4Decrypt(key, encrypted, {
  mode: CipherMode.GCM,
  padding: PaddingMode.NONE,
  iv: nonce,
  aad,
  inputFormat: InputFormat.BASE64,
  tagFormat: InputFormat.BASE64,
});
assert.equal(decrypted, plaintext);

// 4. 认证失败断言：修改 tag 后，SM4-GCM 解密必须抛错，不能返回明文。
const tamperedTagBytes = base64ToBytes(encrypted.tag);
tamperedTagBytes[0] ^= 0x01;
const tampered = { ...encrypted, tag: bytesToBase64(tamperedTagBytes) };
assert.throws(() => sm4Decrypt(key, tampered, {
  mode: CipherMode.GCM,
  padding: PaddingMode.NONE,
  iv: nonce,
  aad,
  inputFormat: InputFormat.BASE64,
  tagFormat: InputFormat.BASE64,
}));

// 5. 二进制加密：任意字节必须通过 Uint8Array 输入，不能先转为文本。
const binary = Uint8Array.of(0x00, 0xff, 0x80, 0x41);
const binaryEncrypted = sm4Encrypt(key, binary, {
  mode: CipherMode.GCM,
  padding: PaddingMode.NONE,
  iv: '0c0d0e0f1011121314151617',
  aad,
  outputFormat: OutputFormat.BASE64,
});

// 6. 二进制解密：使用 sm4DecryptBytes 原样恢复 00 ff 80 41。
const binaryDecrypted = sm4DecryptBytes(key, binaryEncrypted, {
  mode: CipherMode.GCM,
  padding: PaddingMode.NONE,
  iv: '0c0d0e0f1011121314151617',
  aad,
  inputFormat: InputFormat.BASE64,
  tagFormat: InputFormat.BASE64,
});
assert.deepEqual(binaryDecrypted, binary);
// #endregion manual-ts-sm4

console.log('TypeScript manual SM4 example passed');
