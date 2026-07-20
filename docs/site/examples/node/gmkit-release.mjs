import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const gmkit = await import('../../../../packages/ts/dist/index.js');
const require = createRequire(import.meta.url);
const {
  CipherMode,
  InputFormat,
  OutputFormat,
  SM2CipherMode,
  SM3,
  eea3Encrypt,
  eia3,
  hexToBytes,
  hmacSha256,
  sha256,
  sm2CompressPublicKey,
  sm2DecryptBytes,
  sm2DecompressPublicKey,
  sm2Encrypt,
  sm2GenerateKeyPair,
  sm2GetPublicKeyFromPrivateKey,
  sm2KeyExchange,
  sm2Sign,
  sm2Verify,
  sm3Digest,
  sm4DecryptBytes,
  sm4Encrypt,
  zucKeystream,
} = gmkit;

assert.equal(sm3Digest('abc'), '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0');
const incremental = new SM3().update('a').update(Uint8Array.of(0x62, 0x63));
assert.equal(incremental.digest(), sm3Digest('abc'));
assert.equal(incremental.update('abc').digest(), sm3Digest('abc'), 'SM3 digest 后应重置状态');

const keys = sm2GenerateKeyPair();
const compressed = sm2CompressPublicKey(keys.publicKey);
assert.equal(sm2DecompressPublicKey(compressed), keys.publicKey);
const binary = Uint8Array.of(0x00, 0xff, 0x80, 0x41);
const sm2Cipher = sm2Encrypt(keys.publicKey, binary, {
  mode: SM2CipherMode.C1C3C2,
  outputFormat: OutputFormat.BASE64,
});
assert.deepEqual(sm2DecryptBytes(keys.privateKey, sm2Cipher, {
  mode: SM2CipherMode.C1C3C2,
  inputFormat: InputFormat.BASE64,
}), binary);

// 未指定解密 mode 时保留旧版自动探测：先尝试 C1C3C2，再尝试 C1C2C3。
const c1c2c3Cipher = sm2Encrypt(keys.publicKey, binary, { mode: SM2CipherMode.C1C2C3 });
assert.deepEqual(sm2DecryptBytes(keys.privateKey, c1c2c3Cipher), binary);
const signature = sm2Sign(keys.privateKey, binary, { userId: 'gmkit-release-v1', signatureFormat: 'der' });
assert.equal(sm2Verify(keys.publicKey, binary, signature, { userId: 'gmkit-release-v1', signatureFormat: 'der' }), true);
assert.equal(sm2Verify(keys.publicKey, Uint8Array.of(1), signature, { userId: 'gmkit-release-v1', signatureFormat: 'der' }), false);
assert.throws(() => sm2Encrypt(keys.publicKey, new Uint8Array(0)), /must not be empty/);

// 共享向量同时由 Java/Bouncy Castle 消费，固定双方静态密钥、临时密钥、ID 和确认标签。
const dA = '0'.repeat(63) + '1';
const rA = '0'.repeat(63) + '2';
const dB = '0'.repeat(63) + '3';
const rB = '0'.repeat(63) + '4';
const publicA = sm2GetPublicKeyFromPrivateKey(dA);
const tempPublicA = sm2GetPublicKeyFromPrivateKey(rA);
const publicB = sm2GetPublicKeyFromPrivateKey(dB);
const tempPublicB = sm2GetPublicKeyFromPrivateKey(rB);
const exchangeA = sm2KeyExchange({
  privateKey: dA,
  publicKey: publicA,
  tempPrivateKey: rA,
  peerPublicKey: publicB,
  peerTempPublicKey: tempPublicB,
  userId: 'Alice-固定向量',
  peerUserId: 'Bob-固定向量',
  isInitiator: true,
  keyLength: 32,
});
const exchangeB = sm2KeyExchange({
  privateKey: dB,
  publicKey: publicB,
  tempPrivateKey: rB,
  peerPublicKey: publicA,
  peerTempPublicKey: tempPublicA,
  userId: 'Bob-固定向量',
  peerUserId: 'Alice-固定向量',
  isInitiator: false,
  keyLength: 32,
});
assert.equal(exchangeA.sharedKey, '858c9c6cd5541b4d9b8dc24c6cd43071e1262993b44988dd47bcb13d3949d66f');
assert.equal(exchangeB.sharedKey, exchangeA.sharedKey);
assert.equal(exchangeA.s1, 'bf0dd145fab696b9807bffdae5ddf4d1ab3f95269bae1a46daa979b8c2d7d01e');
assert.equal(exchangeB.s1, exchangeA.s1);
assert.equal(exchangeA.s2, '32df7cf664c9be84f8344a774908aa61c07d9a451cbe204001cab893a52c0af1');
assert.equal(exchangeB.s2, exchangeA.s2);

