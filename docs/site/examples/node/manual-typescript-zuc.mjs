import assert from 'node:assert/strict';

import {
  InputFormat,
  OutputFormat,
  bytesToHex,
  eea3Encrypt,
  eia3,
  hexToBytes,
  stringToBytes,
  zucDecrypt,
  zucEncrypt,
  zucKeystream,
  zucKeystreamWords,
} from '../../../../packages/ts/dist/index.js';

// #region manual-ts-zuc
// 1. 准备参数：ZUC-128 key 和 IV 都固定为 16 字节 Hex。
const key = '00'.repeat(16);
const iv = '00'.repeat(16);
const plaintext = 'order=GMKIT-DEMO-0001&amount=88.00';

// 2. 生成密钥流：8 byte 输出 16 个 Hex 字符，2 word 输出同样的 8 byte。
const byteKeystream = zucKeystream(key, iv, 8);
const wordKeystream = zucKeystreamWords(key, iv, 2);
assert.equal(byteKeystream, '27bede74018082da');
assert.equal(wordKeystream, byteKeystream);

// 3. ZUC 加密：业务文本按 UTF-8 编码，密文外层使用 Base64。
const ciphertext = zucEncrypt(key, iv, plaintext, {
  outputFormat: OutputFormat.BASE64,
});

// 4. ZUC 解密：显式按 Base64 解码，使用同一 key 和 IV 恢复文本。
const decrypted = zucDecrypt(key, iv, ciphertext, {
  inputFormat: InputFormat.BASE64,
});
assert.equal(decrypted, plaintext);

// 5. EEA3 机密性运算：COUNT、BEARER、DIRECTION 与 bitLength 属于协议字段。
const count = 0x398a59b4;
const bearer = 0x15;
const direction = 1;
const messageBytes = stringToBytes(plaintext);
const bitLength = messageBytes.length * 8;
const eea3Ciphertext = eea3Encrypt(
  key,
  count,
  bearer,
  direction,
  messageBytes,
  bitLength,
);

// 6. EEA3 解密：流密码重复执行同一运算，恢复原始消息字节。
const eea3Decrypted = eea3Encrypt(
  key,
  count,
  bearer,
  direction,
  hexToBytes(eea3Ciphertext),
  bitLength,
);
assert.equal(eea3Decrypted, bytesToHex(messageBytes));

// 7. EIA3 完整性校验：相同协议字段和消息产生相同的 32-bit MAC-I。
const mac = eia3(key, count, bearer, direction, messageBytes, bitLength);
assert.equal(mac.length, 8);
assert.equal(eia3(key, count, bearer, direction, messageBytes, bitLength), mac);

// 8. 篡改断言：金额变化后 EIA3 MAC-I 必须不同。
const tampered = stringToBytes('order=GMKIT-DEMO-0001&amount=99.00');
assert.notEqual(
  eia3(key, count, bearer, direction, tampered, tampered.length * 8),
  mac,
);

// 9. 非法参数断言：BEARER 超出 5 bit 范围时必须抛错。
assert.throws(() => eia3(key, count, 32, direction, messageBytes, bitLength));
// #endregion manual-ts-zuc

console.log('TypeScript manual ZUC example passed');
