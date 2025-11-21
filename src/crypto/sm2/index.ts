/**
 * SM2 椭圆曲线公钥密码算法实现
 * 符合以下标准：
 * - GM/T 0003-2012: SM2 椭圆曲线公钥密码算法
 * - GM/T 0009-2023: SM2 密码算法使用规范（替代 GM/T 0009-2012）
 *
 * 使用 @noble/curves 进行高效的椭圆曲线运算
 */

import {digest as sm3Digest} from '../sm3';
import {normalizeInput, hexToBytes, bytesToHex, bytesToBase64, autoDecodeString} from '../../core/utils';
import {
  SM2CipherMode,
  OutputFormat,
  type SM2CipherModeType,
  type OutputFormatType,
  DEFAULT_USER_ID
} from '../../types/constants';
import {sm2, SM2_CURVE_PARAMS} from './curve';
import {encodeSignature, decodeSignature} from '../../core/asn1';

/**
 * SM2 曲线参数接口（用于自定义曲线）
 */
export interface SM2CurveParams {
  p?: string;    // 素数模数
  a?: string;    // 系数 a
  b?: string;    // 系数 b
  Gx?: string;   // 基点 x 坐标
  Gy?: string;   // 基点 y 坐标
  n?: string;    // 阶 n
}

/**
 * 密钥对接口
 */
export interface KeyPair {
  publicKey: string;   // 公钥（十六进制字符串，04 开头的非压缩格式）
  privateKey: string;  // 私钥（十六进制字符串，32 字节）
}

/**
 * SM2 加密选项
 */
export interface SM2EncryptOptions {
  /**
   * 密文模式
   * - C1C3C2: C1 || C3 || C2（默认，推荐）
   * - C1C2C3: C1 || C2 || C3
   *
   * 默认：C1C3C2
   */
  mode?: SM2CipherModeType;

  /**
   * 输出格式
   * - hex：十六进制字符串（默认，保持向后兼容）
   * - base64：Base64 编码字符串
   *
   * 默认：hex
   */
  outputFormat?: OutputFormatType;
}

/**
 * 验证字符串是否为有效的十六进制字符串（不使用正则表达式）
 */
function isValidHexString(str: string): boolean {
  if (str.length === 0) {
    return false;
  }

  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    // 检查是否为 0-9、a-f、A-F
    const isDigit = c >= 48 && c <= 57;  // 字符 0-9
    const isLowerHex = c >= 97 && c <= 102;  // 字符 a-f
    const isUpperHex = c >= 65 && c <= 70;  // 字符 A-F

    if (!isDigit && !isLowerHex && !isUpperHex) {
      return false;
    }
  }

  return true;
}

/**
 * 自动识别并规范化私钥输入
 * 支持：hex字符串（带或不带0x前缀）
 */
function normalizePrivateKeyInput(privateKey: string): string {
  let cleaned = privateKey.trim();

  // 移除 0x 前缀
  if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
    cleaned = cleaned.slice(2);
  }

  // 验证是否为有效的十六进制字符串
  if (!isValidHexString(cleaned)) {
    throw new Error('Invalid private key: must be a hexadecimal string');
  }

  // 确保长度为64个字符（32字节）
  if (cleaned.length !== 64) {
    // 如果太短，左侧填充0
    if (cleaned.length < 64) {
      cleaned = cleaned.padStart(64, '0');
    } else {
      throw new Error('Invalid private key: must be 32 bytes (64 hex characters)');
    }
  }

  return cleaned.toLowerCase();
}

/**
 * 自动识别并规范化公钥输入
 * 支持：压缩格式（02/03开头）和非压缩格式（04开头）
 */
function normalizePublicKeyInput(publicKey: string): string {
  let cleaned = publicKey.trim();

  // 移除 0x 前缀
  if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
    cleaned = cleaned.slice(2);
  }

  // 验证是否为有效的十六进制字符串
  if (!isValidHexString(cleaned)) {
    throw new Error('Invalid public key: must be a hexadecimal string');
  }

  cleaned = cleaned.toLowerCase();

  // 检查格式
  const prefix = cleaned.slice(0, 2);

  if (prefix === '04') {
    // 非压缩格式：130个字符（65字节）
    if (cleaned.length !== 130) {
      throw new Error('Invalid uncompressed public key: must be 65 bytes (130 hex characters)');
    }
    return cleaned;
  } else if (prefix === '02' || prefix === '03') {
    // 压缩格式：66个字符（33字节）- 需要解压
    if (cleaned.length !== 66) {
      throw new Error('Invalid compressed public key: must be 33 bytes (66 hex characters)');
    }
    // 使用 @noble/curves 解压公钥
    const point = sm2.Point.fromHex(cleaned);
    const uncompressedBytes = point.toBytes(false); // false 表示非压缩格式
    return bytesToHex(uncompressedBytes);
  } else {
    throw new Error('Invalid public key prefix: must be 02, 03, or 04');
  }
}

/**
 * 常量时间比较两个 Uint8Array（防止时序攻击）
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}


/**
 * 准备解密所需的中间值
 * @param privateKey
 * @param c1Point
 * @param c2Length
 */
function prepareDecrypt(privateKey: string, c1Point: any, c2Length: number) {
  const privateKeyBigInt = BigInt('0x' + privateKey);
  const s = c1Point.multiply(privateKeyBigInt);
  const sBytes = s.toBytes(false);

  // 2. 获取 x2, y2
  const x2 = sBytes.slice(1, 33);
  const y2 = sBytes.slice(33, 65);

  // 3. 计算密钥流 t (耗时操作)
  const kdfInput = new Uint8Array(x2.length + y2.length);
  kdfInput.set(x2, 0);
  kdfInput.set(y2, x2.length);
  const t = kdf(kdfInput, c2Length);

  return {x2, y2, t};
}

function tryVerifyAndDecrypt(
  x2: Uint8Array, y2: Uint8Array, t: Uint8Array,
  c2: Uint8Array, c3: Uint8Array
): string | null {
  // 计算 M' = C2 ^ t
  const plainBytes = new Uint8Array(c2.length);
  for (let i = 0; i < c2.length; i++) {
    plainBytes[i] = c2[i] ^ t[i];
  }

  // 计算 u = SM3(x2 || M' || y2)
  const c3VerifyInput = new Uint8Array(x2.length + plainBytes.length + y2.length);
  c3VerifyInput.set(x2, 0);
  c3VerifyInput.set(plainBytes, x2.length);
  c3VerifyInput.set(y2, x2.length + plainBytes.length);
  const c3VerifyHex = sm3Digest(c3VerifyInput);
  const c3Verify = hexToBytes(c3VerifyHex);
  if (constantTimeEqual(c3, c3Verify)) {
    return new TextDecoder().decode(plainBytes);
  }
  return null;
}

