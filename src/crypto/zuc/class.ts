import {
  encrypt as encryptFunc,
  decrypt as decryptFunc,
  getKeystream as getKeystreamFunc,
  eea3 as eea3Func,
  eia3 as eia3Func,
  type ZUCDecryptOptions,
  type ZUCOptions,
} from './index';

/**
 * ZUC 流密码算法的面向对象封装
 * 
 * ZUC-128 是中国国家密码管理局发布的流密码算法，
 * 用于 4G LTE 移动通信网络的加密和完整性保护。
 * 
 * 主要用途：
 * - EEA3：LTE 网络的数据加密
 * - EIA3：LTE 网络的数据完整性保护
 * - 通用流密码加密
 * 
 * @example
 * ```typescript
 * // 创建 ZUC 实例
 * const zuc = new ZUC(
 *   '00000000000000000000000000000000', // 128 位密钥
 *   '00000000000000000000000000000000'  // 128 位 IV
 * );
 * 
 * // 加密数据
 * const encrypted = zuc.encrypt('Hello, ZUC!');
 * 
 * // 解密数据
 * const decrypted = zuc.decrypt(encrypted);
 * 
 * // 生成密钥流
 * const keystream = zuc.keystream(16);
 * ```
 * 
 * @example
 * ```typescript
 * // LTE EEA3 加密
 * const keystream = ZUC.eea3(
 *   key,        // 128 位密钥
 *   0x12345678, // 32 位计数器
 *   5,          // 5 位 bearer ID
 *   0,          // 方向（0=上行, 1=下行）
 *   128         // 密钥流比特数
 * );
 * 
 * // LTE EIA3 完整性认证
 * const mac = ZUC.eia3(
 *   key,        // 128 位密钥
 *   0x12345678, // 32 位计数器
 *   5,          // 5 位 bearer ID
 *   0,          // 方向
 *   message     // 要认证的消息
 * );
 * ```
 */
export class ZUC {
  /** 加密密钥（128 位） */
  private key: string | Uint8Array;
  /** 初始化向量（128 位） */
  private iv: string | Uint8Array;

  /**
   * 创建新的 ZUC 实例
   *
   * @param key - Encryption key (16 bytes or 32 hex chars for ZUC-128)
   *              加密密钥（ZUC-128 需要 16 字节或 32 个十六进制字符）
   * @param iv - Initialization vector (16 bytes or 32 hex chars for ZUC-128)
   *             初始化向量（ZUC-128 需要 16 字节或 32 个十六进制字符）
   */
  constructor(key: string | Uint8Array, iv: string | Uint8Array) {
    this.key = key;
    this.iv = iv;
  }

  /**
   * 设置初始化向量
   * @param iv - 十六进制字符串或字节数组（ZUC-128 为 32 个十六进制字符）
   */
  setIV(iv: string | Uint8Array): void {
    this.iv = iv;
  }

  /**
   * 获取当前初始化向量
   */
  getIV(): string | Uint8Array {
    return this.iv;
  }

  /**
   * 使用 ZUC 流密码加密数据
   * @param plaintext - 待加密的数据（字符串或 Uint8Array）
   * @returns 十六进制字符串形式的密文
   */
  encrypt(plaintext: string | Uint8Array, options?: ZUCOptions): string {
    return encryptFunc(this.key, this.iv, plaintext, options);
  }

  /**
   * 使用 ZUC 流密码解密数据
   * @param ciphertext - 十六进制字符串形式的密文
   * @returns 解密后的字符串
   */
  decrypt(ciphertext: string | Uint8Array, options?: ZUCDecryptOptions): string {
    return decryptFunc(this.key, this.iv, ciphertext, options);
  }

  /**
   * 生成 ZUC 密钥流
   * @param length - 需要生成的字节长度
   * @returns 十六进制字符串形式的密钥流
   */
  keystream(length: number): string {
    return getKeystreamFunc(this.key, this.iv, length);
  }

  /**
   * 为 LTE 加密生成 EEA3 密钥流
   * @param count - 32 位计数值
   * @param bearer - 5 位承载标识
   * @param direction - 1 位方向标志（0 表示上行，1 表示下行）
   * @param length - 需要生成的密钥流比特长度
   * @returns EEA3 密钥流
   */
  static eea3(
    key: string | Uint8Array,
    count: number,
    bearer: number,
    direction: number,
    length: number
  ): string {
    return eea3Func(key, count, bearer, direction, length);
  }

  /**
   * 为 LTE 认证生成 EIA3 完整性标签
   * @param count - 32 位计数值
   * @param bearer - 5 位承载标识
   * @param direction - 1 位方向标志（0 表示上行，1 表示下行）
   * @param message - 待认证的消息
   * @returns 32 位 MAC-I（十六进制字符串）
   */
  static eia3(
    key: string | Uint8Array,
    count: number,
    bearer: number,
    direction: number,
    message: string | Uint8Array
  ): string {
    return eia3Func(key, count, bearer, direction, message);
  }

  /**
   * 创建 ZUC-128 实例
   * @param key - 128 位密钥（16 字节或 32 个十六进制字符）
   * @param iv - 128 位初始化向量（16 字节或 32 个十六进制字符）
   */
  static ZUC128(key: string | Uint8Array, iv: string | Uint8Array): ZUC {
    return new ZUC(key, iv);
  }
}