// 空 userId 是历史兼容输入，必须继续与 DEFAULT_USER_ID 使用同一验签语义。
const emptyUserIdSignature = sm2Sign(keys.privateKey, binary, { userId: '' });
assert.equal(sm2Verify(keys.publicKey, binary, emptyUserIdSignature, { userId: gmkit.DEFAULT_USER_ID }), true);

const sm4Key = '0123456789abcdeffedcba9876543210';
const gcmPlaintext = hexToBytes('00112233445566778899aabbccddeeff102030405060708090a0b0c0d0e0f000');
const gcmOptions = {
  mode: CipherMode.GCM,
  iv: '000102030405060708090a0b',
  aad: hexToBytes('a1a2a3a4a5'),
  tagLength: 16,
};
const sm4Cipher = sm4Encrypt(sm4Key, gcmPlaintext, gcmOptions);
assert.equal(sm4Cipher.ciphertext, '55303aa2f5e4cf68ec192910178188aa98d919ed1031ce3fd61419ef400de37b');
assert.equal(sm4Cipher.tag, 'e1fc34aeb1fc2cc1fd4dff35500763eb');
assert.deepEqual(sm4DecryptBytes(sm4Key, sm4Cipher, gcmOptions), gcmPlaintext);
assert.throws(() => sm4DecryptBytes(sm4Key, { ...sm4Cipher, tag: '00'.repeat(16) }, gcmOptions), /Authentication tag/);
assert.throws(
  () => sm4DecryptBytes(sm4Key, sm4Cipher, { ...gcmOptions, aad: hexToBytes('a1a2a3a4a6') }),
  /Authentication tag/,
);

assert.equal(zucKeystream('00'.repeat(16), '00'.repeat(16), 8), '27bede74018082da');
const partialByteCipher = eea3Encrypt('00'.repeat(16), 0, 0, 0, Uint8Array.of(0xff), 5);
assert.equal(Number.parseInt(partialByteCipher, 16) & 0b111, 0, 'EEA3 未使用的末尾低位必须清零');
assert.equal(eia3('000102030405060708090a0b0c0d0e0f', 0x01234567, 0x0a, 0, hexToBytes('5bad724710ba1c56'), 64), '1b3d0f74');
assert.equal(
  eea3Encrypt(
    'e5bd3ea0eb55ade866c6ac58bd54302a',
    0x00056823,
    0x18,
    1,
    hexToBytes(
      '14a8ef693d678507bbe7270a7f67ff5006c3525b9807e467c4e56000ba338f5d' +
      '429559036751822246c80d3b38f07f4be2d8ff5805f5132229bde93bbbdcaf38' +
      '2bf1ee972fbf9977bada8945847a2a6c9ad34a667554e04d1f7fa2c33241bd8f' +
      '01ba220d',
    ),
    800,
  ),
  '131d43e0dea1be5c5a1bfd971d852cbf712d7b4f57961fea3208afa8bca433f' +
  '456ad09c7417e58bc69cf8866d1353f74865e80781d202dfb3ecff7fcbc3b190' +
  'fe82a204ed0e350fc0f6f2613b2f2bca6df5a473a57a4a00d985ebad880d6f2' +
  '3864a07b01',
);

assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
assert.equal(hmacSha256(hexToBytes('0b'.repeat(20)), 'Hi There'), 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');

const legacyAliases = {
  generateKeyPair: sm2GenerateKeyPair,
  getPublicKeyFromPrivateKey: sm2GetPublicKeyFromPrivateKey,
  compressPublicKey: sm2CompressPublicKey,
  decompressPublicKey: sm2DecompressPublicKey,
  sign: sm2Sign,
  verify: sm2Verify,
  keyExchange: gmkit.sm2KeyExchange,
  digest: sm3Digest,
  hmac: gmkit.sm3Hmac,
};
for (const [legacyName, replacement] of Object.entries(legacyAliases)) {
  assert.equal(gmkit[legacyName], replacement, `兼容导出映射错误: ${legacyName}`);
}

// 发布包同时声明 ESM、CommonJS 和 IIFE，三种产物都必须执行同一个固定向量。
const commonjs = require('../../../../packages/ts/dist/index.cjs');
assert.equal(commonjs.sm3Digest('abc'), sm3Digest('abc'));
assert.equal(commonjs.default.sm3Digest, commonjs.sm3Digest);

const iifeContext = vm.createContext({
  console,
  crypto: globalThis.crypto,
  TextDecoder,
  TextEncoder,
});
const iifeSource = await readFile(new URL('../../../../packages/ts/dist/index.global.js', import.meta.url), 'utf8');
vm.runInContext(iifeSource, iifeContext, { filename: 'index.global.js' });
assert.equal(iifeContext.GMKit.sm3Digest('abc'), sm3Digest('abc'));
assert.equal(iifeContext.GMKit.default.sm3Digest, iifeContext.GMKit.sm3Digest);

console.log('GMKitX release API example passed');