/**
 * 使用 SM2 解密数据
 *
 * 支持自动识别密文格式：
 * - 0x30 开头：ASN.1 格式
 * - 0x04 开头：C1 为非压缩点格式（04 + x + y），默认 C1C3C2 模式
 * - 0x02/0x03 开头：C1 为压缩点格式（02/03 + x），默认 C1C3C2 模式
 *
 * 注意：
 * 1. 虽然可以穷举、尝试所有可能的密文格式，但这会影响解密性能。
 * 2. 在与其他系统集成时，建议明确约定密文格式，做到知己知彼。
 * 3. 本实现通过首字节自动检测格式（基于首字节只有固定几种可能的假设）：
 *    - 0x30：ASN.1 格式
 *    - 0x04：C1 为非压缩点格式，具体是 C1C3C2 还是 C1C2C3 取决于解密时的选项参数，默认为 C1C3C2
 *    - 0x02/0x03：C1 为压缩点格式，具体是 C1C3C2 还是 C1C2C3 取决于解密时的选项参数，默认为 C1C3C2
 *
 * @param privateKey - 私钥（十六进制字符串）
 * @param encryptedData - 加密的数据（十六进制字符串）
 * @param mode - 密文模式：'C1C3C2'（默认）或 'C1C2C3'，可选参数，会尝试自动检测
 * @returns 解密后的数据（UTF-8 字符串）
 */
export function decrypt(
  privateKey: string,
  encryptedData: string,
  mode?: SM2CipherModeType
): string {
  const cleanPrivateKey = normalizePrivateKeyInput(privateKey);
  const cipherBytes = autoDecodeString(encryptedData);

  if (cipherBytes.length === 0) throw new Error('Invalid ciphertext: empty data');
  if (cipherBytes[0] === 0x30) return decryptAsn1(cleanPrivateKey, cipherBytes);

  // 解析 C1
  let c1Length = 65;
  const firstByte = cipherBytes[0];
  if (firstByte === 0x02 || firstByte === 0x03) c1Length = 33;
  else if (firstByte !== 0x04) throw new Error('Invalid ciphertext: unsupported format');

  const c3Length = 32;
  if (cipherBytes.length < c1Length + c3Length) throw new Error('Invalid ciphertext: too short');

  const c1Bytes = cipherBytes.slice(0, c1Length);
  const c1Point = sm2.Point.fromHex(bytesToHex(c1Bytes));
  const c2Length = cipherBytes.length - c1Length - c3Length;
  const {x2, y2, t} = prepareDecrypt(cleanPrivateKey, c1Point, c2Length);
  // 定义提取辅助函数
  const getComponents = (m: SM2CipherModeType) => {
    if (m === SM2CipherMode.C1C2C3) {
      return {
        c2: cipherBytes.slice(c1Length, c1Length + c2Length),
        c3: cipherBytes.slice(c1Length + c2Length)
      };
    } else { // C1C3C2
      return {
        c3: cipherBytes.slice(c1Length, c1Length + c3Length),
        c2: cipherBytes.slice(c1Length + c3Length)
      };
    }
  };

  // 1. 指定模式：直接尝试
  if (mode) {
    const {c2, c3} = getComponents(mode);
    const result = tryVerifyAndDecrypt(x2, y2, t, c2, c3);
    if (result !== null) return result;
    throw new Error('Decryption failed: C3 verification failed');
  }

  // 2. 自动模式：先试 C1C3C2 (推荐)，失败再试 C1C2C3
  // 复用 x2, y2, t，零额外开销
  const v1 = getComponents(SM2CipherMode.C1C3C2);
  const res1 = tryVerifyAndDecrypt(x2, y2, t, v1.c2, v1.c3);
  if (res1 !== null) return res1;

  const v2 = getComponents(SM2CipherMode.C1C2C3);
  const res2 = tryVerifyAndDecrypt(x2, y2, t, v2.c2, v2.c3);
  if (res2 !== null) return res2;

  throw new Error('Decryption failed: unable to decrypt with C1C3C2 or C1C2C3 mode');
}

/**
 * 从 ASN.1 格式解密 SM2 密文
 * ASN.1 格式：SEQUENCE { x INTEGER, y INTEGER, hash OCTET STRING, cipher OCTET STRING }
 *
 * @param privateKey - 私钥（十六进制字符串）
 * @param cipherBytes - ASN.1 编码的密文
 * @returns 解密后的数据（UTF-8 字符串）
 */
