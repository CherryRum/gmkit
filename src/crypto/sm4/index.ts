/**
 * SM4 分组密码算法实现
 *
 * 参考标准：
 * - GM/T 0002-2012: SM4 分组密码算法
 * - 官方网站：http://www.oscca.gov.cn/
 *
 * SM4 是中国国家密码管理局发布的分组密码算法，用于对称加密，
 * 主要用于商用密码应用中的数据加密。
 *
 * 算法特点：
 * - 分组长度：128 位（16 字节）
 * - 密钥长度：128 位（16 字节）
 * - 轮数：32 轮
 * - 支持多种工作模式：ECB、CBC、CTR、CFB、OFB、GCM
 */

import {
  normalizeInput,
  hexToBytes,
  decodeInput,
  encodeOutput,
  bytesToString,
  xor,
  bytes4ToUint32BE,
  uint32ToBytes4BE,
  constantTimeEqual,
  isHexString,
  type BytesLike
} from '../../core/utils';
import {
  PaddingMode,
  CipherMode,
  OutputFormat,
  InputFormat,
  type PaddingModeType,
  type CipherModeType,
  type OutputFormatType,
  type InputFormatType
} from '../../types/constants';

// SM4 S盒（置换盒）- 用于非线性变换
const SBOX: number[] = [
  0xd6, 0x90, 0xe9, 0xfe, 0xcc, 0xe1, 0x3d, 0xb7, 0x16, 0xb6, 0x14, 0xc2, 0x28, 0xfb, 0x2c, 0x05,
  0x2b, 0x67, 0x9a, 0x76, 0x2a, 0xbe, 0x04, 0xc3, 0xaa, 0x44, 0x13, 0x26, 0x49, 0x86, 0x06, 0x99,
  0x9c, 0x42, 0x50, 0xf4, 0x91, 0xef, 0x98, 0x7a, 0x33, 0x54, 0x0b, 0x43, 0xed, 0xcf, 0xac, 0x62,
  0xe4, 0xb3, 0x1c, 0xa9, 0xc9, 0x08, 0xe8, 0x95, 0x80, 0xdf, 0x94, 0xfa, 0x75, 0x8f, 0x3f, 0xa6,
  0x47, 0x07, 0xa7, 0xfc, 0xf3, 0x73, 0x17, 0xba, 0x83, 0x59, 0x3c, 0x19, 0xe6, 0x85, 0x4f, 0xa8,
  0x68, 0x6b, 0x81, 0xb2, 0x71, 0x64, 0xda, 0x8b, 0xf8, 0xeb, 0x0f, 0x4b, 0x70, 0x56, 0x9d, 0x35,
  0x1e, 0x24, 0x0e, 0x5e, 0x63, 0x58, 0xd1, 0xa2, 0x25, 0x22, 0x7c, 0x3b, 0x01, 0x21, 0x78, 0x87,
  0xd4, 0x00, 0x46, 0x57, 0x9f, 0xd3, 0x27, 0x52, 0x4c, 0x36, 0x02, 0xe7, 0xa0, 0xc4, 0xc8, 0x9e,
  0xea, 0xbf, 0x8a, 0xd2, 0x40, 0xc7, 0x38, 0xb5, 0xa3, 0xf7, 0xf2, 0xce, 0xf9, 0x61, 0x15, 0xa1,
  0xe0, 0xae, 0x5d, 0xa4, 0x9b, 0x34, 0x1a, 0x55, 0xad, 0x93, 0x32, 0x30, 0xf5, 0x8c, 0xb1, 0xe3,
  0x1d, 0xf6, 0xe2, 0x2e, 0x82, 0x66, 0xca, 0x60, 0xc0, 0x29, 0x23, 0xab, 0x0d, 0x53, 0x4e, 0x6f,
  0xd5, 0xdb, 0x37, 0x45, 0xde, 0xfd, 0x8e, 0x2f, 0x03, 0xff, 0x6a, 0x72, 0x6d, 0x6c, 0x5b, 0x51,
  0x8d, 0x1b, 0xaf, 0x92, 0xbb, 0xdd, 0xbc, 0x7f, 0x11, 0xd9, 0x5c, 0x41, 0x1f, 0x10, 0x5a, 0xd8,
  0x0a, 0xc1, 0x31, 0x88, 0xa5, 0xcd, 0x7b, 0xbd, 0x2d, 0x74, 0xd0, 0x12, 0xb8, 0xe5, 0xb4, 0xb0,
  0x89, 0x69, 0x97, 0x4a, 0x0c, 0x96, 0x77, 0x7e, 0x65, 0xb9, 0xf1, 0x09, 0xc5, 0x6e, 0xc6, 0x84,
  0x18, 0xf0, 0x7d, 0xec, 0x3a, 0xdc, 0x4d, 0x20, 0x79, 0xee, 0x5f, 0x3e, 0xd7, 0xcb, 0x39, 0x48,
];

