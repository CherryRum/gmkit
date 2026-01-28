/**
 * ZUC 流密码算法实现
 *
 * 参考标准：
 * - GM/T 0001-2012: ZUC-128 流密码算法
 * - GM/T 0001.1-2023: ZUC-256 流密码算法
 * - 3GPP TS 35.221: EEA3 和 EIA3 规范（基于 ZUC 的 LTE 加密与完整性算法）
 * - 官方网站：http://www.oscca.gov.cn/
 *
 * ZUC（祖冲之算法）是中国国家密码管理局发布的流密码算法，
 * 用于 4G LTE 移动通信网络的加密和完整性保护。
 *
 * 算法特点：
 * - ZUC-128: 128 位密钥和 128 位初始向量
 * - ZUC-256: 256 位密钥和 184 位初始向量（GM/T 0001.1-2023）
 * - 输出：32 位字流
 * - 应用：EEA3（加密）和 EIA3（完整性）算法
 */

import { ZUCState, generateKeystream, process } from './core';
import { hexToBytes, bytesToHex, stringToBytes, decodeInput, encodeOutput, bytesToString, type BytesLike } from '../../core/utils';
import { OutputFormat, InputFormat, type OutputFormatType, type InputFormatType } from '../../types/constants';

/**
 * ZUC 加密选项
 * 
 * 配置 ZUC 流密码加密的输出格式
 */