function decryptAsn1(privateKey: string, cipherBytes: Uint8Array): string {
  // 解析 ASN.1 SEQUENCE
  if (cipherBytes[0] !== 0x30) {
    throw new Error('Invalid ASN.1 ciphertext: expected SEQUENCE tag');
  }

  // 跳过 SEQUENCE 标签和长度
  let offset = 1;
  let length = cipherBytes[offset];
  if (length & 0x80) {
    const numBytes = length & 0x7f;
    length = 0;
    for (let i = 0; i < numBytes; i++) {
      offset++;
      length = (length << 8) | cipherBytes[offset];
    }
  }
  offset++;

  // 读取 x 坐标（INTEGER）
  if (cipherBytes[offset] !== 0x02) {
    throw new Error('Invalid ASN.1 ciphertext: expected INTEGER tag for x');
  }
  offset++;
  let xLen = cipherBytes[offset++];
  if (xLen & 0x80) {
    const numBytes = xLen & 0x7f;
    xLen = 0;
    for (let i = 0; i < numBytes; i++) {
      xLen = (xLen << 8) | cipherBytes[offset++];
    }
  }
  const x = cipherBytes.slice(offset, offset + xLen);
  offset += xLen;

  // 读取 y 坐标（INTEGER）
  if (cipherBytes[offset] !== 0x02) {
    throw new Error('Invalid ASN.1 ciphertext: expected INTEGER tag for y');
  }
  offset++;
  let yLen = cipherBytes[offset++];
  if (yLen & 0x80) {
    const numBytes = yLen & 0x7f;
    yLen = 0;
    for (let i = 0; i < numBytes; i++) {
      yLen = (yLen << 8) | cipherBytes[offset++];
    }
  }
  const y = cipherBytes.slice(offset, offset + yLen);
  offset += yLen;

  // 读取 hash/C3（OCTET STRING）
  if (cipherBytes[offset] !== 0x04) {
    throw new Error('Invalid ASN.1 ciphertext: expected OCTET STRING tag for hash');
  }
  offset++;
  let hashLen = cipherBytes[offset++];
  if (hashLen & 0x80) {
    const numBytes = hashLen & 0x7f;
    hashLen = 0;
    for (let i = 0; i < numBytes; i++) {
      hashLen = (hashLen << 8) | cipherBytes[offset++];
    }
  }
  const c3 = cipherBytes.slice(offset, offset + hashLen);
  offset += hashLen;

  // 读取 cipher/C2（OCTET STRING）
  if (cipherBytes[offset] !== 0x04) {
    throw new Error('Invalid ASN.1 ciphertext: expected OCTET STRING tag for cipher');
  }
  offset++;
  let cipherLen = cipherBytes[offset++];
  if (cipherLen & 0x80) {
    const numBytes = cipherLen & 0x7f;
    cipherLen = 0;
    for (let i = 0; i < numBytes; i++) {
      cipherLen = (cipherLen << 8) | cipherBytes[offset++];
    }
  }
  const c2 = cipherBytes.slice(offset, offset + cipherLen);

  // 移除 x, y 的前导零（ASN.1 INTEGER 编码可能有前导零）
  const xClean = x[0] === 0 ? x.slice(1) : x;
  const yClean = y[0] === 0 ? y.slice(1) : y;

  // 构造 C1 点（非压缩格式）
  const c1Bytes = new Uint8Array(65);
  c1Bytes[0] = 0x04;
  // 左填充到 32 字节
  if (xClean.length <= 32) {
    c1Bytes.set(xClean, 1 + (32 - xClean.length));
  } else {
    throw new Error('Invalid ASN.1 ciphertext: x coordinate too long');
  }
  if (yClean.length <= 32) {
    c1Bytes.set(yClean, 33 + (32 - yClean.length));
  } else {
    throw new Error('Invalid ASN.1 ciphertext: y coordinate too long');
  }
  const c1Point = sm2.Point.fromHex(bytesToHex(c1Bytes));
  return decryptCore(privateKey, c1Point, c2, c3);
}

/**
 * SM2 解密核心逻辑
 *
 * @param privateKey - 私钥（十六进制字符串）
 * @param c1Point - C1 点
 * @param c2 - C2 密文
 * @param c3 - C3 哈希值
 * @returns 解密后的数据（UTF-8 字符串）
 */
function decryptCore(
  privateKey: string,
  c1Point: any,
  c2: Uint8Array,
  c3: Uint8Array
): string {
  // 计算 [dB]C1
  const privateKeyBigInt = BigInt('0x' + privateKey);
  const s = c1Point.multiply(privateKeyBigInt);
  const sBytes = s.toBytes(false);

  // x2, y2 是 [dB]C1 的坐标
  const x2 = sBytes.slice(1, 33);
  const y2 = sBytes.slice(33, 65);

  // 计算 t = KDF(x2 || y2, klen)
  const kdfInput = new Uint8Array(x2.length + y2.length);
  kdfInput.set(x2, 0);
  kdfInput.set(y2, x2.length);
  const t = kdf(kdfInput, c2.length);

  // 计算 M' = C2 ⊕ t
  const plainBytes = new Uint8Array(c2.length);
  for (let i = 0; i < c2.length; i++) {
    plainBytes[i] = c2[i] ^ t[i];
  }

  // 计算 u = SM3(x2 || M' || y2) 并验证 u === C3
  const c3VerifyInput = new Uint8Array(x2.length + plainBytes.length + y2.length);
  c3VerifyInput.set(x2, 0);
  c3VerifyInput.set(plainBytes, x2.length);
  c3VerifyInput.set(y2, x2.length + plainBytes.length);
  const c3VerifyHex = sm3Digest(c3VerifyInput);
  const c3Verify = hexToBytes(c3VerifyHex);

  // 验证 C3（使用常量时间比较防止时序攻击）
  if (!constantTimeEqual(c3, c3Verify)) {
    throw new Error('Decryption failed: C3 verification failed');
  }

  // 将字节转换为 UTF-8 字符串
  return new TextDecoder().decode(plainBytes);
}

/**
 * 计算 Z 值（用于签名）
 * Z = SM3(ENTL || ID || a || b || xG || yG || xA || yA)
 */
function computeZ(userId: string, publicKey: string): Uint8Array {
  const userIdBytes = normalizeInput(userId);
  const entl = new Uint8Array(2);
  const bitLength = userIdBytes.length * 8;
  entl[0] = (bitLength >> 8) & 0xff;
  entl[1] = bitLength & 0xff;

  const publicKeyBytes = hexToBytes(publicKey);
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);

  // 使用常量的曲线参数
  const a = hexToBytes(SM2_CURVE_PARAMS.a);
  const b = hexToBytes(SM2_CURVE_PARAMS.b);
  const xG = hexToBytes(SM2_CURVE_PARAMS.Gx);
  const yG = hexToBytes(SM2_CURVE_PARAMS.Gy);

  // 连接所有部分
  const totalLength = entl.length + userIdBytes.length + a.length + b.length +
    xG.length + yG.length + x.length + y.length;
  const data = new Uint8Array(totalLength);
  let offset = 0;

  data.set(entl, offset);
  offset += entl.length;
  data.set(userIdBytes, offset);
  offset += userIdBytes.length;
  data.set(a, offset);
  offset += a.length;
  data.set(b, offset);
  offset += b.length;
  data.set(xG, offset);
  offset += xG.length;
  data.set(yG, offset);
  offset += yG.length;
  data.set(x, offset);
  offset += x.length;
  data.set(y, offset);

  // sm3Digest 返回 hex 字符串，需要转换为 Uint8Array
  const zHex = sm3Digest(data);
  return hexToBytes(zHex);
}

/**
 * 签名选项
 *
 * SM2 签名算法的可配置选项，用于控制签名过程的各个方面
 */
export interface SignOptions {
  /**
   * 是否使用 DER 编码格式
   *
   * - false（默认）: 返回 Raw 格式签名（r || s，64 字节，128 个十六进制字符）
   * - true: 返回 DER 编码格式签名（符合 ASN.1 标准，长度可变）
   *
   * DER 格式更标准，适合与其他系统互操作；Raw 格式更紧凑，适合存储
   */
  der?: boolean;

