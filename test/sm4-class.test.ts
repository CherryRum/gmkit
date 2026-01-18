import { describe, it, expect } from 'vitest';
import { SM4 } from '../src/crypto/sm4/class';
import { CipherMode, PaddingMode } from '../src/types/constants';

const KEY = '0123456789abcdeffedcba9876543210';

describe('SM4 class API', () => {
  it('creates working instances from factory helpers', () => {
    const iv = 'fedcba98765432100123456789abcdef';
    const sm4 = SM4.CBC(KEY, iv);
    const ciphertext = sm4.encrypt('Hello, CBC factory!');
    expect(typeof ciphertext).toBe('object');

    const plaintext = sm4.decrypt(ciphertext);
    expect(plaintext).toBe('Hello, CBC factory!');
  });

  it('allows switching configuration on an instance', () => {
    const sm4 = new SM4(KEY);
    const blockAligned = '1234567890abcdef';

    sm4.setPadding(PaddingMode.NONE);
    const ecbCiphertext = sm4.encrypt(blockAligned);
    expect(sm4.decrypt(ecbCiphertext)).toBe(blockAligned);

    const iv = '00000000000000000000000000000000';
    sm4.setMode(CipherMode.CTR);
    sm4.setIV(iv);
    const ctrCiphertext = sm4.encrypt('CTR stream data');
    expect(sm4.decrypt(ctrCiphertext)).toBe('CTR stream data');
  });

  it('supports authenticated encryption via the GCM factory', () => {
    const iv = '000000000000000000000000';
    const sm4 = SM4.GCM(KEY, iv);
    const result = sm4.encrypt('Sensitive payload');

    expect(result).toBeTypeOf('object');
    if (typeof result === 'string') {
      throw new Error('Expected SM4 GCM to return authentication data');
    }

    expect(result).toHaveProperty('ciphertext');
    expect(result).toHaveProperty('tag');

    const decrypted = sm4.decrypt(result);
    expect(decrypted).toBe('Sensitive payload');
  });
});
