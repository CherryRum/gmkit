import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bytesToHex,
  fallbackDecodeUtf8,
  fallbackEncodeUtf8,
} from '../src/core/utils';

describe('UTF-8 兼容编解码', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it.each([
    '',
    'ASCII',
    '中文与 emoji 😊',
    '\ud800',
    '\udc00',
    'A\ud800B\udc00C',
  ])('fallback 编码与 TextEncoder 一致: %j', (input) => {
    expect(fallbackEncodeUtf8(input)).toEqual(new TextEncoder().encode(input));
  });

  it.each([
    [[]],
    [[0x41, 0xe4, 0xb8, 0xad]],
    [[0xe2]],
    [[0xe2, 0x82]],
    [[0xe2, 0x28, 0xa1]],
    [[0xed, 0xa0, 0x80]],
    [[0xc0, 0xaf]],
    [[0xf4, 0x90, 0x80, 0x80]],
  ])('fallback 解码与 TextDecoder 默认替换语义一致: %j', (input) => {
    const bytes = Uint8Array.from(input);
    expect(fallbackDecodeUtf8(bytes)).toBe(new TextDecoder().decode(bytes));
  });

  it('确定性随机字节序列与 TextDecoder 保持一致', () => {
    const decoder = new TextDecoder();
    let state = 0x6d2b79f5;
    for (let caseIndex = 0; caseIndex < 2000; caseIndex++) {
      state = (Math.imul(state ^ (state >>> 15), 1 | state) + 0x9e3779b9) >>> 0;
      const length = state % 12;
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        state = (Math.imul(state ^ (state >>> 13), 0x85ebca6b) + i) >>> 0;
        bytes[i] = state & 0xff;
      }
      expect(fallbackDecodeUtf8(bytes), `bytes=${bytesToHex(bytes)}`).toBe(decoder.decode(bytes));
    }
  });

  it('ZUC 在没有全局 TextEncoder 时仍通过统一 codec 处理文本', async () => {
    vi.stubGlobal('TextEncoder', undefined);
    vi.resetModules();
    const { processBytes } = await import('../src/crypto/zuc/core');
    const key = '00000000000000000000000000000000';
    const iv = '00000000000000000000000000000000';

    expect(bytesToHex(processBytes(key, iv, '中文'))).toBe(
      bytesToHex(processBytes(key, iv, Uint8Array.from([0xe4, 0xb8, 0xad, 0xe6, 0x96, 0x87])))
    );
  });
});