  /**
   * 用户 ID（用于计算 Z 值）
   *
   * 标准演进：
   * - GM/T 0009-2012: 默认使用 '1234567812345678'（16 字节）
   * - GM/T 0009-2023: 推荐使用空字符串 ''
   *
   * 本库默认值：'1234567812345678'（保持向后兼容）
   *
   * Z 值是 SM2 签名算法的一个特殊部分，包含了用户身份信息和公钥信息，
   * 用于将签名与特定用户绑定。不同的用户 ID 会产生不同的 Z 值，
   * 从而产生不同的签名。
   *
   * 如需符合 GMT 0009-2023 最新标准，可显式传入 userId: ''
   */
  userId?: string;

  /**
   * 自定义曲线参数（高级选项）
   *
   * 一般情况下不需要设置，使用 GM/T 0003-2012 标准推荐的曲线参数
   * （GM/T 0009-2023 继续沿用相同的曲线参数）。
   * 仅在需要使用自定义椭圆曲线时才设置此选项。
   */
  curveParams?: SM2CurveParams;

  /**
   * 是否跳过 Z 值计算
   *
   * - false（默认）: 标准 SM2 签名流程，计算 e = SM3(Z || M)
   * - true: 简化流程，直接计算 e = SM3(M)，跳过 Z 值
   *
   * ⚠️ 注意：
   * 1. 签名和验签必须使用相同的 skipZComputation 设置
   * 2. 跳过 Z 值计算不符合 SM2 标准，仅用于特殊场景或测试
   * 3. 跳过 Z 值会降低安全性，因为签名不再与用户身份绑定
   *
   * 使用场景：
   * - 与不支持 Z 值计算的系统互操作
   * - 性能敏感场景（减少一次 SM3 计算）
   * - 测试和调试
   */
  skipZComputation?: boolean;
}

/**
 * 验签选项
 *
 * SM2 验签算法的可配置选项，必须与签名时使用的选项保持一致
 */
export interface VerifyOptions {
  /**
   * 签名是否为 DER 编码格式
   *
   * - false（默认）: 签名为 Raw 格式（r || s）
   * - true: 签名为 DER 编码格式
   *
   * 注意：函数会自动尝试识别签名格式（以 '30' 开头的视为 DER 格式）
   */
  der?: boolean;

  /**
   * 用户 ID（必须与签名时使用的相同）
   *
   * 标准演进：
   * - GM/T 0009-2012: 默认使用 '1234567812345678'
   * - GM/T 0009-2023: 推荐使用空字符串 ''
   *
   * 本库默认值：'1234567812345678'（保持向后兼容）
   *
   * ⚠️ 重要：签名和验签必须使用相同的 userId，否则验签会失败
   *
   * 如需符合 GMT 0009-2023 最新标准，可显式传入 userId: ''
   */
  userId?: string;

  /**
   * 自定义曲线参数（必须与签名时使用的相同）
   */
  curveParams?: SM2CurveParams;

  /**
   * 是否跳过 Z 值计算（必须与签名时保持一致）
   *
   * ⚠️ 重要：此选项必须与签名时使用的值完全一致，否则验签会失败
   *
   * - false（默认）: 标准 SM2 验签流程
   * - true: 跳过 Z 值计算
   */
  skipZComputation?: boolean;
}

/**
 * 生成 SM2 密钥对
 * @param compressed - 是否返回压缩格式的公钥（默认 false，返回非压缩格式）
 * @returns 包含公钥和私钥的对象
 */
export function generateKeyPair(compressed: boolean = false): KeyPair {
  // 使用 @noble/curves 的 keygen
  const privateKey = sm2.keygen().secretKey;

  // 从私钥导出公钥，确保格式正确
  const publicKeyBytes = sm2.getPublicKey(privateKey, compressed);

  return {
    publicKey: bytesToHex(publicKeyBytes),
    privateKey: bytesToHex(privateKey),
  };
}

/**
 * 从私钥导出公钥
 * @param privateKey - 私钥（十六进制字符串）
 * @param compressed - 是否返回压缩格式（默认 false，返回非压缩格式）
 * @returns 公钥（十六进制字符串，压缩格式：02/03 + x，非压缩格式：04 + x + y）
 */
export function getPublicKeyFromPrivateKey(privateKey: string, compressed: boolean = false): string {
  // 自动识别输入格式
  const cleanPrivateKey = normalizePrivateKeyInput(privateKey);

  // 使用 @noble/curves 从私钥计算公钥
  const privateKeyBytes = hexToBytes(cleanPrivateKey);
  const publicKeyBytes = sm2.getPublicKey(privateKeyBytes, compressed);

  return bytesToHex(publicKeyBytes);
}

/**
 * 压缩公钥（从非压缩格式转换为压缩格式）
 *
 * SM2 公钥是椭圆曲线上的点 (x, y)，有两种表示格式：
 *
 * 1. 非压缩格式（65 字节）：04 || x || y
 *    - 前缀 04 表示非压缩格式
 *    - x 坐标：32 字节
 *    - y 坐标：32 字节
 *    - 总长度：1 + 32 + 32 = 65 字节（130 个十六进制字符）
 *
 * 2. 压缩格式（33 字节）：02/03 || x
 *    - 前缀 02 表示 y 坐标为偶数
 *    - 前缀 03 表示 y 坐标为奇数
 *    - x 坐标：32 字节
 *    - 总长度：1 + 32 = 33 字节（66 个十六进制字符）
 *
 * 压缩的原理：
 * 由于椭圆曲线方程 y² = x³ + ax + b，给定 x 坐标，可以计算出两个可能的 y 值
 * （一个为正，一个为负，或者说一个为奇数，一个为偶数）。
 * 因此只需要保存 x 坐标和 y 的奇偶性，就可以恢复完整的点坐标。
 *
 * 优势：
 * - 节省存储空间（从 65 字节减少到 33 字节，节省约 49%）
 * - 节省网络传输带宽
 * - 适合资源受限的环境（如物联网设备）
 *
 * @param publicKey - 非压缩格式的公钥（十六进制字符串，04 + x + y）
 * @returns 压缩格式的公钥（十六进制字符串，02/03 + x）
 *
 * @example
 * ```typescript
 * const uncompressed = '04...'; // 130 个字符
 * const compressed = compressPublicKey(uncompressed); // 66 个字符
 * ```
 */
