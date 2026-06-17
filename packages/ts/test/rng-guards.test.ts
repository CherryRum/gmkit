import { describe, it, expect, afterEach } from 'vitest';
import { setCustomRNG, clearCustomRNG, hasCustomRNG, getRandomBytes } from '../src';

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
});