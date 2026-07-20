import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

const crypto = globalThis.crypto ?? webcrypto;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const message = encoder.encode('GMKit Web Crypto release check');

// AES-GCM 的协议载荷必须同时传输 IV、密文和认证标签；Web Crypto 将标签附在密文尾部。
const aesKey = await crypto.subtle.importKey(
  'raw',
  Uint8Array.from({ length: 32 }, (_, index) => index),
  'AES-GCM',
  false,
  ['encrypt', 'decrypt'],
);
const iv = Uint8Array.from({ length: 12 }, (_, index) => 0xa0 + index);
const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, aesKey, message);
const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, aesKey, encrypted);
assert.equal(decoder.decode(decrypted), decoder.decode(message));

// RSA-OAEP 只负责小消息或会话密钥封装，大数据应使用 AEAD 对称加密。
const rsaKeys = await crypto.subtle.generateKey(
  { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  false,
  ['encrypt', 'decrypt'],
);
const wrapped = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsaKeys.publicKey, message);
const unwrapped = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, rsaKeys.privateKey, wrapped);
assert.equal(decoder.decode(unwrapped), decoder.decode(message));

console.log('Web Crypto AES-GCM/RSA-OAEP example passed');