export function compressPublicKey(publicKey: string): string {
  // 规范化输入
  const cleanPublicKey = normalizePublicKeyInput(publicKey);

  // 使用 @noble/curves 压缩公钥
  const point = sm2.Point.fromHex(cleanPublicKey);
  const compressedBytes = point.toBytes(true); // true = 压缩格式

  return bytesToHex(compressedBytes);
}

/**
 * 解压公钥（从压缩格式转换为非压缩格式）
 *
 * 从压缩格式恢复完整的公钥坐标。
 *
 * 解压过程：
 * 1. 读取 x 坐标（32 字节）
 * 2. 读取前缀字节（02 或 03）确定 y 的奇偶性
 * 3. 根据椭圆曲线方程 y² = x³ + ax + b 计算 y²
 * 4. 对 y² 开平方得到两个可能的 y 值
 * 5. 根据前缀字节选择正确的 y 值（奇数或偶数）
 * 6. 组合 x 和 y 得到完整的非压缩公钥
 *
 * 注意：
 * - 如果输入已经是非压缩格式（前缀 04），则直接返回
 * - 解压过程涉及模平方根计算，需要一定的计算量
 * - 使用 @noble/curves 库进行高效的椭圆曲线运算
 *
 * @param publicKey - 压缩格式的公钥（十六进制字符串，02/03 + x）或非压缩格式
 * @returns 非压缩格式的公钥（十六进制字符串，04 + x + y）
 *
 * @example
 * ```typescript
 * const compressed = '02...'; // 66 个字符
 * const uncompressed = decompressPublicKey(compressed); // 130 个字符
 * ```
 */
export function decompressPublicKey(publicKey: string): string {
  let cleaned = publicKey.trim();

  // 移除 0x 前缀
  if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
    cleaned = cleaned.slice(2);
  }

  // 验证是否为有效的十六进制字符串
  if (!isValidHexString(cleaned)) {
    throw new Error('Invalid public key: must be a hexadecimal string');
  }

  cleaned = cleaned.toLowerCase();

  const prefix = cleaned.slice(0, 2);

  if (prefix === '04') {
    // 已经是非压缩格式
    return cleaned;
  } else if (prefix === '02' || prefix === '03') {
    // 压缩格式，需要解压
    const point = sm2.Point.fromHex(cleaned);
    const uncompressedBytes = point.toBytes(false); // false = 非压缩格式
    return bytesToHex(uncompressedBytes);
  } else {
    throw new Error('Invalid public key prefix: must be 02, 03, or 04');
  }
}

/**
 * KDF（密钥派生函数）
 * 使用 SM3 作为哈希函数
 *
 * 标准参考：
 * - GM/T 0003.1-2012: 密钥派生函数规范
 * - GM/T 0009-2023: SM2 密码算法使用规范
 *
 * 优化说明：
 * - 减少内存分配，复用缓冲区
 * - 优化零值检测，提前退出
 * - 按照标准实现，确保互操作性
 */
function kdf(z: Uint8Array, klen: number): Uint8Array {
  const k = new Uint8Array(klen);
  // 预分配输入缓冲区，避免每次迭代都分配内存
  const input = new Uint8Array(z.length + 4);
  input.set(z, 0);

  let offset = 0;
  let hasNonZero = false;

  for (let i = 1; offset < klen; i++) {
    // 将计数器转换为 32 位大端字节（优化：直接写入预分配的缓冲区）
    input[z.length] = (i >> 24) & 0xff;
    input[z.length + 1] = (i >> 16) & 0xff;
    input[z.length + 2] = (i >> 8) & 0xff;
    input[z.length + 3] = i & 0xff;

    // 计算 SM3(Z || ct)
    const hashHex = sm3Digest(input);
    const hash = hexToBytes(hashHex);

    // 将哈希结果追加到密钥流
    const toCopy = Math.min(hash.length, klen - offset);
    for (let j = 0; j < toCopy; j++) {
      const byte = hash[j];
      k[offset + j] = byte;
      // 优化：在复制过程中同时检测是否有非零字节
      if (byte !== 0) {
        hasNonZero = true;
      }
    }
    offset += toCopy;
  }

  // 验证派生的密钥不全为零
  if (!hasNonZero) {
    throw new Error('KDF derived key is all zeros - invalid point multiplication result');
  }

  return k;
}

/**
 * 使用 SM2 加密数据
 * @param publicKey - 公钥（十六进制字符串）
 * @param data - 要加密的数据（字符串或 Uint8Array）
 * @param optionsOrMode - 加密选项对象或密文模式（为了向后兼容）
 * @returns 加密后的数据（默认十六进制字符串）
 *
 * @example
 * // 基本用法（向后兼容）
 * const encrypted = encrypt(publicKey, 'data');
 *
 * @example
 * // 使用选项对象
 * const encrypted = encrypt(publicKey, 'data', {
 *   mode: SM2CipherMode.C1C3C2,
 *   outputFormat: OutputFormat.BASE64
 * });
 */
