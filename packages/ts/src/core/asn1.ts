/**
 * ASN.1 DER encoding/decoding utilities for SM2 (Optimized)
 * Based on ITU-T X.690 standard
 *
 * 实现要点：
 * 1. Hex 转换走预计算查找表，避免 parseInt / toString(16) 的热路径开销。
 * 2. 解码优先使用 Uint8Array.subarray 创建视图，避免冗余的内存复制。
 * 3. INTEGER 编码遵守最小化规则：自动去除多余前导零，自动按 MSB 补零。
 * 4. 长度前缀采用预计算偏移量写入，避免 unshift 触发数组搬移。
 */

import { decodeInput, type BytesLike } from './utils';
import { InputFormat, type InputFormatType } from '../types/constants';

/**
 * ASN.1 Tag 常量定义
 * 基于 ITU-T X.690 标准
 */
export const ASN1Tag = {
  /** 整数类型（有符号大整数） */
  INTEGER: 0x02,
  /** 比特串类型 */
  BIT_STRING: 0x03,
  /** 字节串类型 */
  OCTET_STRING: 0x04,
  /** 空类型 */
  NULL: 0x05,
  /** 对象标识符 */
  OBJECT_IDENTIFIER: 0x06,
  /** 序列类型（结构体） */
  SEQUENCE: 0x30,
} as const;

/**
 * 高性能 Hex 工具集
 * 使用预计算字节查找表替代 parseInt / 字符串拼接，消除热路径上的
 * 临时字符串分配
 */
const Hex = {
  /** 预计算的字节到十六进制的映射表 (00-ff) */
  byteToHex: Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0')),
  
  /**
   * 将字节数组编码为十六进制字符串
   * @param bytes - 要编码的字节数组
   * @returns 小写十六进制字符串
   */
  encode(bytes: Uint8Array): string {
    const hex: string[] = new Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      hex[i] = this.byteToHex[bytes[i]];
    }
    return hex.join('');
  },

  /**
   * 将十六进制字符串解码为字节数组
   * @param hex - 十六进制字符串
   * @returns 字节数组
   * @throws 如果字符串长度为奇数则抛出异常
   */
  decode(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) throw new Error('Invalid hex string length');
    if (!/^[0-9a-fA-F]*$/.test(hex)) throw new Error('Invalid hex string');
    const len = hex.length / 2;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }
};

/**
 * 将长度编码为 DER 格式
 * 
 * DER 长度编码规则：
 * - 短形式（长度 < 128）：单字节表示长度
 * - 长形式（长度 >= 128）：首字节的高位为 1，低 7 位表示后续长度字节数
 * 
 * @param length - 要编码的长度值
 * @returns DER 编码的长度字节数组
 */
function encodeLength(length: number): Uint8Array {
  if (!Number.isSafeInteger(length) || length < 0 || length > 0xffffffff) {
    throw new Error('DER length must be an unsigned 32-bit integer');
  }
  if (length < 128) {
    return new Uint8Array([length]);
  }

  // 计算需要的字节数
  let temp = length;
  let byteCount = 0;
  while (temp > 0) {
    byteCount++;
    temp = Math.floor(temp / 256);
  }

  const result = new Uint8Array(byteCount + 1);
  result[0] = 0x80 | byteCount;

  temp = length;
  for (let i = byteCount; i > 0; i--) {
    result[i] = temp % 256;
    temp = Math.floor(temp / 256);
  }

  return result;
}

/**
 * 从 DER 格式解码长度
 * @param data - 包含 DER 编码数据的字节数组
 * @param offset - 长度字节的起始偏移量
 * @returns 解码的长度值和读取的字节数
 * @throws 如果偏移量超出范围或长度格式无效则抛出异常
 */
function decodeLength(data: Uint8Array, offset: number): { length: number; bytesRead: number } {
  if (offset >= data.length) throw new Error('Offset out of bounds');

  const firstByte = data[offset];

  if (firstByte < 128) {
    return { length: firstByte, bytesRead: 1 };
  }

  const numBytes = firstByte & 0x7f;
  if (numBytes === 0 || numBytes > 4) {
    throw new Error('Invalid or unsupported long form length');
  }

  if (offset + 1 + numBytes > data.length) throw new Error('Length bytes out of bounds');
  if (data[offset + 1] === 0) throw new Error('Non-canonical DER length: leading zero');

  let length = 0;
  for (let i = 0; i < numBytes; i++) {
    length = length * 256 + data[offset + 1 + i];
  }
  if (length < 128) throw new Error('Non-canonical DER length: long form used for short length');

  return { length, bytesRead: 1 + numBytes };
}

