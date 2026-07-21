import {
  encrypt as encryptFunc,
  decrypt as decryptFunc,
  decryptBytes as decryptBytesFunc,
  type SM4Options as FuncSM4Options,
  type SM4DecryptOptions as FuncSM4DecryptOptions,
  type SM4CipherResult,
} from './index';
import { CipherMode, PaddingMode, type CipherModeType, type PaddingModeType } from '../../types/constants';
import type { BytesLike } from '../../core/utils';

/**
 * SM4 class providing object-oriented API for block cipher operations
 * SM4 类，提供面向对象的分组密码操作API
 *
 * 支持的加密模式 (Supported cipher modes):
 * - ECB: 电码本模式 (Electronic Codebook)
 * - CBC: 分组链接模式 (Cipher Block Chaining)
 * - CTR: 计数器模式 (Counter mode)
 * - CFB: 密文反馈模式 (Cipher Feedback)
 * - OFB: 输出反馈模式 (Output Feedback)
 * - GCM: 伽罗瓦/计数器模式 (Galois/Counter Mode) - 认证加密 (AEAD)
 * - CCM: 计数器与 CBC-MAC 模式 (Counter with CBC-MAC) - 认证加密 (AEAD)
 *
 * 支持的填充模式 (Supported padding modes):
 * - PKCS7: PKCS#7 填充 (PKCS#7 padding)
 * - NONE: 无填充 (No padding)
 * - ZERO: 零填充 (Zero padding)
 */
export class SM4 {
  private key: BytesLike;
  private mode: CipherModeType;
  private padding: PaddingModeType;
  private iv?: BytesLike;

  /**
   * 创建新的 SM4 实例
   *
   * @param key - Encryption key as hex string (32 hex chars = 16 bytes)
   *              加密密钥，十六进制字符串（32个字符 = 16字节）
   * @param options - Cipher options
   *                  加密选项
   * @param options.mode - Cipher mode (default: ECB)
   *                       加密模式（默认：ECB）
   * @param options.padding - Padding mode (default: PKCS7)
   *                          填充模式（默认：PKCS7）
   * @param options.iv - Initialization vector / nonce (required for CBC/CTR/CFB/OFB/GCM/CCM)
   *                     初始化向量 / nonce（CBC/CTR/CFB/OFB/GCM/CCM 模式需要）
   */
  constructor(key: BytesLike, options?: {
    mode?: CipherModeType;
    padding?: PaddingModeType;
    iv?: BytesLike;
  }) {
    this.key = key;
    this.mode = options?.mode || CipherMode.ECB;
    this.padding = options?.padding || PaddingMode.PKCS7;
    this.iv = options?.iv;
  }

  /**
   * 设置初始化向量 / nonce（CBC/CTR/CFB/OFB/GCM/CCM 模式专用）
   * @param iv - 十六进制字符串表示的 IV/nonce（CCM 允许 14-26 个十六进制字符）
   */
  setIV(iv: BytesLike): void {
    this.iv = iv;
  }

  /**
   * 获取当前初始化向量或 nonce。
   * @returns 构造或 setIV 时保存的值；ECB 或未设置时返回 undefined
   */
  getIV(): BytesLike | undefined {
    return this.iv;
  }

  /**
   * 设置加密模式
   * @param mode - 加密模式（ECB、CBC、CTR、CFB、OFB、GCM、CCM）
   */
  setMode(mode: CipherModeType): void {
    this.mode = mode;
  }

  /**
   * 获取当前加密模式。
   * @returns 当前 mode；构造时省略则为 `ecb`
   */
  getMode(): CipherModeType {
    return this.mode;
  }

  /**
   * 设置填充模式
   *
   * @param padding - Padding mode (PKCS7, NONE, or ZERO)
   *                  填充模式（PKCS7、NONE 或 ZERO）
   */
  setPadding(padding: PaddingModeType): void {
    this.padding = padding;
  }

  /**
   * 获取当前填充模式。
   * @returns 当前 padding；构造时省略则为 `pkcs7`
   */
  getPadding(): PaddingModeType {
    return this.padding;
  }

  /**
   * 加密数据
   * @param data - 待加密的数据
   * @param options - 本次调用覆盖选项（如 aad/tagLength/outputFormat）
   * @returns 十六进制密文；AEAD 模式下返回包含密文与标签的对象
   */
  encrypt(data: string | Uint8Array, options?: Partial<FuncSM4Options>): SM4CipherResult {
    const mergedOptions: FuncSM4Options = {
      mode: this.mode,
      padding: this.padding,
      iv: this.iv,
      ...options,
    };
    return encryptFunc(this.key, data, mergedOptions);
  }