// 系统参数 FK
const FK: number[] = [0xa3b1bac6, 0x56aa3350, 0x677d9197, 0xb27022dc];

// 固定参数 CK - 用于密钥扩展
const CK: number[] = [];
for (let i = 0; i < 32; i++) {
  CK[i] =
    ((4 * i + 0) << 24) |
    ((4 * i + 1) << 16) |
    ((4 * i + 2) << 8) |
    (4 * i + 3);
}

/**
 * 循环左移
 */
function rotl(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

/**
 * GCM 模式下的伽罗瓦域乘法（GF(2^128)）
 */
function ghash(h: Uint8Array, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(16);

  // 逐块处理每 16 字节的数据
  for (let i = 0; i < data.length; i += 16) {
    const block = data.slice(i, i + 16);

    // 与上一轮结果按位异或
    for (let j = 0; j < 16 && j < block.length; j++) {
      result[j] ^= block[j];
    }

    // 伽罗瓦域乘法
    result.set(gfMul(result, h));
  }

  return result;
}

/**
 * 伽罗瓦域乘法（用于 GCM 模式）
 */
function gfMul(x: Uint8Array, y: Uint8Array): Uint8Array {
  const result = new Uint8Array(16);
  const v = new Uint8Array(y);

  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 8; j++) {
      if (x[i] & (1 << (7 - j))) {
        for (let k = 0; k < 16; k++) {
          result[k] ^= v[k];
        }
      }

      // 判断最低位是否为 1
      const lsb = v[15] & 1;

      // v 向右移 1 位
      for (let k = 15; k > 0; k--) {
        v[k] = (v[k] >> 1) | ((v[k - 1] & 1) << 7);
      }
      v[0] >>= 1;

      // 若最低位为 1，则与常量 R 异或
      if (lsb) {
        v[0] ^= 0xe1;
      }
    }
  }

  return result;
}

/**
 * GCM 模式的计数器递增（最右侧 32 位计数器）
 */
function incrementGCMCounter(counter: Uint8Array): void {
  // 按大端方式递增最右侧的 32 位计数器
  for (let i = 15; i >= 12; i--) {
    if (++counter[i] !== 0) break;
  }
}

/**
 * 非线性变换 τ - 使用 S盒进行字节替换
 */
function tau(a: number): number {
  return (
    (SBOX[(a >>> 24) & 0xff] << 24) |
    (SBOX[(a >>> 16) & 0xff] << 16) |
    (SBOX[(a >>> 8) & 0xff] << 8) |
    SBOX[a & 0xff]
  ) >>> 0;
}

/**
 * 线性变换 L - 用于加密变换
 */
function l(b: number): number {
  return (b ^ rotl(b, 2) ^ rotl(b, 10) ^ rotl(b, 18) ^ rotl(b, 24)) >>> 0;
}

/**
 * 线性变换 L' - 用于密钥扩展
 */
function lPrime(b: number): number {
  return (b ^ rotl(b, 13) ^ rotl(b, 23)) >>> 0;
}

/**
 * 合成置换 T - 加密轮函数
 */
function t(a: number): number {
  return l(tau(a));
}

/**
 * 合成置换 T' - 密钥扩展函数
 */
function tPrime(a: number): number {
  return lPrime(tau(a));
}

/**
 * 密钥扩展 - 从主密钥生成轮密钥
 */
function expandKey(key: Uint8Array): number[] {
  const mk: number[] = [];
  for (let i = 0; i < 4; i++) {
    mk[i] = bytes4ToUint32BE(key, i * 4);
  }

  const k: number[] = new Array(36);
  k[0] = (mk[0] ^ FK[0]) >>> 0;
  k[1] = (mk[1] ^ FK[1]) >>> 0;
  k[2] = (mk[2] ^ FK[2]) >>> 0;
  k[3] = (mk[3] ^ FK[3]) >>> 0;

  const rk: number[] = new Array(32);
  for (let i = 0; i < 32; i++) {
    k[i + 4] = (k[i] ^ tPrime(k[i + 1] ^ k[i + 2] ^ k[i + 3] ^ CK[i])) >>> 0;
    rk[i] = k[i + 4];
  }

  return rk;
}

/**
 * 加密单个数据块（128 位）
 */
