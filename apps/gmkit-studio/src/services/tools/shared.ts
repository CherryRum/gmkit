import { base64ToBytes, bytesToBase64, bytesToHex, getRandomBytes, hexToBytes, stringToBytes } from 'gmkitx';

import type { ToolValues } from './types';

export function textValue(options: ToolValues, key: string, fallback = ''): string {
  const value = options[key];
  return typeof value === 'string' ? value : fallback;
}

export function boolValue(options: ToolValues, key: string, fallback = false): boolean {
  const value = options[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function jsonInput<T = Record<string, unknown>>(input: string, fallback: T): T {
  if (!input.trim()) return fallback;
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

export function requireJsonInput<T = Record<string, unknown>>(input: string, label = 'JSON 输入'): T {
  try {
    return JSON.parse(input) as T;
  } catch {
    throw new Error(`请提供 ${label}`);
  }
}

export function encodeBytes(bytes: Uint8Array, format = 'Base64'): string {
  return format === 'Hex' ? bytesToHex(bytes) : bytesToBase64(bytes);
}

export function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function decodeBytes(value: string, format = 'Base64'): Uint8Array {
  if (format === 'Hex') return hexToBytes(value.replace(/\s+/g, ''));
  if (format === 'UTF-8' || format === 'Text') return stringToBytes(value);
  return base64ToBytes(value.trim());
}

export function randomHex(bytes = 16): string {
  return bytesToHex(getRandomBytes(bytes));
}

export function randomBase64(bytes = 16): string {
  return bytesToBase64(getRandomBytes(bytes));
}

export function normalizePem(pem: string): string {
  return pem.replace(/\r\n/g, '\n').trim();
}

export function pretty(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

export function stringToBase64(value: string): string {
  return bytesToBase64(stringToBytes(value));
}
