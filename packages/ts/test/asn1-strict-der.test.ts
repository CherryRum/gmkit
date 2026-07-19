import { describe, it, expect } from 'vitest';
import {
  decodeInteger,
  decodeSequence,
  decodeSignature,
  encodeInteger,
  encodeSignature,
  rawToDer,
} from '../src/core/asn1';

describe('audit-C #1: ASN.1 INTEGER canonical DER', () => {
  it('rejects trailing bytes after a signature sequence', () => {
    const valid = encodeSignature(new Uint8Array([1]), new Uint8Array([2]));
    const trailing = new Uint8Array(valid.length + 1);
    trailing.set(valid);
    expect(() => decodeSignature(trailing)).toThrow('trailing data');
  });
  it('accepts canonical encoding of zero (02 01 00)', () => {
    const { value } = decodeInteger(new Uint8Array([0x02, 0x01, 0x00]));
    expect(value.length).toBe(1);
    expect(value[0]).toBe(0);
  });

  it('accepts canonical positive int (02 02 00 80) when MSB is set', () => {
    // 0x80 has MSB set, so the leading 0x00 is REQUIRED to keep it positive.
    const { value } = decodeInteger(new Uint8Array([0x02, 0x02, 0x00, 0x80]));
    expect(value.length).toBe(1);
    expect(value[0]).toBe(0x80);
  });

  it('REJECTS non-canonical with extra leading zero (02 03 00 00 01)', () => {
    // 0x01 does NOT have MSB set; the leading 0x00 is NOT allowed in DER.
    // A strict decoder must reject this as ASN.1 signature malleability.
    expect(() => decodeInteger(new Uint8Array([0x02, 0x03, 0x00, 0x00, 0x01])))
      .toThrow(/non-canonical|leading zero|malleable/i);
  });

  it('REJECTS negative-encoded integer (02 01 80)', () => {
    // A leading byte with MSB set means a negative integer in ASN.1 INTEGER.
    // SM2 r/s must be positive; reject upfront.
    expect(() => decodeInteger(new Uint8Array([0x02, 0x01, 0x80])))
      .toThrow(/negative|positive/i);
  });

  it('encodeInteger roundtrip', () => {
    const original = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
    const encoded = encodeInteger(original);
    const { value } = decodeInteger(encoded);
    expect(Array.from(value)).toEqual(Array.from(original));
  });

  it('rejects invalid hexadecimal integers and empty integers', () => {
    expect(() => encodeInteger('gg')).toThrow('Invalid hex string');
    expect(() => encodeInteger(new Uint8Array())).toThrow('at least one byte');
    expect(() => rawToDer('z'.repeat(128))).toThrow('Invalid hex string');
  });

  it('rejects non-canonical DER length forms', () => {
    expect(() => decodeInteger(new Uint8Array([0x02, 0x81, 0x01, 0x01])))
      .toThrow('long form used for short length');
    expect(() => decodeInteger(new Uint8Array([0x02, 0x82, 0x00, 0x80])))
      .toThrow('leading zero');
  });

  it('rejects an element that crosses its containing sequence boundary', () => {
    const malformed = new Uint8Array([0x30, 0x03, 0x02, 0x02, 0x01, 0x00]);
    expect(() => decodeSequence(malformed)).toThrow('beyond sequence boundary');
  });
});
