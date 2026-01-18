/**
 * ASN.1 DER encoding/decoding utilities for SM2 (Optimized)
 * Based on ITU-T X.690 standard
 *
 * 优化记录：
 * 1. 引入 Hex 工具集：使用预计算查找表代替 parseInt/toString，大幅提升转换性能。
 * 2. 内存优化：在解码时优先使用 subarray 创建视图而非 slice 复制内存。
 * 3. 严格合规：完善了 INTEGER 的最小化编码规则（自动去除多余前导零，自动处理 MSB 补零）。
 * 4. 长度计算：移除 unshift 操作，改用预计算偏移量。
 */

import { decodeInput, type BytesLike } from './utils';
import { InputFormat, type InputFormatType } from '../types/constants';

export const ASN1Tag = {
  INTEGER: 0x02,
  BIT_STRING: 0x03,
  OCTET_STRING: 0x04,
  NULL: 0x05,
  OBJECT_IDENTIFIER: 0x06,
  SEQUENCE: 0x30,
} as const;

/**
 * 高性能 Hex 工具，避免频繁的 parseInt 和字符串拼接
 */
const Hex = {
  // 预计算字节到 Hex 的映射
  byteToHex: Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0')),
  encode(bytes: Uint8Array): string {
    const hex: string[] = new Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      hex[i] = this.byteToHex[bytes[i]];
    }
    return hex.join('');
  },

  decode(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) throw new Error('Invalid hex string length');
    const len = hex.length / 2;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }
};

/**
 * Encode length in DER format (Optimized)
 */
function encodeLength(length: number): Uint8Array {
  if (length < 128) {
    return new Uint8Array([length]);
  }

  // 计算需要的字节数
  let temp = length;
  let byteCount = 0;
  while (temp > 0) {
    byteCount++;
    temp >>>= 8; // 无符号右移
  }

  const result = new Uint8Array(byteCount + 1);
  result[0] = 0x80 | byteCount;

  temp = length;
  for (let i = byteCount; i > 0; i--) {
    result[i] = temp & 0xff;
    temp >>>= 8;
  }

  return result;
}

/**
 * Decode length from DER format
 */
function decodeLength(data: Uint8Array, offset: number): { length: number; bytesRead: number } {
  if (offset >= data.length) throw new Error('Offset out of bounds');

  const firstByte = data[offset];

  if (firstByte < 128) {
    return { length: firstByte, bytesRead: 1 };
  }

  const numBytes = firstByte & 0x7f;
  if (numBytes === 0 || numBytes > 4) { // JS bitwise limit implies strict check usually < 4 bytes for typical usage
    throw new Error('Invalid or unsupported long form length');
  }

  if (offset + 1 + numBytes > data.length) throw new Error('Length bytes out of bounds');

  let length = 0;
  for (let i = 0; i < numBytes; i++) {
    length = (length << 8) | data[offset + 1 + i];
  }

  return { length, bytesRead: 1 + numBytes };
}

/**
 * Encode integer in DER format
 * 自动处理前导零去除和符号位补零（针对 SM2 正整数场景）
 */
export function encodeInteger(value: string | Uint8Array): Uint8Array {
  let bytes: Uint8Array;

  if (typeof value === 'string') {
    bytes = Hex.decode(value);
  } else {
    bytes = value;
  }

  // 1. 移除原始数据中的冗余前导零 (DER 规则：最小化编码)
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) {
    start++;
  }
  // 如果去掉了前导零，创建一个视图（不复制内存，除非必要）
  if (start > 0) {
    bytes = bytes.subarray(start);
  }

  // 2. 检查最高位 (MSB)
  // 如果最高位是 1 (>= 0x80)，DER 认为这是负数。
  // 因为 SM2 r,s 是正大数，所以必须补一个 0x00 字节。
  const needPadding = (bytes[0] & 0x80) !== 0;

  // 计算总长度
  const contentLen = bytes.length + (needPadding ? 1 : 0);
  const lengthBytes = encodeLength(contentLen);

  // 分配最终内存
  const result = new Uint8Array(1 + lengthBytes.length + contentLen);

  // 填充数据
  let offset = 0;
  result[offset++] = ASN1Tag.INTEGER;
  result.set(lengthBytes, offset);
  offset += lengthBytes.length;

  if (needPadding) {
    result[offset++] = 0x00;
  }

  result.set(bytes, offset);

  return result;
}

/**
 * Decode integer from DER format
 * 返回的值会自动去掉填充的 0x00，还原为原始的大数值
 */