export function encrypt(
  publicKey: string,
  data: string | Uint8Array,
  optionsOrMode?: SM2EncryptOptions | SM2CipherModeType
): string {
  // 处理参数：支持旧的字符串模式参数或新的选项对象
  let mode: SM2CipherModeType = SM2CipherMode.C1C3C2;
  let outputFormat: OutputFormatType = OutputFormat.HEX;

  if (typeof optionsOrMode === 'string') {
    // 向后兼容：optionsOrMode 是模式字符串
    mode = optionsOrMode;
  } else if (optionsOrMode) {
    // 新的选项对象
    mode = optionsOrMode.mode || SM2CipherMode.C1C3C2;
    outputFormat = optionsOrMode.outputFormat || OutputFormat.HEX;
  }

  // 自动识别并规范化公钥输入
  const cleanPublicKey = normalizePublicKeyInput(publicKey);
  const plainBytes = normalizeInput(data);

  // 解析公钥点
  const publicKeyPoint = sm2.Point.fromHex(cleanPublicKey);

  // 生成随机数 k
  const k = sm2.keygen().secretKey;

  // 计算 C1 = k·G（椭圆曲线点乘）
  const c1Point = sm2.Point.BASE.multiply(BigInt('0x' + bytesToHex(k)));
  const c1Bytes = c1Point.toBytes(false); // 非压缩格式

  // 计算 S = h·Pb（其中 h=1）
  // 计算 [k]PB
  const kPbPoint = publicKeyPoint.multiply(BigInt('0x' + bytesToHex(k)));
  const kPbBytes = kPbPoint.toBytes(false);

  // x2, y2 是 [k]PB 的坐标
  const x2 = kPbBytes.slice(1, 33);
  const y2 = kPbBytes.slice(33, 65);

  // 计算 t = KDF(x2 || y2, klen)
  const kdfInput = new Uint8Array(x2.length + y2.length);
  kdfInput.set(x2, 0);
  kdfInput.set(y2, x2.length);
  const t = kdf(kdfInput, plainBytes.length);

  // 计算 C2 = M ⊕ t
  const c2 = new Uint8Array(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i++) {
    c2[i] = plainBytes[i] ^ t[i];
  }

  // 计算 C3 = SM3(x2 || M || y2)
  const c3Input = new Uint8Array(x2.length + plainBytes.length + y2.length);
  c3Input.set(x2, 0);
  c3Input.set(plainBytes, x2.length);
  c3Input.set(y2, x2.length + plainBytes.length);
  const c3Hex = sm3Digest(c3Input);
  const c3 = hexToBytes(c3Hex);

  // 根据模式组合密文
  let ciphertext: Uint8Array;
  if (mode === SM2CipherMode.C1C2C3) {
    // C1 || C2 || C3
    ciphertext = new Uint8Array(c1Bytes.length + c2.length + c3.length);
    ciphertext.set(c1Bytes, 0);
    ciphertext.set(c2, c1Bytes.length);
    ciphertext.set(c3, c1Bytes.length + c2.length);
  } else {
    // C1 || C3 || C2（默认）
    ciphertext = new Uint8Array(c1Bytes.length + c3.length + c2.length);
    ciphertext.set(c1Bytes, 0);
    ciphertext.set(c3, c1Bytes.length);
    ciphertext.set(c2, c1Bytes.length + c3.length);
  }

  // 根据输出格式返回结果
  return outputFormat === OutputFormat.BASE64 ? bytesToBase64(ciphertext) : bytesToHex(ciphertext);
}


/**
 * 使用 SM2 签名数据
 * @param privateKey - 私钥（十六进制字符串）
 * @param data - 要签名的数据（字符串或 Uint8Array）
 * @param options - 签名选项
 * @returns 签名（十六进制字符串，默认 r || s 格式，如果 der=true 则为 DER 编码）
 */
export function sign(
  privateKey: string,
  data: string | Uint8Array,
  options?: SignOptions
): string {
  // 自动识别并规范化私钥输入
  const cleanPrivateKey = normalizePrivateKeyInput(privateKey);
  const userId = options?.userId || DEFAULT_USER_ID;
  const useDer = options?.der || false;
  const skipZ = options?.skipZComputation || false;

  // 使用 @noble/curves 进行签名
  const privateKeyBytes = hexToBytes(cleanPrivateKey);

  let e: Uint8Array;

  if (skipZ) {
    // 跳过 Z 值计算，直接对数据进行 SM3 哈希
    const dataBytes = normalizeInput(data);
    const eHex = sm3Digest(dataBytes);
    e = hexToBytes(eHex);
  } else {
    // 标准流程：计算 Z 值并与数据一起哈希
    // 从私钥获取公钥
    const publicKey = getPublicKeyFromPrivateKey(cleanPrivateKey);

    // 计算 Z 值（使用本库实现的 SM3）
    const z = computeZ(userId, publicKey);

    // 计算消息摘要 e = SM3(Z || M)（使用本库实现的 SM3）
    const dataBytes = normalizeInput(data);
    const hashInput = new Uint8Array(z.length + dataBytes.length);
    hashInput.set(z, 0);
    hashInput.set(dataBytes, z.length);
    const eHex = sm3Digest(hashInput);
    e = hexToBytes(eHex);
  }

  // prehash: false 因为我们已经计算了 SM3 哈希
  const signatureBytes = sm2.sign(e, privateKeyBytes, {prehash: false});

  // 解析签名（compact 格式：r || s，各32字节）
  const r = bytesToHex(signatureBytes.slice(0, 32));
  const s = bytesToHex(signatureBytes.slice(32, 64));

  // 根据选项返回 DER 编码或原始格式
  if (useDer) {
    const derBytes = encodeSignature(r, s);
    return bytesToHex(derBytes);
  }

  return r + s;
}

/**
 * 使用 SM2 验证签名
 * @param publicKey - 公钥（十六进制字符串）
 * @param data - 原始数据（字符串或 Uint8Array）
 * @param signature - 签名（十六进制字符串，r || s 格式或 DER 编码）
 * @param options - 验签选项
 * @returns 签名是否有效
 */
export function verify(
  publicKey: string,
  data: string | Uint8Array,
  signature: string,
  options?: VerifyOptions
): boolean {
  try {
    // 自动识别并规范化公钥输入
    const cleanPublicKey = normalizePublicKeyInput(publicKey);
    const userId = options?.userId || DEFAULT_USER_ID;
    const isDer = options?.der || false;
    const skipZ = options?.skipZComputation || false;

    let e: Uint8Array;

    if (skipZ) {
      // 跳过 Z 值计算，直接对数据进行 SM3 哈希（使用本库实现的 SM3）
      const dataBytes = normalizeInput(data);
      const eHex = sm3Digest(dataBytes);
      e = hexToBytes(eHex);
    } else {
      // 标准流程：计算 Z 值并与数据一起哈希
      // 计算 Z 值（使用本库实现的 SM3）
      const z = computeZ(userId, cleanPublicKey);

      // 计算消息摘要 e = SM3(Z || M)（使用本库实现的 SM3）
      const dataBytes = normalizeInput(data);
      const hashInput = new Uint8Array(z.length + dataBytes.length);
      hashInput.set(z, 0);
      hashInput.set(dataBytes, z.length);
      const eHex = sm3Digest(hashInput);
      e = hexToBytes(eHex);
    }

    // 解析签名
    let r: string, s: string;

    if (isDer) {
      // 自动识别：如果以 30 开头，可能是 DER 编码
      const sigBytes = hexToBytes(signature);
      const decoded = decodeSignature(sigBytes);
      r = decoded.r;
      s = decoded.s;
    } else {
      // 尝试自动识别格式
      if (signature.length === 128) {
        // 原始格式 r || s
        r = signature.slice(0, 64);
        s = signature.slice(64, 128);
      } else if (signature.startsWith('30')) {
        // 可能是 DER 编码
        const sigBytes = hexToBytes(signature);
        const decoded = decodeSignature(sigBytes);
        r = decoded.r;
        s = decoded.s;
      } else {
        // 无效的签名格式，直接返回 false, throw new Error('Invalid signature format')不太合理
        return false;
      }
    }

    // 使用 @noble/curves 验证签名
    const publicKeyBytes = hexToBytes(cleanPublicKey);

    // 构造签名字节（compact 格式：r || s）
    const rBytes = hexToBytes(r.padStart(64, '0'));
    const sBytes = hexToBytes(s.padStart(64, '0'));
    const signatureBytes = new Uint8Array(64);
    signatureBytes.set(rBytes, 0);
    signatureBytes.set(sBytes, 32);

    // prehash: false 因为我们已经计算了 SM3 哈希
    return sm2.verify(signatureBytes, e, publicKeyBytes, {prehash: false});
  } catch (error) {
    // 验证失败
    return false;
  }
}

