import { describe, it, expect, afterEach } from 'vitest';
import {
  configureRNG,
  setCustomRNG,
  clearCustomRNG,
  hasCustomRNG,
  getRandomBytes,
  sm2GenerateKeyPair,
  sm2Sign,
} from '../src';

describe('audit-C #3: custom RNG guards', () => {
  afterEach(() => {
    clearCustomRNG();
  });

  it('hasCustomRNG starts false', () => {
    expect(hasCustomRNG()).toBe(false);
  });

  it('setCustomRNG flips hasCustomRNG to true', () => {
    setCustomRNG((n) => new Uint8Array(n));
    expect(hasCustomRNG()).toBe(true);
  });

  it('拒绝非法 RNG 策略和随机字节长度', () => {
    expect(() => configureRNG('fallback' as any)).toThrow('Invalid RNG policy');
    for (const length of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => getRandomBytes(length)).toThrow('positive safe integer');
    }
    configureRNG('warn');
  });

  it('拒绝自定义 RNG 的错误返回类型或长度', () => {
    setCustomRNG((() => [1, 2, 3]) as any);
    expect(() => getRandomBytes(3)).toThrow('must return a Uint8Array');

    setCustomRNG(() => new Uint8Array(2));
    expect(() => getRandomBytes(3)).toThrow('returned 2 bytes; expected 3');
  });

  it('Web Crypto 大请求按 65536 字节分块', () => {
    const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    const chunks: number[] = [];
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        getRandomValues(target: Uint8Array) {
          chunks.push(target.length);
          target.fill(0xa5);
          return target;
        },
      },
    });

    try {
      const bytes = getRandomBytes(65537);
      expect(chunks).toEqual([65536, 1]);
      expect(bytes[0]).toBe(0xa5);
      expect(bytes[65536]).toBe(0xa5);
    } finally {
      if (originalCrypto) Object.defineProperty(globalThis, 'crypto', originalCrypto);
      else Reflect.deleteProperty(globalThis, 'crypto');
    }
  });

  it('clearCustomRNG restores default path', () => {
    setCustomRNG(() => new Uint8Array([0xff]));
    expect(getRandomBytes(1)[0]).toBe(0xff);
    clearCustomRNG();
    expect(hasCustomRNG()).toBe(false);
    // After clear, getRandomBytes returns from system RNG; just verify
    // we get a Uint8Array of the right length, not the seeded value.
    const buf = getRandomBytes(8);
    expect(buf).toBeInstanceOf(Uint8Array);
    expect(buf.length).toBe(8);
  });

  it('SM2 签名在自定义 RNG 持续返回非法标量时应该有限失败', () => {
    const keyPair = sm2GenerateKeyPair();
    setCustomRNG((n) => new Uint8Array(n));

    expect(() => sm2Sign(keyPair.privateKey, 'message')).toThrow(
      'Failed to generate a valid SM2 scalar'
    );
  });
});