function encryptBlock(input: Uint8Array, roundKeys: number[]): Uint8Array {
  const x: number[] = [];
  for (let i = 0; i < 4; i++) {
    x[i] = bytes4ToUint32BE(input, i * 4);
  }

  for (let i = 0; i < 32; i++) {
    x[i + 4] = (x[i] ^ t(x[i + 1] ^ x[i + 2] ^ x[i + 3] ^ roundKeys[i])) >>> 0;
  }

  const output = new Uint8Array(16);
  for (let i = 0; i < 4; i++) {
    const bytes = uint32ToBytes4BE(x[35 - i]);
    output.set(bytes, i * 4);
  }

  return output;
}

/**
 * 解密单个数据块（128 位）
 */
function decryptBlock(input: Uint8Array, reversedKeys: number[]): Uint8Array {
  return encryptBlock(input, reversedKeys);
}

function normalizeHexInput(label: string, value: string | Uint8Array, expectedBytes: number): Uint8Array {
  if (value instanceof Uint8Array) {
    if (value.length !== expectedBytes) {
      throw new Error(`${label} must be ${expectedBytes} bytes (${expectedBytes * 2} hex characters)`);
    }
    return value;
  }

  let cleaned = value.trim();
  if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
    cleaned = cleaned.slice(2);
  }
  if (!isHexString(cleaned)) {
    throw new Error(`${label} must be a hexadecimal string`);
  }
  if (cleaned.length !== expectedBytes * 2) {
    throw new Error(`${label} must be ${expectedBytes} bytes (${expectedBytes * 2} hex characters)`);
  }
  return hexToBytes(cleaned);
}

/**
 * PKCS7 填充
 * PKCS#7 padding - 填充值等于填充字节数
 * Padding value equals the number of padding bytes added
 *
 * @param data - 要填充的数据 (Data to pad)
 * @param blockSize - 块大小，通常为16字节 (Block size, typically 16 bytes)
 * @returns 填充后的数据 (Padded data)
 */
function pkcs7Pad(data: Uint8Array, blockSize: number): Uint8Array {
  const padding = blockSize - (data.length % blockSize);
  const padded = new Uint8Array(data.length + padding);
  padded.set(data);
  for (let i = data.length; i < padded.length; i++) {
    padded[i] = padding;
  }
  return padded;
}

/**
 * 去除 PKCS7 填充
 * Remove PKCS#7 padding
 *
 * @param data - 要去除填充的数据 (Data to unpad)
 * @returns 去除填充后的数据 (Unpadded data)
 */
function pkcs7Unpad(data: Uint8Array): Uint8Array {
  if (data.length === 0 || data.length % 16 !== 0) {
    throw new Error('Invalid padding');
  }

  const padding = data[data.length - 1];
  let invalid = 0;
  if (padding < 1 || padding > 16) {
    invalid = 1;
  }

  // 常量时间检查最后 16 字节
  let diff = 0;
  for (let i = 1; i <= 16; i++) {
    const byte = data[data.length - i];
    const mask = i <= padding ? 0xff : 0x00;
    diff |= mask & (byte ^ padding);
  }

  if (invalid || diff !== 0) {
    throw new Error('Invalid padding');
  }
  return data.slice(0, data.length - padding);
}

/**
 * 零填充
 * Zero padding - 用零字节填充到块大小的倍数
 * Pad with zero bytes to multiple of block size
 *
 * @param data - 要填充的数据 (Data to pad)
 * @param blockSize - 块大小，通常为16字节 (Block size, typically 16 bytes)
 * @returns 填充后的数据 (Padded data)
 */
function zeroPad(data: Uint8Array, blockSize: number): Uint8Array {
  const padding = blockSize - (data.length % blockSize);
  if (padding === blockSize) {
    // 已经满足块大小，无需填充
    return data;
  }
  const padded = new Uint8Array(data.length + padding);
  padded.set(data);
  // 剩余字节默认为 0，无需额外赋值
  return padded;
}

/**
 * 去除零填充
 * Remove zero padding - 移除尾部的零字节
 * Remove trailing zero bytes
 *
 * @param data - 要去除填充的数据 (Data to unpad)
 * @returns 去除填充后的数据 (Unpadded data)
 */
function zeroUnpad(data: Uint8Array): Uint8Array {
  let length = data.length;
  // 从尾部寻找第一个非零字节
  while (length > 0 && data[length - 1] === 0) {
    length--;
  }
  return data.slice(0, length);
}

/**
 * SM4 加密选项
 */
export interface SM4Options {
  /**
   * 加密模式 (Cipher mode)
   * - ECB: 电码本模式，不需要IV (Electronic Codebook, no IV required)
   * - CBC: 分组链接模式，需要IV (Cipher Block Chaining, IV required)
   * - CTR: 计数器模式，需要IV，无需填充 (Counter mode, IV required, no padding)
   * - CFB: 密文反馈模式，需要IV，无需填充 (Cipher Feedback, IV required, no padding)
   * - OFB: 输出反馈模式，需要IV，无需填充 (Output Feedback, IV required, no padding)
   * - GCM: 伽罗瓦/计数器模式，需要IV，无需填充，提供认证 (Galois/Counter Mode, IV required, no padding, provides authentication)
   *
   * 默认: ECB (Default: ECB)
   */
  mode?: CipherModeType;

