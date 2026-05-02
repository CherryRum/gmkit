import { bench, describe } from 'vitest';
import { sm3Digest, sm4Encrypt, zucEncrypt, eea3, eia3 } from '../src/index.js';

const BLOCK_1KB = new Uint8Array(1024);
for (let i = 0; i < BLOCK_1KB.length; i++) BLOCK_1KB[i] = i & 0xff;

const KEY_16 = new Uint8Array(16);
for (let i = 0; i < 16; i++) KEY_16[i] = i & 0xff;

const IV_16 = new Uint8Array(16);
for (let i = 0; i < 16; i++) IV_16[i] = (i * 3) & 0xff;

describe('SM3', () => {
  bench('digest 1KB', () => {
    sm3Digest(BLOCK_1KB);
  });
});

describe('SM4', () => {
  bench('ECB encrypt 1KB', () => {
    sm4Encrypt(KEY_16, BLOCK_1KB, { mode: 'ecb' });
  });
  bench('CBC encrypt 1KB', () => {
    sm4Encrypt(KEY_16, BLOCK_1KB, { mode: 'cbc', iv: IV_16 });
  });
  bench('CTR encrypt 1KB', () => {
    sm4Encrypt(KEY_16, BLOCK_1KB, { mode: 'ctr', iv: IV_16 });
  });
});

describe('ZUC', () => {
  bench('encrypt 1KB', () => {
    zucEncrypt(KEY_16, IV_16, BLOCK_1KB);
  });
  bench('EEA3 keystream 1KB', () => {
    eea3(KEY_16, 0, 0, 0, BLOCK_1KB.length * 8);
  });
  bench('EIA3 mac 1KB', () => {
    eia3(KEY_16, 0, 0, 0, BLOCK_1KB);
  });
});
