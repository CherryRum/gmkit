import assert from 'node:assert/strict';

import {
  CipherMode,
  InputFormat,
  OutputFormat,
  SHA256,
  SM2,
  SM3,
  SM4,
  ZUC,
  decodeInput,
  derToRaw,
  encodeOutput,
  hexToBytes,
  hmacSha256,
  rawToDer,
  sm3Digest,
  sm3Hmac,
  zucGenerateKeystream,
} from '../../../../packages/ts/dist/index.js';

// #region ts-common-example
// 公共编码工具：协议字段应显式声明 Hex 或 Base64，避免自动识别歧义。
const decoded = decodeInput('AP+AQQ==', InputFormat.BASE64);
assert.equal(encodeOutput(decoded, OutputFormat.HEX), '00ff8041');
assert.throws(() => hexToBytes('0xz1'));

// ASN.1 工具：SM2 raw 签名固定为 64 字节 r || s，DER 为可变长度 SEQUENCE。
const rawSignature = `${'01'.padStart(64, '0')}${'02'.padStart(64, '0')}`;
assert.equal(derToRaw(rawToDer(rawSignature)), rawSignature);
// #endregion ts-common-example

// #region ts-sm2-example
// SM2 对象式入口会持有密钥；签名端和验签端必须使用相同 userId。
const message = 'order=GMKIT-DEMO-0001&amount=88.00';
const tampered = 'order=GMKIT-DEMO-0001&amount=99.00';
const sm2 = SM2.generateKeyPair();
const signature = sm2.sign(message, {
  signatureFormat: 'der',
  userId: 'merchant@gmkit.cn',
});
assert.equal(sm2.verify(message, signature, {
  signatureFormat: 'der',
  userId: 'merchant@gmkit.cn',
}), true);
assert.equal(sm2.verify(tampered, signature, {
  signatureFormat: 'der',
  userId: 'merchant@gmkit.cn',
}), false);
// #endregion ts-sm2-example

// #region ts-sm3-sha-example
// SM3 和 SHA 增量对象在 digest() 后会自动重置，因此同一实例可安全复用。
const authenticatedMessage = 'order=GMKIT-DEMO-0001&amount=88.00';
const changedMessage = 'order=GMKIT-DEMO-0001&amount=99.00';
const sm3 = new SM3().update('a').update('bc');
assert.equal(sm3.digest(), sm3Digest('abc'));
assert.equal(sm3.update('abc').digest(), sm3Digest('abc'));
assert.notEqual(
  sm3Hmac('merchant-demo-key', authenticatedMessage),
  sm3Hmac('merchant-demo-key', changedMessage),
);

const sha256 = new SHA256().update('a').update('bc');
const expectedSha256 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
assert.equal(sha256.digest(), expectedSha256);
assert.equal(sha256.update('abc').digest(), expectedSha256);
assert.notEqual(
  hmacSha256('merchant-demo-key', authenticatedMessage),
  hmacSha256('merchant-demo-key', changedMessage),
);
// #endregion ts-sm3-sha-example

// #region ts-sm4-example
// SM4-GCM 返回 { ciphertext, tag, format }；认证失败必须抛错，不能返回明文。
const protectedMessage = 'order=GMKIT-DEMO-0001&amount=88.00';
const sm4 = SM4.GCM(
  '0123456789abcdeffedcba9876543210',
  '000102030405060708090a0b',
);
const encrypted = sm4.encrypt(protectedMessage, {
  aad: 'tenant=demo;schema=1',
  mode: CipherMode.GCM,
  outputFormat: OutputFormat.BASE64,
});
assert.ok(encrypted.tag);
assert.equal(encrypted.format, OutputFormat.BASE64);
assert.equal(sm4.decrypt(encrypted, { aad: 'tenant=demo;schema=1' }), protectedMessage);
assert.throws(() => sm4.decrypt({
  ...encrypted,
  tag: encrypted.tag.replace(/^./, encrypted.tag[0] === 'A' ? 'B' : 'A'),
}, { aad: 'tenant=demo;schema=1' }));
// #endregion ts-sm4-example

// #region ts-zuc-example
// ZUC 高层长度单位是 byte，底层 zucGenerateKeystream 的长度单位是 32-bit word。
const zero = '00'.repeat(16);
assert.equal(new ZUC(zero, zero).keystream(8), '27bede74018082da');
assert.deepEqual(
  Array.from(zucGenerateKeystream(zero, zero, 2)),
  [0x27bede74, 0x018082da],
);
assert.throws(() => new ZUC('00', zero).keystream(8));
// #endregion ts-zuc-example

console.log('TypeScript public API manual examples passed');