  /**
   * 解密数据
   * @param encryptedData - 十六进制密文或 AEAD 模式的密文结果
   * @param options - 本次调用覆盖选项（如 aad/tag/inputFormat）
   * @returns 解密得到的明文字符串
   */
  decrypt(encryptedData: BytesLike | SM4CipherResult, options?: Partial<FuncSM4DecryptOptions>): string {
    const mergedOptions: FuncSM4DecryptOptions = {
      mode: this.mode,
      padding: this.padding,
      iv: this.iv,
      ...options,
    };
    return decryptFunc(this.key, encryptedData, mergedOptions);
  }

  /**
   * 解密任意二进制明文，不经过 UTF-8 解码。
   * @param encryptedData - 字符串、原始密文字节或带 tag 的结构化结果
   * @param options - 本次调用覆盖项，包括 AAD、tag 和输入编码
   * @returns 解密并完成填充/AEAD 校验后的原始字节
   * @throws key、IV/nonce、tag、padding 或认证校验无效时抛出错误
   */
  decryptBytes(encryptedData: BytesLike | SM4CipherResult, options?: Partial<FuncSM4DecryptOptions>): Uint8Array {
    const mergedOptions: FuncSM4DecryptOptions = {
      mode: this.mode,
      padding: this.padding,
      iv: this.iv,
      ...options,
    };
    return decryptBytesFunc(this.key, encryptedData, mergedOptions);
  }

  /**
   * 以 ECB 模式创建实例
   * @param key - 十六进制密钥
   * @param padding - 填充模式（默认：PKCS7）
   * @returns 配置为 ECB 的新实例
   */
  static ECB(key: BytesLike, padding: PaddingModeType = PaddingMode.PKCS7): SM4 {
    return new SM4(key, { mode: CipherMode.ECB, padding });
  }

  /**
   * 以 CBC 模式创建实例
   * @param key - 十六进制密钥
   * @param iv - 十六进制初始化向量
   * @param padding - 填充模式（默认：PKCS7）
   * @returns 配置为 CBC 的新实例
   */
  static CBC(key: BytesLike, iv: BytesLike, padding: PaddingModeType = PaddingMode.PKCS7): SM4 {
    return new SM4(key, { mode: CipherMode.CBC, padding, iv });
  }

  /**
   * 以 CTR 模式创建实例
   * @param key - 十六进制密钥
   * @param iv - 十六进制计数器/随机数
   * @returns 配置为 CTR 且不填充的新实例
   */
  static CTR(key: BytesLike, iv: BytesLike): SM4 {
    return new SM4(key, { mode: CipherMode.CTR, padding: PaddingMode.NONE, iv });
  }

  /**
   * 以 CFB 模式创建实例
   * @param key - 十六进制密钥
   * @param iv - 十六进制初始化向量
   * @returns 配置为 CFB 且不填充的新实例
   */
  static CFB(key: BytesLike, iv: BytesLike): SM4 {
    return new SM4(key, { mode: CipherMode.CFB, padding: PaddingMode.NONE, iv });
  }

  /**
   * 以 OFB 模式创建实例
   * @param key - 十六进制密钥
   * @param iv - 十六进制初始化向量
   * @returns 配置为 OFB 且不填充的新实例
   */
  static OFB(key: BytesLike, iv: BytesLike): SM4 {
    return new SM4(key, { mode: CipherMode.OFB, padding: PaddingMode.NONE, iv });
  }

  /**
   * 以 GCM 模式创建实例
   * @param key - 十六进制密钥
   * @param iv - 十六进制初始化向量（24 个字符 = 12 字节）
   * @returns 配置为 GCM 且不填充的新实例
   */
  static GCM(key: BytesLike, iv: BytesLike): SM4 {
    return new SM4(key, { mode: CipherMode.GCM, padding: PaddingMode.NONE, iv });
  }

  /**
   * 以 CCM 模式创建实例
   * @param key - 十六进制密钥
   * @param nonce - 十六进制 nonce（14-26 个字符 = 7-13 字节）
   * @returns 配置为 CCM 且不填充的新实例
   */
  static CCM(key: BytesLike, nonce: BytesLike): SM4 {
    return new SM4(key, { mode: CipherMode.CCM, padding: PaddingMode.NONE, iv: nonce });
  }
}