/**
 * SM2 密钥交换协议参数（用于初始化或响应方）
 *
 * 标准参考：
 * - GM/T 0003.3-2012: SM2 椭圆曲线密钥交换协议
 * - GM/T 0009-2023: SM2 密码算法使用规范
 */
export interface SM2KeyExchangeParams {
  /**
   * 己方私钥（十六进制字符串）
   */
  privateKey: string;

  /**
   * 己方公钥（十六进制字符串，可选，如果不提供会从私钥派生）
   */
  publicKey?: string;

  /**
   * 己方用户 ID
   *
   * 默认：'1234567812345678'（DEFAULT_USER_ID，保持向后兼容）
   * GMT 0009-2023 推荐使用空字符串 ''
   */
  userId?: string;

  /**
   * 己方临时私钥（十六进制字符串，可选，如果不提供会自动生成）
   */
  tempPrivateKey?: string;

  /**
   * 对方公钥（十六进制字符串）
   */
  peerPublicKey: string;

  /**
   * 对方临时公钥（十六进制字符串）
   */
  peerTempPublicKey: string;

  /**
   * 对方用户 ID
   *
   * 默认：'1234567812345678'（DEFAULT_USER_ID，保持向后兼容）
   * GMT 0009-2023 推荐使用空字符串 ''
   */
  peerUserId?: string;

  /**
   * 是否为发起方（true = 发起方，false = 响应方）
   */
  isInitiator: boolean;

  /**
   * 派生密钥的字节长度（默认：16，即 128 位）
   */
  keyLength?: number;
}

/**
 * SM2 密钥交换结果
 */
export interface SM2KeyExchangeResult {
  /**
   * 己方临时公钥（十六进制字符串）
   */
  tempPublicKey: string;

  /**
   * 派生的共享密钥（十六进制字符串）
   */
  sharedKey: string;

  /**
   * 可选的己方确认哈希值（用于对方验证，十六进制字符串）
   */
  s1?: string;

  /**
   * 可选的对方确认哈希值（用于己方验证，十六进制字符串）
   */
  s2?: string;
}

/**
 * SM2 密钥交换协议
 *
 * 标准参考：
 * - GM/T 0003.3-2012: SM2 椭圆曲线密钥交换协议
 * - GM/T 0009-2023: SM2 密码算法使用规范
 *
 * 这是一个安全的密钥协商协议，允许两方在不安全的通道上协商出共享密钥。
 *
 * 协议流程：
 * 1. 发起方 A 生成临时密钥对 (rA, RA)，发送 RA 给响应方 B
 * 2. 响应方 B 生成临时密钥对 (rB, RB)，发送 RB 给发起方 A
 * 3. 双方各自计算共享密钥 K
 * 4. 可选：双方交换确认哈希值进行相互认证
 *
 * 安全特性：
 * - 前向保密：即使长期私钥泄露，历史会话密钥仍然安全
 * - 相互认证：可选的确认哈希值提供身份验证
 * - 抗中间人攻击：需要长期密钥对的参与
 *
 * @param params - 密钥交换参数
 * @returns 密钥交换结果，包含临时公钥、共享密钥和可选的确认哈希值
 *
 * @example
 * ```typescript
 * // 发起方 A
 * const keyPairA = generateKeyPair();
 * const keyPairB = generateKeyPair();
 *
 * // A 执行第一步，生成临时密钥
 * const resultA1 = keyExchange({
 *   privateKey: keyPairA.privateKey,
 *   publicKey: keyPairA.publicKey,
 *   peerPublicKey: keyPairB.publicKey,
 *   peerTempPublicKey: '', // 暂时不知道 B 的临时公钥
 *   isInitiator: true
 * });
 *
 * // B 收到 A 的临时公钥后，执行密钥交换
 * const resultB = keyExchange({
 *   privateKey: keyPairB.privateKey,
 *   publicKey: keyPairB.publicKey,
 *   peerPublicKey: keyPairA.publicKey,
 *   peerTempPublicKey: resultA1.tempPublicKey,
 *   isInitiator: false
 * });
 *
 * // A 收到 B 的临时公钥后，完成密钥交换
 * const resultA2 = keyExchange({
 *   privateKey: keyPairA.privateKey,
 *   publicKey: keyPairA.publicKey,
 *   peerPublicKey: keyPairB.publicKey,
 *   peerTempPublicKey: resultB.tempPublicKey,
 *   isInitiator: true
 * });
 *
 * // 此时 resultA2.sharedKey === resultB.sharedKey
 * ```
 */
