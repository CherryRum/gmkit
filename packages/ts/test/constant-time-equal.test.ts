import { describe, it, expect } from 'vitest';
import { constantTimeEqual } from '../src';

describe('公开 constantTimeEqual', () => {
  it('equal arrays return true', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2, 3, 0xff]), new Uint8Array([1, 2, 3, 0xff]))).toBe(true);
  });
  it('different lengths return false', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
    expect(constantTimeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2]))).toBe(false);
  });
  it('different content returns false', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2, 3, 4]), new Uint8Array([1, 2, 3, 5]))).toBe(false);
  });
  it('empty arrays are equal', () => {
    expect(constantTimeEqual(new Uint8Array(0), new Uint8Array(0))).toBe(true);
  });
  it('null / undefined handled', () => {
    expect(constantTimeEqual(null, new Uint8Array([1]))).toBe(false);
    expect(constantTimeEqual(new Uint8Array([1]), undefined)).toBe(false);
    expect(constantTimeEqual(null, null)).toBe(false);
  });
  it('last-byte difference detected (no early return)', () => {
    const a = new Uint8Array(256);
    const b = new Uint8Array(256);
    b[255] = 1;
    expect(constantTimeEqual(a, b)).toBe(false);
  });
});