export function decodeInteger(data: Uint8Array, offset: number = 0): { value: Uint8Array; bytesRead: number } {
  if (data[offset] !== ASN1Tag.INTEGER) {
    throw new Error(`Expected INTEGER tag (0x02), got 0x${data[offset].toString(16)}`);
  }

  const { length, bytesRead: lengthBytes } = decodeLength(data, offset + 1);
  const start = offset + 1 + lengthBytes;
  const end = start + length;

  if (end > data.length) throw new Error('Integer value out of bounds');

  // 使用 subarray 获取视图，避免复制
  // 修正：如果是为了获取数值，且第一个字节是 0x00 且长度>1（表示这是符号位填充），则应当去掉
  // 注意：如果数值本身就是 0，编码是 02 01 00，此时不应去掉
  let value = data.subarray(start, end);
  if (value.length > 1 && value[0] === 0x00) {
    value = value.subarray(1);
  }

  return {
    value: value, // 返回的是 subarray，如果需要修改则需 slice
    bytesRead: 1 + lengthBytes + length,
  };
}

/**
 * Encode sequence in DER format
 */
export function encodeSequence(...elements: Uint8Array[]): Uint8Array {
  let contentLength = 0;
  for (const el of elements) contentLength += el.length;

  const lengthBytes = encodeLength(contentLength);
  const result = new Uint8Array(1 + lengthBytes.length + contentLength);

  result[0] = ASN1Tag.SEQUENCE;
  result.set(lengthBytes, 1);

  let offset = 1 + lengthBytes.length;
  for (const element of elements) {
    result.set(element, offset);
    offset += element.length;
  }

  return result;
}

/**
 * Decode sequence from DER format
 */
export function decodeSequence(data: Uint8Array, offset: number = 0): { elements: Uint8Array[]; bytesRead: number } {
  if (data[offset] !== ASN1Tag.SEQUENCE) {
    throw new Error('Expected SEQUENCE tag');
  }

  const { length, bytesRead: lengthBytes } = decodeLength(data, offset + 1);
  const contentStart = offset + 1 + lengthBytes;
  const contentEnd = contentStart + length;

  if (contentEnd > data.length) throw new Error('Sequence content out of bounds');

  const elements: Uint8Array[] = [];
  let pos = contentStart;

  while (pos < contentEnd) {
    // 预读取下一个 tag 的长度，但不完全解码，通过 tag 类型和长度字段推算
    // 这里直接递归调用逻辑其实也可以，但为了通用性，我们只解析长度
    // 注意：这里假设内部元素也是 TLV 结构
    const { length: elemLength, bytesRead: elemLengthBytes } = decodeLength(data, pos + 1);
    const elemTotalLength = 1 + elemLengthBytes + elemLength;

    // 使用 subarray 引用，零拷贝
    elements.push(data.subarray(pos, pos + elemTotalLength));
    pos += elemTotalLength;
  }

  return {
    elements,
    bytesRead: 1 + lengthBytes + length,
  };
}

/**
 * Encode SM2 signature (r, s)
 */
export function encodeSignature(r: string | Uint8Array, s: string | Uint8Array): Uint8Array {
  // 类型归一化在 encodeInteger 内部处理，这里直接传递
  const rEncoded = encodeInteger(r);
  const sEncoded = encodeInteger(s);
  return encodeSequence(rEncoded, sEncoded);
}

/**
 * Decode SM2 signature
 */
export function decodeSignature(signature: Uint8Array): { r: string; s: string } {
  const { elements } = decodeSequence(signature);

  if (elements.length !== 2) {
    throw new Error('Invalid signature: expected 2 elements (r, s)');
  }

  // 这里的 decodeInteger 返回的是 subarray，转 hex 时很高效
  const { value: rBytes } = decodeInteger(elements[0]);
  const { value: sBytes } = decodeInteger(elements[1]);

  return {
    r: Hex.encode(rBytes),
    s: Hex.encode(sBytes)
  };
}

/**
 * Convert raw signature (r || s) to DER format
 * Input: 64 bytes hex string (128 chars) or 64 bytes Uint8Array
 */
export function rawToDer(rawSignature: string | Uint8Array): Uint8Array {
  let bytes: Uint8Array;
  if (typeof rawSignature === 'string') {
    if (rawSignature.length !== 128) throw new Error('Raw signature string must be 128 hex chars');
    bytes = Hex.decode(rawSignature);
  } else {
    if (rawSignature.length !== 64) throw new Error('Raw signature bytes must be 64 bytes');
    bytes = rawSignature;
  }

  const r = bytes.subarray(0, 32);
  const s = bytes.subarray(32, 64);

  return encodeSignature(r, s);
}