export interface ZUCOptions {
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
 * ZUC 解密选项
 * 
 * 配置 ZUC 流密码解密的输入格式
 */
export interface ZUCDecryptOptions {
  /**
   * 输入格式
   * - hex: 十六进制字符串（默认）
   * - base64: Base64 编码字符串
   */
  inputFormat?: InputFormatType;
}

/**
 * 使用 ZUC-128 流密码加密数据
 * @param key 128-bit key (16 bytes or 32 hex chars) / 128 位密钥
 * @param iv 128-bit IV (16 bytes or 32 hex chars) / 128 位初始向量
 * @param plaintext Data to encrypt (string or Uint8Array) / 要加密的数据
 * @param options Encryption options / 加密选项
 * @returns Encrypted data (default hex string) / 加密后的数据（默认十六进制字符串）
 *
 * @example
 * // 默认 hex 格式（向后兼容）
 * const encrypted = encrypt(key, iv, 'data');
 *
 * @example
 * // Base64 格式
 * const encrypted = encrypt(key, iv, 'data', { outputFormat: OutputFormat.BASE64 });
 */
export function encrypt(
  key: BytesLike,
  iv: BytesLike,
  plaintext: string | Uint8Array,
  options?: ZUCOptions
): string {
  const resultHex = process(key, iv, plaintext);
  const outputFormat = options?.outputFormat || OutputFormat.HEX;
  const resultBytes = hexToBytes(resultHex);
  return encodeOutput(resultBytes, outputFormat);
}

/**
 * 使用 ZUC-128 流密码解密数据
 * @param key 128-bit key (16 bytes or 32 hex chars) / 128 位密钥
 * @param iv 128-bit IV (16 bytes or 32 hex chars) / 128 位初始向量
 * @param ciphertext Encrypted data (hex or base64 string, auto-detected) / 加密的数据（十六进制或 base64，自动检测）
 * @returns Decrypted data as string / 解密后的数据
 *
 * @example
 * // 自动检测输入格式
 * const decrypted = decrypt(key, iv, encrypted);
 */
export function decrypt(
  key: BytesLike,
  iv: BytesLike,
  ciphertext: BytesLike,
  options?: ZUCDecryptOptions
): string {
  const ciphertextBytes = decodeInput(ciphertext, options?.inputFormat || InputFormat.HEX);
  const resultHex = process(key, iv, ciphertextBytes);
  const resultBytes = hexToBytes(resultHex);
  return bytesToString(resultBytes);
}

/**
 * 生成 ZUC-128 密钥流
 * @param key - 128 位密钥（16 字节或 32 个十六进制字符）
 * @param iv - 128 位初始向量（16 字节或 32 个十六进制字符）
 * @param length - 需要生成的 32 位字数量
 * @returns 十六进制字符串形式的密钥流
 */
export function getKeystreamWords(
  key: BytesLike,
  iv: BytesLike,
  length: number
): string {
  const keystream = generateKeystream(key, iv, length);
  const bytes = new Uint8Array(length * 4);

  for (let i = 0; i < length; i++) {
    const word = keystream[i];
    const offset = i * 4;
    bytes[offset] = (word >>> 24) & 0xff;
    bytes[offset + 1] = (word >>> 16) & 0xff;
    bytes[offset + 2] = (word >>> 8) & 0xff;
    bytes[offset + 3] = word & 0xff;
  }

  return bytesToHex(bytes);
}

/**
 * 生成 ZUC-128 密钥流（按字节长度）
 * @param length - 需要生成的字节长度
 */
export function getKeystream(
  key: BytesLike,
  iv: BytesLike,
  length: number
): string {
  const words = Math.ceil(length / 4);
  const hex = getKeystreamWords(key, iv, words);
  return hex.slice(0, length * 2);
}

/**
 * 生成 EEA3 密钥流（用于 LTE 加密）
 * 优化：单次分配 IV 缓冲区
 * @param key - 128 位保密密钥
 * @param count - 32 位计数值
 * @param bearer - 5 位承载标识
 * @param direction - 1 位方向标志（0 表示上行，1 表示下行）
 * @param length - 需要生成的密钥流比特长度
 * @returns EEA3 密钥流
 */
export function eea3(
  key: BytesLike,
  count: number,
  bearer: number,
  direction: number,
  length: number
): string {
  // 按照 EEA3 规范构造 IV，使用单次缓冲区分配
  const iv = new Uint8Array(16);
  iv[0] = (count >>> 24) & 0xFF;
  iv[1] = (count >>> 16) & 0xFF;
  iv[2] = (count >>> 8) & 0xFF;
  iv[3] = count & 0xFF;
  iv[4] = ((bearer << 3) | (direction << 2)) & 0xFF;
  // iv[5-15] 默认即为 0

  // 生成密钥流
  const numWords = Math.ceil(length / 32);
  return getKeystreamWords(key, iv, numWords);
}

/**
 * 生成 EIA3 完整性标签（用于 LTE 认证）
 * @param key - 128 位完整性密钥
 * @param count - 32 位计数值
 * @param bearer - 5 位承载标识
 * @param direction - 1 位方向标志（0 表示上行，1 表示下行）
 * @param message - 待认证的消息
 * @returns 32 位 MAC-I（十六进制字符串）
 */
export function eia3(
  key: BytesLike,
  count: number,
  bearer: number,
  direction: number,
  message: string | Uint8Array
): string {
  const messageBytes = typeof message === 'string' ? stringToBytes(message) : message;
  const bitLength = messageBytes.length * 8;

  // 按照 EIA3 规范构造 IV，使用单次缓冲区分配
  const iv = new Uint8Array(16);
  const countAndBearer = [
    (count >>> 24) & 0xFF,
    (count >>> 16) & 0xFF,
    (count >>> 8) & 0xFF,
    count & 0xFF,
    (((bearer & 0x1F) << 3) | ((direction & 0x1) << 2)) & 0xFF
  ];

  iv[0] = countAndBearer[0];
  iv[1] = countAndBearer[1];
  iv[2] = countAndBearer[2];
  iv[3] = countAndBearer[3];
  iv[4] = countAndBearer[4];
  // iv[5-7] 默认即为 0
  iv[8] = countAndBearer[0];
  iv[9] = countAndBearer[1];
  iv[10] = countAndBearer[2];
  iv[11] = countAndBearer[3];
  iv[12] = countAndBearer[4];
  // iv[13-15] 默认即为 0

  // 生成密钥流
  const numWords = Math.ceil((bitLength + 64) / 32);
  const keystream = generateKeystream(key, iv, numWords);

  // 计算 MAC，采用更高效的异或运算方式
  let t = 0;
  const l = bitLength;

  // 遍历消息字节
  for (let i = 0; i < messageBytes.length; i++) {
    const wordIndex = Math.floor((i * 8) / 32);
    const shift = 24 - ((i * 8) % 32);
    const keyByte = (keystream[wordIndex] >>> shift) & 0xFF;
    t ^= messageBytes[i] ^ keyByte;
  }

  // 处理长度比特
  const bitSet = getBitFromKeystream(keystream, bitLength);
  if (bitSet) {
    t ^= l >>> 0;
  }

  // 最终与密钥流进行一次异或
  const finalZ = keystream[Math.floor(bitLength / 32)];
  const mac = (t ^ finalZ) >>> 0;

  // 以 8 个十六进制字符（32 位）返回结果
  return (mac >>> 0).toString(16).padStart(8, '0');
}

/**
 * 从密钥流中获取指定位置的比特
 * 
 * 用于 EIA3 完整性算法中的比特级操作。
 * 
 * @param keystream - 密钥流（32 位字数组）
 * @param bitPosition - 比特位置（0 索引）
 * @returns 指定位置的比特值（true 或 false）
 */
function getBitFromKeystream(keystream: Uint32Array, bitPosition: number): boolean {
  const wordIndex = Math.floor(bitPosition / 32);
  const bitIndex = 31 - (bitPosition % 32);
  return ((keystream[wordIndex] >>> bitIndex) & 1) === 1;
}

// 导出底层组件以供高级场景使用
// 注意：直接使用底层组件需要理解 ZUC 算法的内部工作原理
export { ZUCState, generateKeystream };

// 导出面向对象封装的 ZUC 类
export { ZUC } from './class';