/**
 * 将整数编码为 DER 格式
 * 
 * DER INTEGER 编码规则：
 * 1. 移除前导零（最小化编码）
 * 2. 如果最高位为 1（>= 0x80），则添加 0x00 前缀表示正数
 * 
 * @param value - 要编码的整数（十六进制字符串或字节数组）
 * @returns DER 编码的整数
 */
export function encodeInteger(value: string | Uint8Array): Uint8Array {
  let bytes: Uint8Array;

  if (typeof value === 'string') {
    bytes = Hex.decode(value);
  } else {
    bytes = value;
  }
  if (bytes.length === 0) throw new Error('ASN.1 INTEGER must be at least one byte');

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
 * 从 DER 格式解码整数
 * 
 * 返回的值会自动去掉 DER 编码中的符号位填充（0x00 前缀）
 * 
 * @param data - 包含 DER 编码整数的字节数组
 * @param offset - 整数的起始偏移量（默认 0）
 * @returns 解码的整数值（Uint8Array）和读取的字节数
 * @throws 如果标签不是 INTEGER 或数据超出范围则抛出异常
 */
export function decodeInteger(data: Uint8Array, offset: number = 0): { value: Uint8Array; bytesRead: number } {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= data.length) {
    throw new Error('INTEGER offset out of bounds');
  }
  if (data[offset] !== ASN1Tag.INTEGER) {
    throw new Error(`Expected INTEGER tag (0x02), got 0x${data[offset].toString(16)}`);
  }

  const { length, bytesRead: lengthBytes } = decodeLength(data, offset + 1);
  const start = offset + 1 + lengthBytes;
  const end = start + length;

  if (end > data.length) throw new Error('Integer value out of bounds');
  if (length === 0) throw new Error('ASN.1 INTEGER must be at least one byte');

  // 严格 DER 校验：
  // - 第一字节 MSB 置位代表负整数，SM2 r/s 必须为正 — 拒绝。
  // - 长度 > 1 且首字节 0x00，仅当下一字节 MSB 置位时才合法（用于保持正号）；
  //   否则即为非规范化前导 0，构成签名可塑性风险，拒绝。
  let value = data.subarray(start, end);
  if (value.length === 1) {
    if (value[0] >= 0x80) {
      throw new Error('ASN.1 INTEGER is negative (MSB set); SM2 r/s must be positive');
    }
  } else {
    if (value[0] === 0x00) {
      if ((value[1] & 0x80) === 0) {
        throw new Error('Non-canonical ASN.1 INTEGER: leading zero not required (signature malleability)');
      }
      value = value.subarray(1);
    } else if (value[0] >= 0x80) {
      throw new Error('ASN.1 INTEGER is negative (MSB set); SM2 r/s must be positive');
    }
  }

  return {
    value,
    bytesRead: 1 + lengthBytes + length,
  };
}

/**
 * 将多个元素编码为 DER SEQUENCE
 * @param elements - 要编码的元素数组
 * @returns DER 编码的 SEQUENCE
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
 * 从 DER 格式解码 SEQUENCE
 * @param data - 包含 DER 编码 SEQUENCE 的字节数组
 * @param offset - SEQUENCE 的起始偏移量（默认 0）
 * @returns 解码的元素数组和读取的字节数
 * @throws 如果标签不是 SEQUENCE 或数据超出范围则抛出异常
 */
export function decodeSequence(data: Uint8Array, offset: number = 0): { elements: Uint8Array[]; bytesRead: number } {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= data.length) {
    throw new Error('SEQUENCE offset out of bounds');
  }
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
    if (pos + 1 >= contentEnd) throw new Error('Truncated element in DER sequence');
    // 解析下一个 TLV 元素的长度
    const { length: elemLength, bytesRead: elemLengthBytes } = decodeLength(data, pos + 1);
    const elemTotalLength = 1 + elemLengthBytes + elemLength;
    if (pos + elemTotalLength > contentEnd) {
      throw new Error('DER element extends beyond sequence boundary');
    }

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
 * 将 SM2 签名 (r, s) 编码为 DER 格式
 * @param r - 签名分量 r（十六进制字符串或字节数组）
 * @param s - 签名分量 s（十六进制字符串或字节数组）
 * @returns DER 编码的签名
 */
export function encodeSignature(r: string | Uint8Array, s: string | Uint8Array): Uint8Array {
  const rEncoded = encodeInteger(r);
  const sEncoded = encodeInteger(s);
  return encodeSequence(rEncoded, sEncoded);
}

