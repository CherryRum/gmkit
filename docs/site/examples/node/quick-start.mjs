import assert from 'node:assert/strict';

import {
  CipherMode,
  PaddingMode,
  bytesToHex,
  getRandomBytes,
  sm2GenerateKeyPair,
  sm2Sign,
  sm2Verify,
  sm3Digest,
  sm4Decrypt,
  sm4Encrypt,
} from '../../../../packages/ts/dist/index.js';

const expectedSm3 = '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0';
assert.equal(sm3Digest('abc'), expectedSm3);

const message = 'order=GMKIT-DEMO-0001&amount=88.00';
const changedMessage = 'order=GMKIT-DEMO-0001&amount=99.00';
const userId = 'merchant@gmkit.cn';
const keys = sm2GenerateKeyPair();
const signature = sm2Sign(keys.privateKey, message, {
  userId,
  signatureFormat: 'der',
});
assert.equal(sm2Verify(keys.publicKey, message, signature, {
  userId,
  signatureFormat: 'der',
}), true);
assert.equal(sm2Verify(keys.publicKey, changedMessage, signature, {
  userId,
  signatureFormat: 'der',
}), false);

const key = bytesToHex(getRandomBytes(16));
const nonce = bytesToHex(getRandomBytes(12));
const options = {
  mode: CipherMode.GCM,
  padding: PaddingMode.NONE,
  iv: nonce,
  aad: 'tenant=demo;schema=1',
};
const encrypted = sm4Encrypt(key, message, options);
assert.equal(sm4Decrypt(key, encrypted, options), message);
assert.throws(() => sm4Decrypt(key, {
  ...encrypted,
  tag: encrypted.tag.replace(/^./, encrypted.tag[0] === '0' ? '1' : '0'),
}, options));

console.log('TypeScript quick-start example passed');
