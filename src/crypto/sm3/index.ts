/**
 * SM3 密码杂凑算法实现
 *
 * 参考标准：
 * - GM/T 0004-2012: SM3 密码杂凑算法
 * - 官方网站：http://www.oscca.gov.cn/
 *
 * SM3 是中国国家密码管理局发布的密码杂凑算法，用于数字签名和验证、
 * 消息认证码生成及验证以及随机数生成等应用。
 *
 * 算法特点：
 * - 输出长度：256 位（32 字节）
 * - 分组长度：512 位（64 字节）
 * - 迭代次数：64 轮
 */

import {
  normalizeInput,
  bytesToHex,
  bytesToBase64,
  hexToBytes,
  rotl,
} from '../../core/utils';
import { OutputFormat, type OutputFormatType } from '../../types/constants';

// SM3 常量 - 初始值 IV
const IV: number[] = [
  0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600,
  0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e,
];

// 预计算 T 常量
const T_0_15 = 0x79cc4519;
const T_16_63 = 0x7a879d8a;

/**
 * 填充函数 - 将消息填充到 512 位的倍数
 */
function pad(data: Uint8Array): Uint8Array {
  const msgLen = data.length;
  const bitLen = msgLen * 8;

  // 计算填充长度
  const k = (448 - ((bitLen + 1) % 512) + 512) % 512;
  const paddingLen = (k + 1) / 8;
  const totalLen = msgLen + paddingLen + 8;

  const padded = new Uint8Array(totalLen);
  padded.set(data);
  padded[msgLen] = 0x80;

  // 附加长度（64 位大端格式）
  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(totalLen - 4, bitLen >>> 0, false);

  return padded;
}

/**
 * 压缩函数 CF（优化实现，减少临时对象与函数调用）
 */
function cf(v: number[], b: Uint8Array): number[] {
  const w: number[] = new Array(68);
  const wPrime: number[] = new Array(64);

  // 消息扩展 - 优化：使用 DataView 一次性读取
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  for (let i = 0; i < 16; i++) {
    w[i] = view.getUint32(i * 4, false); // false 表示大端序
  }

  // 消息扩展 - 优化：内联 p1 函数减少函数调用开销
  for (let i = 16; i < 68; i++) {
    const temp = w[i - 16] ^ w[i - 9] ^ rotl(w[i - 3], 15);
    // 内联 p1: x ^ rotl(x, 15) ^ rotl(x, 23)
    w[i] = (temp ^ rotl(temp, 15) ^ rotl(temp, 23) ^ rotl(w[i - 13], 7) ^ w[i - 6]) >>> 0;
  }

  // 计算 W' - 优化：减少中间变量
  for (let i = 0; i < 64; i++) {
    wPrime[i] = (w[i] ^ w[i + 4]) >>> 0;
  }

  // 初始化工作变量
  let a = v[0], b2 = v[1], c = v[2], d = v[3];
  let e = v[4], f = v[5], g = v[6], h = v[7];

  // 主循环 - 分成两部分以减少条件判断
  // 前 16 轮 (j = 0-15)
  for (let j = 0; j < 16; j++) {
    const rotA12 = rotl(a, 12);
    const ss1 = rotl((rotA12 + e + rotl(T_0_15, j % 32)) >>> 0, 7);
    const ss2 = (ss1 ^ rotA12) >>> 0;
    // 内联 ff: x ^ y ^ z (前16轮)
    const tt1 = ((a ^ b2 ^ c) + d + ss2 + wPrime[j]) >>> 0;
    // 内联 gg: x ^ y ^ z (前16轮)
    const tt2 = ((e ^ f ^ g) + h + ss1 + w[j]) >>> 0;

    d = c;
    c = rotl(b2, 9);
    b2 = a;
    a = tt1;
    h = g;
    g = rotl(f, 19);
    f = e;
    // 内联 p0: x ^ rotl(x, 9) ^ rotl(x, 17)
    e = (tt2 ^ rotl(tt2, 9) ^ rotl(tt2, 17)) >>> 0;
  }

  // 后 48 轮 (j = 16-63)
  for (let j = 16; j < 64; j++) {
    const rotA12 = rotl(a, 12);
    const ss1 = rotl((rotA12 + e + rotl(T_16_63, j % 32)) >>> 0, 7);
    const ss2 = (ss1 ^ rotA12) >>> 0;
    // 内联 ff: (x & y) | (x & z) | (y & z) (后48轮)
    const tt1 = (((a & b2) | (a & c) | (b2 & c)) + d + ss2 + wPrime[j]) >>> 0;
    // 内联 gg: (x & y) | (~x & z) (后48轮)
    const tt2 = (((e & f) | (~e & g)) + h + ss1 + w[j]) >>> 0;

    d = c;
    c = rotl(b2, 9);
    b2 = a;
    a = tt1;
    h = g;
    g = rotl(f, 19);
    f = e;
    // 内联 p0: x ^ rotl(x, 9) ^ rotl(x, 17)
    e = (tt2 ^ rotl(tt2, 9) ^ rotl(tt2, 17)) >>> 0;
  }

  return [
    (a ^ v[0]) >>> 0,
    (b2 ^ v[1]) >>> 0,
    (c ^ v[2]) >>> 0,
    (d ^ v[3]) >>> 0,
    (e ^ v[4]) >>> 0,
    (f ^ v[5]) >>> 0,
    (g ^ v[6]) >>> 0,
    (h ^ v[7]) >>> 0,
  ];
}

