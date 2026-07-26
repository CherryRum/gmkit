import assert from 'node:assert/strict';

import {
  SHA256,
  SM3,
  constantTimeEqual,
  hexToBytes,
  hmacSha256,
  sha256,
  sha384,
  sha512,
  sm3Digest,
  sm3Hmac,
} from '../../../../packages/ts/dist/index.js';

// #region manual-ts-digest-hmac
// 1. 准备参数：固定向量使用 abc，业务消息使用订单金额。
const plaintext = 'order=GMKIT-DEMO-0001&amount=88.00';
const tampered = 'order=GMKIT-DEMO-0001&amount=99.00';
const hmacKey = 'merchant-demo-key';

// 2. 计算 SM3 摘要：固定向量必须等于 64 个 Hex 字符。
const sm3 = sm3Digest('abc');
assert.equal(
  sm3,
  '66c7f0f462eeedd9d1f2d46bdc10e4e2'
    + '4167c4875cf2f7a2297da02b8f4ba8e0',
);

// 3. 计算 SHA-2 摘要：SHA-256/384/512 分别输出 32/48/64 字节。
const sha256Digest = sha256('abc');
assert.equal(
  sha256Digest,
  'ba7816bf8f01cfea414140de5dae2223'
    + 'b00361a396177a9cb410ff61f20015ad',
);
assert.equal(sha384('abc').length, 96);
assert.equal(sha512('abc').length, 128);

// 4. 计算 HMAC：SM3-HMAC 和 HMAC-SHA256 使用共享 key 认证业务消息。
const sm3Mac = sm3Hmac(hmacKey, plaintext);
const sha256Mac = hmacSha256(hmacKey, plaintext);

// 5. HMAC 成功断言：重新计算后使用无显式早退的字节比较。
assert.equal(
  constantTimeEqual(hexToBytes(sm3Mac), hexToBytes(sm3Hmac(hmacKey, plaintext))),
  true,
);
assert.equal(
  constantTimeEqual(hexToBytes(sha256Mac), hexToBytes(hmacSha256(hmacKey, plaintext))),
  true,
);

// 6. 篡改断言：金额变化后，两个 HMAC 都必须不同。
assert.equal(
  constantTimeEqual(hexToBytes(sm3Mac), hexToBytes(sm3Hmac(hmacKey, tampered))),
  false,
);
assert.equal(
  constantTimeEqual(hexToBytes(sha256Mac), hexToBytes(hmacSha256(hmacKey, tampered))),
  false,
);

// 7. 增量摘要：分块输入与一次性输入结果一致，digest() 后实例自动重置。
const incrementalSm3 = new SM3().update('a').update('bc');
assert.equal(incrementalSm3.digest(), sm3);
assert.equal(incrementalSm3.update('abc').digest(), sm3);

const incrementalSha256 = new SHA256().update('a').update('bc');
assert.equal(incrementalSha256.digest(), sha256Digest);
assert.equal(incrementalSha256.update('abc').digest(), sha256Digest);
// #endregion manual-ts-digest-hmac

console.log('TypeScript manual digest and HMAC example passed');