/**
 * Convert DER signature to raw format (r || s)
 */
export function derToRaw(derSignature: Uint8Array): string {
  const { r, s } = decodeSignature(derSignature);

  // SM2 standard: r and s must be padded to 32 bytes (64 hex chars)
  const rPadded = r.padStart(64, '0');
  const sPadded = s.padStart(64, '0');

  return rPadded + sPadded;
}

// --- Debugging / Visualization Utilities ---

/**
 * Convert ASN.1 DER to XML (Optimized for buffer building)
 */
export function asn1ToXml(data: Uint8Array, indent: number = 0): string {
  const buffer: string[] = [];

  function recurse(offset: number, level: number) {
    if (offset >= data.length) return;

    const spaces = '  '.repeat(level);
    const tag = data[offset];
    const { length, bytesRead: lengthBytes } = decodeLength(data, offset + 1);
    const contentStart = offset + 1 + lengthBytes;
    const contentEnd = contentStart + length;

    let tagName: string;
    switch (tag) {
      case ASN1Tag.INTEGER: tagName = 'INTEGER'; break;
      case ASN1Tag.BIT_STRING: tagName = 'BIT_STRING'; break;
      case ASN1Tag.OCTET_STRING: tagName = 'OCTET_STRING'; break;
      case ASN1Tag.NULL: tagName = 'NULL'; break;
      case ASN1Tag.OBJECT_IDENTIFIER: tagName = 'OBJECT_IDENTIFIER'; break;
      case ASN1Tag.SEQUENCE: tagName = 'SEQUENCE'; break;
      default: tagName = `TAG_0x${tag.toString(16).toUpperCase().padStart(2, '0')}`;
    }

    buffer.push(`${spaces}<${tagName}>`);

    if (tag === ASN1Tag.SEQUENCE) {
      buffer.push('\n');
      // 遍历 SEQUENCE 内部
      let subOffset = contentStart;
      while (subOffset < contentEnd) {
        const subTagLenInfo = decodeLength(data, subOffset + 1);
        // 递归调用前需要计算当前子元素的总长度，以便确定下一次循环的 offset
        const nextOffset = subOffset + 1 + subTagLenInfo.bytesRead + subTagLenInfo.length;
        recurse(subOffset, level + 1);
        subOffset = nextOffset;
      }
      buffer.push(`${spaces}`); // Closing tag indentation
    } else {
      // Primitive types
      const value = data.subarray(contentStart, contentEnd);
      const hexValue = Hex.encode(value);
      if (tag === ASN1Tag.NULL) {
        // No value
      } else {
        buffer.push(`\n${spaces}  <value>${hexValue}</value>\n${spaces}`);
      }
    }

    buffer.push(`</${tagName}>\n`);
  }

  // Start parsing from root
  let rootOffset = 0;
  while(rootOffset < data.length) {
    const { length, bytesRead } = decodeLength(data, rootOffset + 1);
    const fullLen = 1 + bytesRead + length;
    recurse(rootOffset, indent);
    rootOffset += fullLen;
  }

  return buffer.join('');
}

/**
 * Convert SM2 signature to XML representation
 * @param signature - DER-encoded signature or raw signature (r || s)
 * @param isDer - Whether the signature is DER-encoded (default: auto-detect)
 * @returns XML string representation of the signature
 */
export function signatureToXml(
  signature: BytesLike,
  options?: {
    signatureFormat?: 'raw' | 'der' | 'auto';
    inputFormat?: InputFormatType;
  }
): string {
  const signatureFormat = options?.signatureFormat || 'raw';
  const inputFormat = options?.inputFormat || InputFormat.HEX;
  const sigBytes = decodeInput(signature, inputFormat);
  let derBytes: Uint8Array;

  if (signatureFormat === 'der') {
    derBytes = sigBytes;
  } else if (signatureFormat === 'auto') {
    derBytes = sigBytes[0] === 0x30 ? sigBytes : rawToDer(sigBytes);
  } else {
    derBytes = rawToDer(sigBytes);
  }

  const { r, s } = decodeSignature(derBytes);

  // 这里的 r 和 s 已经是 Hex.encode 出来的（小写），符合测试用例中的 .toLowerCase() 预期
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<SM2Signature>',
    `  <r>${r}</r>`,
    `  <s>${s}</s>`,
    '  <DER>', // 恢复为 <DER> 标签
    asn1ToXml(derBytes, 2).trimEnd(),
    '  </DER>',
    '</SM2Signature>'
  ].join('\n');
}