/**
 * SM3 哈希选项
 */
export interface SM3Options {
  /**
   * 输出格式
   * - hex: 十六进制字符串（默认，保持向后兼容）
   * - base64: Base64 编码字符串
   */
  outputFormat?: OutputFormatType;
}

/**
 * 计算 SM3 哈希摘要（优化实现，减少内存分配并直接操作缓冲区）
 * @param data - 输入数据（字符串或 Uint8Array）
 * @param options - 哈希选项
 * @returns 哈希摘要（默认为小写十六进制字符串，64 个字符）
 *
 * @example
 * ```typescript
 * // 十六进制格式（默认）
 * const hash = digest('Hello, SM3!');
 *
 * // Base64 格式
 * const hash64 = digest('Hello, SM3!', { outputFormat: OutputFormat.BASE64 });
 * ```
 */
export function digest(data: string | Uint8Array, options?: SM3Options): string {
  const bytes = normalizeInput(data);
  const padded = pad(bytes);

  // 优化：避免每次循环都复制数组
  let v = [...IV];

  // 处理每个 512 位块 - 优化：直接传递视图而不是切片
  for (let i = 0; i < padded.length; i += 64) {
    const block = padded.subarray(i, i + 64);
    v = cf(v, block);
  }

  // 将结果转换为字节 - 优化：使用 DataView 直接写入
  const result = new Uint8Array(32);
  const view = new DataView(result.buffer);
  for (let i = 0; i < 8; i++) {
    view.setUint32(i * 4, v[i], false); // false 表示大端序
  }

  // 根据输出格式返回结果
  return options?.outputFormat === OutputFormat.BASE64 ? bytesToBase64(result) : bytesToHex(result);
}

// 兼容命名：与文档示例保持一致
export const sm3Digest = digest;

/**
 * 计算 SM3-HMAC
 * @param key - 密钥（字符串或 Uint8Array）
 * @param data - 要认证的数据（字符串或 Uint8Array）
 * @param options - 哈希选项
 * @returns HMAC 值（默认为小写十六进制字符串，64 个字符）
 *
 * @example
 * ```typescript
 * // 十六进制格式（默认）
 * const mac = hmac('secret-key', 'data to authenticate');
 *
 * // Base64 格式
 * const mac64 = hmac('secret-key', 'data to authenticate', { outputFormat: OutputFormat.BASE64 });
 * ```
 */
export function hmac(key: string | Uint8Array, data: string | Uint8Array, options?: SM3Options): string {
  let keyBytes = normalizeInput(key);
  const dataBytes = normalizeInput(data);

  const blockSize = 64; // SM3 块大小（字节）

  // 如果密钥长度超过块大小，先进行哈希
  if (keyBytes.length > blockSize) {
    keyBytes = new Uint8Array(hexToBytes(digest(keyBytes)));
  }

  // 将密钥填充到块大小
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(keyBytes);

  // 创建 ipad 和 opad
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    ipad[i] = paddedKey[i] ^ 0x36;
    opad[i] = paddedKey[i] ^ 0x5c;
  }

  // 内部哈希: H(ipad || data)
  const innerData = new Uint8Array(blockSize + dataBytes.length);
  innerData.set(ipad);
  innerData.set(dataBytes, blockSize);
  const innerHash = digest(innerData);

  // 外部哈希: H(opad || innerHash)
  const outerData = new Uint8Array(blockSize + 32);
  outerData.set(opad);
  outerData.set(hexToBytes(innerHash), blockSize);

  return digest(outerData, options);
}