export function keyExchange(params: SM2KeyExchangeParams): SM2KeyExchangeResult {
  // 规范化输入参数
  const selfPrivateKey = normalizePrivateKeyInput(params.privateKey);
  const selfPublicKey = params.publicKey
    ? normalizePublicKeyInput(params.publicKey)
    : getPublicKeyFromPrivateKey(selfPrivateKey);
  const selfUserId = params.userId || DEFAULT_USER_ID;

  const peerPublicKey = normalizePublicKeyInput(params.peerPublicKey);
  const peerTempPublicKey = normalizePublicKeyInput(params.peerTempPublicKey);
  const peerUserId = params.peerUserId || DEFAULT_USER_ID;

  const keyLength = params.keyLength || 16;
  const isInitiator = params.isInitiator;

  // 生成或使用提供的临时密钥对
  let tempPrivateKey: string;
  let tempPublicKey: string;

  if (params.tempPrivateKey) {
    tempPrivateKey = normalizePrivateKeyInput(params.tempPrivateKey);
    tempPublicKey = getPublicKeyFromPrivateKey(tempPrivateKey);
  } else {
    const tempKeyPair = generateKeyPair();
    tempPrivateKey = tempKeyPair.privateKey;
    tempPublicKey = tempKeyPair.publicKey;
  }

  // 解析公钥点
  const peerPublicKeyPoint = sm2.Point.fromHex(peerPublicKey);
  const tempPublicKeyPoint = sm2.Point.fromHex(tempPublicKey);
  const peerTempPublicKeyPoint = sm2.Point.fromHex(peerTempPublicKey);

  // 计算 x̄ = 2^w + (x mod 2^w)，其中 w = ⌈(log2(n) + 1) / 2⌉ - 1
  // 对于 SM2，w = 127
  const w = 127;
  const powerOf2W = 1n << BigInt(w);

  function calculateXBar(point: any): bigint {
    const pointBytes = point.toBytes(false);
    const x = pointBytes.slice(1, 33); // x 坐标（32 字节）
    const xBigInt = BigInt('0x' + bytesToHex(x));
    return powerOf2W + (xBigInt % powerOf2W);
  }

  // 计算己方和对方的 x̄
  const selfXBar = calculateXBar(tempPublicKeyPoint);
  const peerXBar = calculateXBar(peerTempPublicKeyPoint);

  // 计算 tA = (dA + x̄A · rA) mod n
  const n = BigInt('0x' + SM2_CURVE_PARAMS.n);
  const selfPrivateKeyBigInt = BigInt('0x' + selfPrivateKey);
  const tempPrivateKeyBigInt = BigInt('0x' + tempPrivateKey);
  const t = (selfPrivateKeyBigInt + selfXBar * tempPrivateKeyBigInt) % n;

  // 计算 V = [h · tA] (PB + [x̄B]RB)，其中 h = 1
  // V = [tA] (PB + [x̄B]RB)
  const peerCombinedPoint = peerPublicKeyPoint.add(peerTempPublicKeyPoint.multiply(peerXBar));
  const vPoint = peerCombinedPoint.multiply(t);

  // 检查 V 是否为无穷远点
  if (vPoint.equals(sm2.Point.ZERO)) {
    throw new Error('Key exchange failed: V is point at infinity');
  }

  const vBytes = vPoint.toBytes(false);
  const xv = vBytes.slice(1, 33);
  const yv = vBytes.slice(33, 65);

  // 计算 Z 值
  const selfZ = computeZ(selfUserId, selfPublicKey);
  const peerZ = computeZ(peerUserId, peerPublicKey);

  // 构造 KDF 输入：xv || yv || ZA || ZB
  let kdfInput: Uint8Array;
  if (isInitiator) {
    // 发起方：KDF(xv || yv || ZA || ZB)
    kdfInput = new Uint8Array(xv.length + yv.length + selfZ.length + peerZ.length);
    kdfInput.set(xv, 0);
    kdfInput.set(yv, xv.length);
    kdfInput.set(selfZ, xv.length + yv.length);
    kdfInput.set(peerZ, xv.length + yv.length + selfZ.length);
  } else {
    // 响应方：KDF(xv || yv || ZB || ZA)
    kdfInput = new Uint8Array(xv.length + yv.length + peerZ.length + selfZ.length);
    kdfInput.set(xv, 0);
    kdfInput.set(yv, xv.length);
    kdfInput.set(peerZ, xv.length + yv.length);
    kdfInput.set(selfZ, xv.length + yv.length + peerZ.length);
  }

  // 派生共享密钥
  const sharedKeyBytes = kdf(kdfInput, keyLength);
  const sharedKey = bytesToHex(sharedKeyBytes);

  // 计算可选的确认哈希值（用于相互认证）
  // 根据标准（GM/T 0003.3-2012 及 GM/T 0009-2023）:
  // 对于发起方 A: S1 = Hash(0x02 || yv || Hash(xv || ZA || ZB || xRA || yRA || xRB || yRB))
  // 对于响应方 B: S1 = Hash(0x02 || yv || Hash(xv || ZB || ZA || xRB || yRB || xRA || yRA))

  const tempPublicKeyBytes = tempPublicKeyPoint.toBytes(false);
  const peerTempPublicKeyBytes = peerTempPublicKeyPoint.toBytes(false);

  const xSelf = tempPublicKeyBytes.slice(1, 33);
  const ySelf = tempPublicKeyBytes.slice(33, 65);
  const xPeer = peerTempPublicKeyBytes.slice(1, 33);
  const yPeer = peerTempPublicKeyBytes.slice(33, 65);

  // 构造内部哈希输入
  // 发起方 A: xv || ZA || ZB || xRA || yRA || xRB || yRB
  // 响应方 B: xv || ZB || ZA || xRB || yRB || xRA || yRA
  const innerHashInput = new Uint8Array(
    xv.length + selfZ.length + peerZ.length + xSelf.length + ySelf.length + xPeer.length + yPeer.length
  );
  let offset = 0;
  innerHashInput.set(xv, offset);
  offset += xv.length;
  innerHashInput.set(selfZ, offset);
  offset += selfZ.length;
  innerHashInput.set(peerZ, offset);
  offset += peerZ.length;
  innerHashInput.set(xSelf, offset);
  offset += xSelf.length;
  innerHashInput.set(ySelf, offset);
  offset += ySelf.length;
  innerHashInput.set(xPeer, offset);
  offset += xPeer.length;
  innerHashInput.set(yPeer, offset);

  const innerHash = sm3Digest(innerHashInput);
  const innerHashBytes = hexToBytes(innerHash);

  // 计算 S1（发起方发送给响应方，响应方用来验证发起方）
  const s1Input = new Uint8Array(1 + yv.length + innerHashBytes.length);
  s1Input[0] = 0x02;
  s1Input.set(yv, 1);
  s1Input.set(innerHashBytes, 1 + yv.length);
  const s1 = sm3Digest(s1Input);

  // 计算 S2（响应方发送给发起方，发起方用来验证响应方）
  const s2Input = new Uint8Array(1 + yv.length + innerHashBytes.length);
  s2Input[0] = 0x03;
  s2Input.set(yv, 1);
  s2Input.set(innerHashBytes, 1 + yv.length);
  const s2 = sm3Digest(s2Input);

  return {
    tempPublicKey,
    sharedKey,
    s1,
    s2,
  };
}
