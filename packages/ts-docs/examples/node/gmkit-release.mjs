import assert from 'node:assert/strict';

const gmkit = await import('../../../ts/dist/index.js');
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
const signature = sm2Sign(keys.privateKey, binary, { userId: 'gmkit-release-v1', signatureFormat: 'der' });
assert.equal(sm2Verify(keys.publicKey, binary, signature, { userId: 'gmkit-release-v1', signatureFormat: 'der' }), true);
assert.equal(sm2Verify(keys.publicKey, Uint8Array.of(1), signature, { userId: 'gmkit-release-v1', signatureFormat: 'der' }), false);

const sm4Key = '0123456789abcdeffedcba9876543210';
const gcmOptions = { mode: CipherMode.GCM, iv: '000102030405060708090a0b', aad: 'release-v1', tagLength: 16 };
const sm4Cipher = sm4Encrypt(sm4Key, binary, gcmOptions);
assert.deepEqual(sm4DecryptBytes(sm4Key, sm4Cipher, gcmOptions), binary);
assert.throws(() => sm4DecryptBytes(sm4Key, { ...sm4Cipher, tag: '00'.repeat(16) }, gcmOptions), /Authentication tag/);

assert.equal(zucKeystream('00'.repeat(16), '00'.repeat(16), 8), '27bede74018082da');
assert.equal(eia3('000102030405060708090a0b0c0d0e0f', 0x01234567, 0x0a, 0, hexToBytes('5bad724710ba1c56'), 64), '1b3d0f74');
assert.equal(eea3Encrypt('173d14ba5003731d7a60049470f00a29', 0x66035492, 0x0f, 0, hexToBytes('6cf65340735552ab0c9752fa6f9025fe0bd675d9005875b200'), 193).length, 50);

assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
assert.equal(hmacSha256(hexToBytes('0b'.repeat(20)), 'Hi There'), 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');

for (const legacyName of ['generateKeyPair', 'sign', 'verify', 'digest', 'hmac']) {
  assert.equal(typeof gmkit[legacyName], 'function', `兼容导出缺失: ${legacyName}`);
}

console.log('GMKitX release API example passed');
