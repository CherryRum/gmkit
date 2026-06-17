import { bytesToBase64, bytesToHex, getRandomBytes, hexToBytes, stringToBytes } from 'gmkitx';

export type ToolValues = Record<string, string>;

export function required(values: ToolValues, name: string, label: string): string {
  const value = values[name]?.trim();
  if (!value) {
    throw new Error(`请填写 ${label}`);
  }
  return value;
}

export function randomHex(length = 16): string {
  return bytesToHex(getRandomBytes(length));
}

export function randomBase64(length = 16): string {
  return bytesToBase64(getRandomBytes(length));
}

export function normalizeLength(input: string | undefined, fallback: number): number {
  const value = Number(input || fallback);
  if (!Number.isInteger(value) || value <= 0 || value > 4096) {
    throw new Error('长度必须是 1-4096 之间的整数');
  }
  return value;
}

export function convertEncoding(from: string, to: string, value: string): string {
  const bytes = decodeValue(from, value);
  if (to === 'UTF-8') return new TextDecoder().decode(bytes);
  if (to === 'Hex') return bytesToHex(bytes);
  if (to === 'Base64') return bytesToBase64(bytes);
  if (to === 'URL') return encodeURIComponent(new TextDecoder().decode(bytes));
  throw new Error(`不支持的输出格式: ${to}`);
}

export function decodeValue(from: string, value: string): Uint8Array {
  if (from === 'UTF-8') return stringToBytes(value);
  if (from === 'Hex') return hexToBytes(value.replace(/\s+/g, ''));
  if (from === 'Base64') {
    const binary = atob(value);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }
  if (from === 'URL') return stringToBytes(decodeURIComponent(value));
  throw new Error(`不支持的输入格式: ${from}`);
}

export function makeJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
