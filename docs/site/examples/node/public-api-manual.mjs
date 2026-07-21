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
// 1. Base64 解码：协议字段显式声明输入格式，避免自动识别歧义。
const decoded = decodeInput('AP+AQQ==', InputFormat.BASE64);

// 2. Hex 编码断言：二进制 00 ff 80 41 必须编码为小写 Hex。
assert.equal(encodeOutput(decoded, OutputFormat.HEX), '00ff8041');

// 3. 非法输入断言：包含非 Hex 字符时必须抛错。
assert.throws(() => hexToBytes('0xz1'));

// 4. 签名格式转换：将 64 字节 raw 签名转换为 DER，再转回 raw。
const rawSignature = `${'01'.padStart(64, '0')}${'02'.padStart(64, '0')}`;

// 5. 往返断言：格式转换不得改变 r 和 s。
assert.equal(derToRaw(rawToDer(rawSignature)), rawSignature);
// #endregion ts-common-example

// #region ts-sm2-example
// 1. 准备输入：金额不同的订单用于成功验签和篡改验签。
const message = 'order=GMKIT-DEMO-0001&amount=88.00';
const tampered = 'order=GMKIT-DEMO-0001&amount=99.00';

// 2. 生成 SM2 密钥对：对象式入口在实例中持有私钥和公钥。
const sm2 = SM2.generateKeyPair();

// 3. SM2 签名：固定 userId 和 DER 编码。
const signature = sm2.sign(message, {
  signatureFormat: 'der',
  userId: 'merchant@gmkit.cn',
});

// 4. SM2 验签：相同消息和 userId 必须验证成功。
assert.equal(sm2.verify(message, signature, {
  signatureFormat: 'der',
  userId: 'merchant@gmkit.cn',
}), true);

// 5. 篡改断言：金额变化后必须验证失败。
assert.equal(sm2.verify(tampered, signature, {
  signatureFormat: 'der',
  userId: 'merchant@gmkit.cn',
}), false);
// #endregion ts-sm2-example

// #region ts-sm3-sha-example
// 1. 准备输入：金额变化用于验证 HMAC 会随消息变化。
const authenticatedMessage = 'order=GMKIT-DEMO-0001&amount=88.00';
const changedMessage = 'order=GMKIT-DEMO-0001&amount=99.00';

// 2. 计算 SM3 摘要：分两次 update 后得到 abc 的摘要。
const sm3 = new SM3().update('a').update('bc');
assert.equal(sm3.digest(), sm3Digest('abc'));

// 3. SM3 重置断言：digest() 后同一实例可以重新处理消息。
assert.equal(sm3.update('abc').digest(), sm3Digest('abc'));

// 4. 计算 SM3 HMAC：消息变化后认证值必须不同。
assert.notEqual(
  sm3Hmac('merchant-demo-key', authenticatedMessage),
  sm3Hmac('merchant-demo-key', changedMessage),
);

// 5. 计算 SHA-256 摘要：分段输入必须匹配标准 abc 向量。
const sha256 = new SHA256().update('a').update('bc');
const expectedSha256 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
assert.equal(sha256.digest(), expectedSha256);

// 6. SHA-256 重置断言：digest() 后同一实例可以重新使用。
assert.equal(sha256.update('abc').digest(), expectedSha256);

// 7. 计算 SHA-256 HMAC：金额变化后认证值必须不同。
assert.notEqual(
  hmacSha256('merchant-demo-key', authenticatedMessage),
  hmacSha256('merchant-demo-key', changedMessage),
);
// #endregion ts-sm3-sha-example

// #region ts-sm4-example
// 1. 准备输入：固定测试密钥、12 字节 nonce、订单明文和 AAD。
const protectedMessage = 'order=GMKIT-DEMO-0001&amount=88.00';
const sm4 = SM4.GCM(
  '0123456789abcdeffedcba9876543210',
  '000102030405060708090a0b',
);

// 2. SM4-GCM 加密：输出使用 Base64，并返回 ciphertext 与 tag。
const encrypted = sm4.encrypt(protectedMessage, {
  aad: 'tenant=demo;schema=1',
  mode: CipherMode.GCM,
  outputFormat: OutputFormat.BASE64,
});

// 3. 加密结果断言：tag 必须存在，输出格式必须保持为 Base64。
assert.ok(encrypted.tag);
assert.equal(encrypted.format, OutputFormat.BASE64);

// 4. SM4-GCM 解密：相同 AAD 下必须恢复订单原文。
assert.equal(sm4.decrypt(encrypted, { aad: 'tenant=demo;schema=1' }), protectedMessage);

// 5. 失败断言：篡改 tag 后必须拒绝解密，不能返回明文。
assert.throws(() => sm4.decrypt({
  ...encrypted,
  tag: encrypted.tag.replace(/^./, encrypted.tag[0] === 'A' ? 'B' : 'A'),
}, { aad: 'tenant=demo;schema=1' }));
// #endregion ts-sm4-example

// #region ts-zuc-example
// 1. 准备参数：ZUC-128 使用 16 字节 key 和 16 字节 IV。
const zero = '00'.repeat(16);

// 2. 生成字节密钥流：高层 ZUC.keystream() 的长度单位是 byte。
assert.equal(new ZUC(zero, zero).keystream(8), '27bede74018082da');

// 3. 生成 word 密钥流：底层函数的长度单位是 32-bit word。
assert.deepEqual(
  Array.from(zucGenerateKeystream(zero, zero, 2)),
  [0x27bede74, 0x018082da],
);

// 4. 非法参数断言：key 长度不是 16 字节时必须抛错。
assert.throws(() => new ZUC('00', zero).keystream(8));
// #endregion ts-zuc-example

console.log('TypeScript public API manual examples passed');