/**
 * 解码 DER 格式的 SM2 签名
 * @param signature - DER 编码的签名
 * @returns 解码的签名分量 { r, s }，均为小写十六进制字符串
 * @throws 如果签名格式无效则抛出异常
 */
export function decodeSignature(signature: Uint8Array): {
  /** 32 字节整数 r 的小写十六进制表示，不含符号补位字节。 */
  r: string;
  /** 32 字节整数 s 的小写十六进制表示，不含符号补位字节。 */
  s: string;
} {
  const { elements, bytesRead } = decodeSequence(signature);
  if (bytesRead !== signature.length) {
    throw new Error('Invalid signature: trailing data after DER sequence');
  }

  if (elements.length !== 2) {
    throw new Error('Invalid signature: expected 2 elements (r, s)');
  }

  const { value: rBytes } = decodeInteger(elements[0]);
  const { value: sBytes } = decodeInteger(elements[1]);

  return {
    r: Hex.encode(rBytes),
    s: Hex.encode(sBytes)
  };
}

/**
 * 将原始格式签名 (r || s) 转换为 DER 格式
 * @param rawSignature - 原始签名（64 字节或 128 个十六进制字符）
 * @returns DER 编码的签名
 * @throws 如果输入长度不正确则抛出异常
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
 * 将 DER 格式签名转换为原始格式 (r || s)
 * @param derSignature - DER 编码的签名
 * @returns 原始格式签名（128 个十六进制字符，r 和 s 各 64 个字符）
 */
export function derToRaw(derSignature: Uint8Array): string {
  const { r, s } = decodeSignature(derSignature);
  if (r.length > 64 || s.length > 64) {
    throw new Error('SM2 signature integers must fit in 32 bytes');
  }

  // SM2 标准：r 和 s 必须填充到 32 字节（64 个十六进制字符）
  const rPadded = r.padStart(64, '0');
  const sPadded = s.padStart(64, '0');

  return rPadded + sPadded;
}

// --- 调试/可视化工具 ---

const MAX_XML_NESTING_DEPTH = 64;

/**
 * 将 ASN.1 DER 数据转换为 XML 格式（用于调试和可视化）
 * @param data - DER 编码的数据
 * @param indent - 初始缩进级别（默认 0）
 * @returns XML 格式的字符串
 */
export function asn1ToXml(data: Uint8Array, indent: number = 0): string {
  if (!Number.isSafeInteger(indent) || indent < 0 || indent > MAX_XML_NESTING_DEPTH) {
    throw new Error(`ASN.1 XML indent must be an integer between 0 and ${MAX_XML_NESTING_DEPTH}`);
  }
  const buffer: string[] = [];

  function recurse(offset: number, level: number, boundary: number, depth: number): number {
    if (depth > MAX_XML_NESTING_DEPTH) {
      throw new Error(`ASN.1 XML nesting depth exceeds ${MAX_XML_NESTING_DEPTH}`);
    }
    if (offset < 0 || offset + 1 >= boundary || boundary > data.length) {
      throw new Error('Truncated ASN.1 element');
    }

    const spaces = '  '.repeat(level);
    const tag = data[offset];
    const { length, bytesRead: lengthBytes } = decodeLength(data, offset + 1);
    const contentStart = offset + 1 + lengthBytes;
    const contentEnd = contentStart + length;
    if (contentEnd > boundary || contentEnd > data.length) {
      throw new Error('ASN.1 element extends beyond its container boundary');
    }

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
        subOffset = recurse(subOffset, level + 1, contentEnd, depth + 1);
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
    return contentEnd;
  }

  // 支持连续多个根 TLV，但每个元素都必须完整落在当前输入边界内。
  let rootOffset = 0;
  while (rootOffset < data.length) {
    rootOffset = recurse(rootOffset, indent, data.length, 0);
  }

  return buffer.join('');
}

/**
 * 将 SM2 签名转换为便于诊断的 XML 文本。
 *
 * 该输出只用于查看 ASN.1 结构，不是标准签名交换格式，解析不可信 XML 时不应
 * 反向依赖此调试表示。
 *
 * @param signature - DER 签名或 64 字节 raw `r || s` 签名
 * @param options - 签名格式和输入编码；默认按 raw Hex 处理
 * @returns 包含 r、s 与 DER TLV 结构的 XML 字符串
 * @throws 输入编码、raw 长度或 DER 结构无效时抛出错误
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