  /**
   * 填充模式 (Padding mode)
   * - PKCS7: PKCS#7 填充，填充值为填充字节数 (PKCS#7 padding, padding value equals padding length)
   *   注意：JavaScript 中的 PKCS7 等同于 Java 中的 PKCS5（PKCS5 是 PKCS7 针对 8 字节块的特例）
   *   Note: PKCS7 in JavaScript is equivalent to PKCS5 in Java (PKCS5 is PKCS7 for 8-byte blocks)
   * - NONE: 无填充，数据长度必须是块大小倍数 (No padding, data length must be multiple of block size)
   * - ZERO: 零填充，用零字节填充 (Zero padding, pad with zero bytes)
   *
   * 注意：流密码模式（CTR/CFB/OFB/GCM）不使用填充
   * Note: Stream cipher modes (CTR/CFB/OFB/GCM) don't use padding
   *
   * 默认: PKCS7 (Default: PKCS7)
   */
  padding?: PaddingModeType;

  /**
   * 初始化向量
   * - CBC/CTR/CFB/OFB：16 字节（32 个十六进制字符）
   * - GCM：12 字节（24 个十六进制字符）
   * - ECB：不需要 IV
   */
  iv?: BytesLike;

  /**
   * GCM 模式的附加认证数据，可使用字符串或 Uint8Array
   */
  aad?: string | Uint8Array;

  /**
   * GCM 模式的认证标签长度，范围 12-16 字节，默认 16 字节
   */
  tagLength?: number;

  /**
   * 输出格式 (Output format)
   * - hex: 十六进制字符串（默认，保持向后兼容）(Hex string, default for backward compatibility)
   * - base64: Base64 编码字符串 (Base64 encoded string)
   *
   * 默认: hex (Default: hex)
   */
  outputFormat?: OutputFormatType;
}

/**
 * SM4 GCM 模式的加密结果
 */
export interface SM4CipherResult {
  /**
   * 密文（十六进制字符串）
   */
  ciphertext: string;

  /**
   * 认证标签（十六进制字符串）
   */
  tag?: string;

  /**
   * 输出格式（hex 或 base64）
   */
  format: OutputFormatType;
}

export type SM4GCMResult = SM4CipherResult;

export interface SM4DecryptOptions extends SM4Options {
  /**
   * 输入格式（用于密文与标签为字符串时）
   * - hex（默认）
   * - base64
   */
  inputFormat?: InputFormatType;

  /**
   * GCM 模式下的认证标签（可单独传入）
   */
  tag?: BytesLike;

  /**
   * 认证标签格式（默认与 inputFormat 一致）
   */
  tagFormat?: InputFormatType;
}

/**
 * 使用 SM4 加密数据
 * Encrypt data using SM4 block cipher
 *
 * 支持的模式 (Supported modes):
 * - ECB: 电码本模式 (Electronic Codebook) - 不推荐用于生产环境 (Not recommended for production)
 * - CBC: 分组链接模式 (Cipher Block Chaining) - 需要IV (Requires IV)
 * - CTR: 计数器模式 (Counter mode) - 流密码模式，需要IV (Stream mode, requires IV)
 * - CFB: 密文反馈模式 (Cipher Feedback) - 流密码模式，需要IV (Stream mode, requires IV)
 * - OFB: 输出反馈模式 (Output Feedback) - 流密码模式，需要IV (Stream mode, requires IV)
 * - GCM: 伽罗瓦/计数器模式 (Galois/Counter Mode) - 认证加密，需要IV (AEAD mode, requires IV)
 *
 * 支持的填充模式 (Supported padding modes):
 * - PKCS7: PKCS#7 填充 (PKCS#7 padding) - 默认 (Default)
 * - NONE: 无填充 (No padding) - 数据长度必须是16字节的倍数 (Data length must be multiple of 16 bytes)
 * - ZERO: 零填充 (Zero padding) - 用零字节填充 (Pad with zero bytes)
 *
 * @param key - 加密密钥（十六进制字符串，32 个字符 = 16 字节）
 *              Encryption key (hex string, 32 chars = 16 bytes)
 * @param data - 要加密的数据（字符串或 Uint8Array）
 *               Data to encrypt (string or Uint8Array)
 * @param options - 加密选项（模式、填充、IV）
 *                  Encryption options (mode, padding, IV)
 * @returns 小写十六进制字符串形式的加密数据，或GCM模式下返回包含密文和标签的对象
 *          Encrypted data as lowercase hex string, or object with ciphertext and tag for GCM mode
 *
 * @example
 * // ECB 模式
 * const encrypted = encrypt(key, 'Hello', { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
 *
 * @example
 * // GCM 模式（包含认证标签）
 * const result = encrypt(key, 'Secret', { mode: CipherMode.GCM, iv: '000000000000000000000000', aad: 'metadata' });
 * console.log(result.ciphertext, result.tag);
 */
