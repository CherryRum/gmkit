import {
  encrypt as encryptFunc,
  decrypt as decryptFunc,
  decryptBytes as decryptBytesFunc,
  getKeystream as getKeystreamFunc,
  eea3 as eea3Func,
  eea3Encrypt as eea3EncryptFunc,
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
   * 获取当前初始化向量。
   * @returns 构造或 setIV 时保存的 16 字节值
   */
  getIV(): string | Uint8Array {
    return this.iv;
  }

  /**
   * 使用 ZUC 流密码加密数据
   * @param plaintext - 待加密的数据（字符串或 Uint8Array）
   * @param options - 输出编码；默认 Hex
   * @returns 十六进制字符串形式的密文
   */
  encrypt(plaintext: string | Uint8Array, options?: ZUCOptions): string {
    return encryptFunc(this.key, this.iv, plaintext, options);
  }

  /**
   * 使用 ZUC 流密码解密数据
   * @param ciphertext - 十六进制字符串形式的密文
   * @param options - 字符串输入编码；省略时自动识别 Hex/Base64
   * @returns 解密后的字符串
   */
  decrypt(ciphertext: string | Uint8Array, options?: ZUCDecryptOptions): string {
    return decryptFunc(this.key, this.iv, ciphertext, options);
  }

  /**
   * 解密任意二进制密文，不经过 UTF-8 解码。
   * @param ciphertext - Hex/Base64 字符串或原始密文字节
   * @param options - 字符串输入编码；省略时自动识别
   * @returns 与密文等长的原始明文字节
   * @throws key、IV、编码或长度无效时抛出错误
   */
  decryptBytes(ciphertext: string | Uint8Array, options?: ZUCDecryptOptions): Uint8Array {
    return decryptBytesFunc(this.key, this.iv, ciphertext, options);
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
   * @param key - 16 字节保密密钥
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
   * @param key - 16 字节完整性密钥
   * @param count - 32 位计数值
   * @param bearer - 5 位承载标识
   * @param direction - 1 位方向标志（0 表示上行，1 表示下行）
   * @param message - 待认证的消息
   * @param bitLength - 参与认证的消息 bit 数；省略时使用全部字节
   * @returns 32 位 MAC-I（十六进制字符串）
   */
  static eia3(
    key: string | Uint8Array,
    count: number,
    bearer: number,
    direction: number,
    message: string | Uint8Array,
    bitLength?: number
  ): string {
    return eia3Func(key, count, bearer, direction, message, bitLength);
  }

  /**
   * 按消息比特长度执行标准 EEA3 加密。
   * @param key - 16 字节保密密钥
   * @param count - 32 位计数值
   * @param bearer - 0 到 31 的承载标识
   * @param direction - 方向标志，只能为 0 或 1
   * @param message - 待加密消息；字符串按 UTF-8
   * @param bitLength - 参与加密的消息 bit 数；省略时使用全部字节
   * @returns 小写 Hex 密文；末字节未使用 bit 清零
   */
  static eea3Encrypt(
    key: string | Uint8Array,
    count: number,
    bearer: number,
    direction: number,
    message: string | Uint8Array,
    bitLength?: number
  ): string {
    return eea3EncryptFunc(key, count, bearer, direction, message, bitLength);
  }

  /**
   * 创建 ZUC-128 实例
   * @param key - 128 位密钥（16 字节或 32 个十六进制字符）
   * @param iv - 128 位初始化向量（16 字节或 32 个十六进制字符）
   * @returns 保存该 key 与 IV 的新实例
   */
  static ZUC128(key: string | Uint8Array, iv: string | Uint8Array): ZUC {
    return new ZUC(key, iv);
  }
}
