import assert from 'node:assert/strict';

import {
  InputFormat,
  OutputFormat,
  SM2CipherMode,
  base64ToBytes,
  bytesToBase64,
  sm2CompressPublicKey,
  sm2Decrypt,
  sm2DecompressPublicKey,
  sm2Encrypt,
  sm2GenerateKeyPair,
  sm2Sign,
  sm2Verify,
} from '../../../../packages/ts/dist/index.js';

// #region manual-ts-sm2
// 1. 准备参数：固定业务消息、篡改消息和非空 SM2 用户标识。
const plaintext = 'order=GMKIT-DEMO-0001&amount=88.00';
const tampered = 'order=GMKIT-DEMO-0001&amount=99.00';
const userId = 'merchant@gmkit.cn';

// 2. 生成 SM2 密钥：私钥为 32 字节 Hex，公钥默认为 65 字节非压缩点 Hex。
const { privateKey, publicKey } = sm2GenerateKeyPair();
assert.equal(privateKey.length, 64);
assert.equal(publicKey.length, 130);
assert.equal(publicKey.startsWith('04'), true);

// 3. SM2 签名：计算 e = SM3(Z || M)，签名使用 DER，外层使用 Base64。
const signature = sm2Sign(privateKey, plaintext, {
  userId,
  signatureFormat: 'der',
  outputFormat: OutputFormat.BASE64,
});

// 4. SM2 验签：输入编码、签名结构和 userId 必须与签名端一致。
assert.equal(sm2Verify(publicKey, plaintext, signature, {
  userId,
  signatureFormat: 'der',
  inputFormat: InputFormat.BASE64,
}), true);

// 5. 篡改断言：金额变化或 userId 变化后，SM2 验签必须返回 false。
assert.equal(sm2Verify(publicKey, tampered, signature, {
  userId,
  signatureFormat: 'der',
  inputFormat: InputFormat.BASE64,
}), false);
assert.equal(sm2Verify(publicKey, plaintext, signature, {
  userId: 'other@gmkit.cn',
  signatureFormat: 'der',
  inputFormat: InputFormat.BASE64,
}), false);

// 6. SM2 加密：密文排列固定为 C1C3C2，外层使用 Base64。
const ciphertext = sm2Encrypt(publicKey, plaintext, {
  mode: SM2CipherMode.C1C3C2,
  outputFormat: OutputFormat.BASE64,
});

// 7. SM2 解密：显式指定 C1C3C2 和 Base64，恢复 UTF-8 文本。
const decrypted = sm2Decrypt(privateKey, ciphertext, {
  mode: SM2CipherMode.C1C3C2,
  inputFormat: InputFormat.BASE64,
});
assert.equal(decrypted, plaintext);

// 8. 密文篡改断言：修改 C3/C2 后，SM2 解密必须校验失败并抛错。
const tamperedCiphertextBytes = base64ToBytes(ciphertext);
tamperedCiphertextBytes[tamperedCiphertextBytes.length - 1] ^= 0x01;
const tamperedCiphertext = bytesToBase64(tamperedCiphertextBytes);
assert.throws(() => sm2Decrypt(privateKey, tamperedCiphertext, {
  mode: SM2CipherMode.C1C3C2,
  inputFormat: InputFormat.BASE64,
}));

// 9. 公钥压缩往返：压缩点可用于存储，解压后必须恢复同一非压缩公钥。
const compressedPublicKey = sm2CompressPublicKey(publicKey);
assert.equal(compressedPublicKey.length, 66);
assert.equal(sm2DecompressPublicKey(compressedPublicKey), publicKey);
// #endregion manual-ts-sm2

console.log('TypeScript manual SM2 example passed');