export function encrypt(
  key: BytesLike,
  data: string | Uint8Array,
  options?: SM4Options
): SM4CipherResult {
  const mode = (options?.mode || CipherMode.ECB).toLowerCase();
  const padding = (options?.padding || PaddingMode.PKCS7).toLowerCase();

  const keyBytes = normalizeHexInput('SM4 key', key, 16);

  let dataBytes = normalizeInput(data);

  // Stream cipher modes (CTR, CFB, OFB, GCM) don't require padding
  // 流密码模式（CTR、CFB、OFB、GCM）不需要填充
  const isStreamMode = mode === 'ctr' || mode === 'cfb' || mode === 'ofb' || mode === 'gcm';

  // 应用填充 (Apply padding)
  if (!isStreamMode) {
    if (padding === 'pkcs7') {
      // PKCS#7 填充
      dataBytes = pkcs7Pad(dataBytes, 16);
    } else if (padding === 'zero') {
      // 零填充
      dataBytes = zeroPad(dataBytes, 16);
    } else if (padding === 'none') {
      // 无填充，数据长度必须是16字节的倍数
      if (dataBytes.length % 16 !== 0) {
        throw new Error('Data length must be multiple of 16 bytes when padding is None');
      }
    } else {
      throw new Error(`Unsupported padding mode: ${padding}`);
    }
  }

  const roundKeys = expandKey(keyBytes);
  const result = new Uint8Array(dataBytes.length);

  if (mode === 'ecb') {
    for (let i = 0; i < dataBytes.length; i += 16) {
      const block = dataBytes.subarray(i, i + 16);
      const encrypted = encryptBlock(block, roundKeys);
      result.set(encrypted, i);
    }
  } else if (mode === 'cbc') {
    if (!options?.iv) {
      throw new Error('IV is required for CBC mode');
    }
    let ivBytes = normalizeHexInput('IV', options.iv, 16);

    for (let i = 0; i < dataBytes.length; i += 16) {
      const block = dataBytes.subarray(i, i + 16);
      const xored = xor(block, ivBytes);
      const encrypted = encryptBlock(xored, roundKeys);
      result.set(encrypted, i);
      ivBytes = encrypted;
    }
  } else if (mode === 'ctr') {
    if (!options?.iv) {
      throw new Error('IV (nonce/counter) is required for CTR mode');
    }
    const counter = normalizeHexInput('IV', options.iv, 16);

    const counterBlock = new Uint8Array(counter);
    for (let i = 0; i < dataBytes.length; i += 16) {
      const keystream = encryptBlock(counterBlock, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      for (let j = 0; j < blockSize; j++) {
        result[i + j] = dataBytes[i + j] ^ keystream[j];
      }
      // 按大端序递增计数器
      for (let j = 15; j >= 0; j--) {
        if (++counterBlock[j] !== 0) break;
      }
    }
  } else if (mode === 'cfb') {
    if (!options?.iv) {
      throw new Error('IV is required for CFB mode');
    }
    let shift = normalizeHexInput('IV', options.iv, 16);

    for (let i = 0; i < dataBytes.length; i += 16) {
      const keystream = encryptBlock(shift, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      const cipherBlock = new Uint8Array(16);
      for (let j = 0; j < blockSize; j++) {
        cipherBlock[j] = dataBytes[i + j] ^ keystream[j];
        result[i + j] = cipherBlock[j];
      }
      shift = cipherBlock;
    }
  } else if (mode === 'ofb') {
    if (!options?.iv) {
      throw new Error('IV is required for OFB mode');
    }
    let shift = normalizeHexInput('IV', options.iv, 16);

    for (let i = 0; i < dataBytes.length; i += 16) {
      shift = encryptBlock(shift, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      for (let j = 0; j < blockSize; j++) {
        result[i + j] = dataBytes[i + j] ^ shift[j];
      }
    }
  } else if (mode === 'gcm') {
    // GCM 模式：带认证的伽罗瓦/计数器加密
    if (!options?.iv) {
      throw new Error('IV is required for GCM mode');
    }
    const ivBytes = normalizeHexInput('IV', options.iv, 12);

    const tagLength = options.tagLength || 16; // 默认生成 128 位标签
    if (tagLength < 12 || tagLength > 16) {
      throw new Error('Tag length must be between 12 and 16 bytes');
    }

    // 计算 H = E(K, 0^128)
    const h = encryptBlock(new Uint8Array(16), roundKeys);

    // 构造初始计数器块：IV || 0^31 || 1
    const j0 = new Uint8Array(16);
    j0.set(ivBytes, 0);
    j0[15] = 1;

    // 对初始计数器加密得到预计数块
    const preCounterBlock = encryptBlock(j0, roundKeys);

    // 为 CTR 加密准备计数器
    const counterBlock = new Uint8Array(j0);
    incrementGCMCounter(counterBlock);

    // 使用 CTR 模式加密明文
    for (let i = 0; i < dataBytes.length; i += 16) {
      const keystream = encryptBlock(counterBlock, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      for (let j = 0; j < blockSize; j++) {
        result[i + j] = dataBytes[i + j] ^ keystream[j];
      }
      incrementGCMCounter(counterBlock);
    }

    // 处理附加认证数据（AAD）
    let aadBytes: Uint8Array = new Uint8Array(0);
    if (options.aad) {
      aadBytes = typeof options.aad === 'string' ? normalizeInput(options.aad) : new Uint8Array(options.aad);
    }

    // 将 AAD 和密文补齐到 16 字节供 GHASH 使用
    const aadLen = aadBytes.length;
    const cLen = result.length;
    const aadPadded = new Uint8Array(Math.ceil(aadLen / 16) * 16);
    aadPadded.set(aadBytes);
    const cPadded = new Uint8Array(Math.ceil(cLen / 16) * 16);
    cPadded.set(result);

    // 构造 GHASH 输入：AAD || C || len(AAD) || len(C)
    const ghashData = new Uint8Array(aadPadded.length + cPadded.length + 16);
    ghashData.set(aadPadded, 0);
    ghashData.set(cPadded, aadPadded.length);
    
    // 追加比特长度（64 位大端）
    const view = new DataView(ghashData.buffer, ghashData.byteOffset, ghashData.byteLength);
    view.setUint32(ghashData.length - 16, Math.floor((aadLen * 8) / 0x100000000), false);
    view.setUint32(ghashData.length - 12, (aadLen * 8) >>> 0, false);
    view.setUint32(ghashData.length - 8, Math.floor((cLen * 8) / 0x100000000), false);
    view.setUint32(ghashData.length - 4, (cLen * 8) >>> 0, false);

    // 计算 GHASH
    const ghashResult = ghash(h, ghashData);

    // 计算认证标签：GHASH(H, A, C) ⊕ E(K, J0)
    const tag = new Uint8Array(tagLength);
    for (let i = 0; i < tagLength; i++) {
      tag[i] = ghashResult[i] ^ preCounterBlock[i];
    }

    const outputFormat = options?.outputFormat || OutputFormat.HEX;
    return {
      ciphertext: encodeOutput(result, outputFormat),
      tag: encodeOutput(tag, outputFormat),
      format: outputFormat,
    };
  } else {
    throw new Error(`Unsupported cipher mode: ${mode}`);
  }

  const outputFormat = options?.outputFormat || OutputFormat.HEX;
  return {
    ciphertext: encodeOutput(result, outputFormat),
    format: outputFormat,
  };
}

/**
 * 使用 SM4 解密数据
 * Decrypt data using SM4 block cipher
 *
 * 支持的模式 (Supported modes):
 * - ECB: 电码本模式 (Electronic Codebook)
 * - CBC: 分组链接模式 (Cipher Block Chaining) - 需要IV (Requires IV)
 * - CTR: 计数器模式 (Counter mode) - 流密码模式，需要IV (Stream mode, requires IV)
 * - CFB: 密文反馈模式 (Cipher Feedback) - 流密码模式，需要IV (Stream mode, requires IV)
 * - OFB: 输出反馈模式 (Output Feedback) - 流密码模式，需要IV (Stream mode, requires IV)
 * - GCM: 伽罗瓦/计数器模式 (Galois/Counter Mode) - 认证加密，需要IV和tag (AEAD mode, requires IV and tag)
 *
 * 支持的填充模式 (Supported padding modes):
 * - PKCS7: PKCS#7 填充 (PKCS#7 padding) - 默认 (Default)
 * - NONE: 无填充 (No padding)
 * - ZERO: 零填充 (Zero padding)
 *
 * @param key - 解密密钥（十六进制字符串，32 个字符 = 16 字节）
 *              Decryption key (hex string, 32 chars = 16 bytes)
 * @param encryptedData - 加密的数据（十六进制字符串或GCM结果对象）
 *                        Encrypted data (hex string or GCM result object)
 * @param options - 解密选项（模式、填充、IV、tag用于GCM）
 *                  Decryption options (mode, padding, IV, tag for GCM)
 * @returns 解密后的数据（UTF-8 字符串）
 *          Decrypted data (UTF-8 string)
 *
 * @example
 * // ECB 模式
 * const decrypted = decrypt(key, encrypted, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
 *
 * @example
 * // GCM 模式（校验认证标签）
 * const decrypted = decrypt(key, result, { mode: CipherMode.GCM, iv: '000000000000000000000000', aad: 'metadata' });
 */
export function decrypt(
  key: BytesLike,
  encryptedData: BytesLike | SM4CipherResult,
  options?: SM4DecryptOptions
): string {
  const mode = (options?.mode || CipherMode.ECB).toLowerCase();
  const padding = (options?.padding || PaddingMode.PKCS7).toLowerCase();

  const keyBytes = normalizeHexInput('SM4 key', key, 16);

  // 处理带有认证标签的 GCM 密文
  let ciphertextInput: BytesLike;
  let authTag: Uint8Array | undefined;

  if (mode === 'gcm') {
    if (typeof encryptedData === 'object' && 'ciphertext' in encryptedData) {
      ciphertextInput = encryptedData.ciphertext;
      if (!encryptedData.tag) {
        throw new Error('GCM mode requires authentication tag');
      }
      authTag = decodeInput(encryptedData.tag, encryptedData.format || InputFormat.HEX);
    } else if ((typeof encryptedData === 'string' || encryptedData instanceof Uint8Array) && options?.tag) {
      ciphertextInput = encryptedData;
      authTag = decodeInput(options.tag, options.tagFormat || options.inputFormat || InputFormat.HEX);
    } else {
      throw new Error('GCM mode requires authentication tag');
    }
  } else {
    ciphertextInput = typeof encryptedData === 'object' && 'ciphertext' in encryptedData
      ? encryptedData.ciphertext
      : encryptedData;
  }

  const dataBytes = typeof encryptedData === 'object' && 'ciphertext' in encryptedData
    ? decodeInput(ciphertextInput, encryptedData.format || InputFormat.HEX)
    : decodeInput(ciphertextInput, options?.inputFormat || InputFormat.HEX);
  
  // 流模式下的数据长度不必是块大小的整数倍
  const isStreamMode = mode === 'ctr' || mode === 'cfb' || mode === 'ofb' || mode === 'gcm';
  if (!isStreamMode && dataBytes.length % 16 !== 0) {
    throw new Error('Encrypted data length must be multiple of 16 bytes');
  }

  const roundKeys = expandKey(keyBytes);
  const decryptRoundKeys = roundKeys.slice().reverse();
  const result = new Uint8Array(dataBytes.length);

  if (mode === 'ecb') {
    for (let i = 0; i < dataBytes.length; i += 16) {
      const block = dataBytes.subarray(i, i + 16);
      const decrypted = decryptBlock(block, decryptRoundKeys);
      result.set(decrypted, i);
    }
  } else if (mode === 'cbc') {
    if (!options?.iv) {
      throw new Error('IV is required for CBC mode');
    }
    let ivBytes = normalizeHexInput('IV', options.iv, 16);

    for (let i = 0; i < dataBytes.length; i += 16) {
      const block = dataBytes.subarray(i, i + 16);
      const decrypted = decryptBlock(block, decryptRoundKeys);
      const xored = xor(decrypted, ivBytes);
      result.set(xored, i);
      ivBytes = block;
    }
  } else if (mode === 'ctr') {
    // CTR 解密与加密相同，均为与密钥流异或
    if (!options?.iv) {
      throw new Error('IV (nonce/counter) is required for CTR mode');
    }
    const counter = normalizeHexInput('IV', options.iv, 16);

    const counterBlock = new Uint8Array(counter);
    for (let i = 0; i < dataBytes.length; i += 16) {
      const keystream = encryptBlock(counterBlock, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      for (let j = 0; j < blockSize; j++) {
        result[i + j] = dataBytes[i + j] ^ keystream[j];
      }
      // 按大端序递增计数器
      for (let j = 15; j >= 0; j--) {
        if (++counterBlock[j] !== 0) break;
      }
    }
  } else if (mode === 'cfb') {
    if (!options?.iv) {
      throw new Error('IV is required for CFB mode');
    }
    let shift = normalizeHexInput('IV', options.iv, 16);

    for (let i = 0; i < dataBytes.length; i += 16) {
      const keystream = encryptBlock(shift, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      const cipherBlock = new Uint8Array(16);
      for (let j = 0; j < blockSize; j++) {
        cipherBlock[j] = dataBytes[i + j];
        result[i + j] = dataBytes[i + j] ^ keystream[j];
      }
      shift = cipherBlock;
    }
  } else if (mode === 'ofb') {
    // OFB 解密与加密相同，均为与密钥流异或
    if (!options?.iv) {
      throw new Error('IV is required for OFB mode');
    }
    let shift = normalizeHexInput('IV', options.iv, 16);

    for (let i = 0; i < dataBytes.length; i += 16) {
      shift = encryptBlock(shift, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      for (let j = 0; j < blockSize; j++) {
        result[i + j] = dataBytes[i + j] ^ shift[j];
      }
    }
  } else if (mode === 'gcm') {
    // GCM 模式：带认证的伽罗瓦/计数器解密
    if (!options?.iv) {
      throw new Error('IV is required for GCM mode');
    }
    if (!authTag) {
      throw new Error('Authentication tag is required for GCM mode');
    }
    if (authTag.length < 12 || authTag.length > 16) {
      throw new Error('Invalid GCM tag length');
    }

    const ivBytes = normalizeHexInput('IV', options.iv, 12);

    // 计算 H = E(K, 0^128)
    const h = encryptBlock(new Uint8Array(16), roundKeys);

    // 构造初始计数器块：IV || 0^31 || 1
    const j0 = new Uint8Array(16);
    j0.set(ivBytes, 0);
    j0[15] = 1;

    // 对初始计数器加密得到预计数块
    const preCounterBlock = encryptBlock(j0, roundKeys);

    // 处理附加认证数据（AAD）
    let aadBytes: Uint8Array = new Uint8Array(0);
    if (options.aad) {
      aadBytes = typeof options.aad === 'string' ? normalizeInput(options.aad) : new Uint8Array(options.aad);
    }

    // 将 AAD 和密文补齐到 16 字节供 GHASH 使用
    const aadLen = aadBytes.length;
    const cLen = dataBytes.length;
    const aadPadded = new Uint8Array(Math.ceil(aadLen / 16) * 16);
    aadPadded.set(aadBytes);
    const cPadded = new Uint8Array(Math.ceil(cLen / 16) * 16);
    cPadded.set(dataBytes);

    // 构造 GHASH 输入：AAD || C || len(AAD) || len(C)
    const ghashData = new Uint8Array(aadPadded.length + cPadded.length + 16);
    ghashData.set(aadPadded, 0);
    ghashData.set(cPadded, aadPadded.length);
    
    // 追加比特长度（64 位大端）
    const view = new DataView(ghashData.buffer, ghashData.byteOffset, ghashData.byteLength);
    view.setUint32(ghashData.length - 16, Math.floor((aadLen * 8) / 0x100000000), false);
    view.setUint32(ghashData.length - 12, (aadLen * 8) >>> 0, false);
    view.setUint32(ghashData.length - 8, Math.floor((cLen * 8) / 0x100000000), false);
    view.setUint32(ghashData.length - 4, (cLen * 8) >>> 0, false);

    // 计算 GHASH
    const ghashResult = ghash(h, ghashData);

    // 计算期望的认证标签：GHASH(H, A, C) ⊕ E(K, J0)
    const expectedTag = new Uint8Array(authTag.length);
    for (let i = 0; i < authTag.length; i++) {
      expectedTag[i] = ghashResult[i] ^ preCounterBlock[i];
    }

    // 以常数时间比较方式校验认证标签
    if (!constantTimeEqual(authTag, expectedTag)) {
      throw new Error('Decryption failed');
    }

    // 使用 CTR 模式解密密文
    const counterBlock = new Uint8Array(j0);
    incrementGCMCounter(counterBlock);

    for (let i = 0; i < dataBytes.length; i += 16) {
      const keystream = encryptBlock(counterBlock, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      for (let j = 0; j < blockSize; j++) {
        result[i + j] = dataBytes[i + j] ^ keystream[j];
      }
      incrementGCMCounter(counterBlock);
    }
  } else {
    throw new Error(`Unsupported cipher mode: ${mode}`);
  }

    // 去除填充
    // 流密码模式不使用填充
  let unpadded: Uint8Array = result;
  if (!isStreamMode) {
    if (padding === 'pkcs7') {
      // 去除 PKCS#7 填充
      // 为兼容不同的 ArrayBuffer 类型进行类型断言
      try {
        unpadded = pkcs7Unpad(result) as Uint8Array;
      } catch (_) {
        throw new Error('Decryption failed');
      }
    } else if (padding === 'zero') {
      // 去除零填充
      // 为兼容不同的 ArrayBuffer 类型进行类型断言
      unpadded = zeroUnpad(result) as Uint8Array;
    }
    // 当 padding 设为 'none' 时无需去除填充
  }

  return bytesToString(unpadded);
}
