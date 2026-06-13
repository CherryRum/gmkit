/**
 * SM2 类，提供面向对象的 API
 */

import {
  generateKeyPair as generateKeyPairFunc,
  getPublicKeyFromPrivateKey as getPublicKeyFromPrivateKeyFunc,
  encrypt as encryptFunc,
  decrypt as decryptFunc,
  sign as signFunc,
  verify as verifyFunc,
  keyExchange as keyExchangeFunc,
  type KeyPair,
  type SignOptions as FuncSignOptions,
  type VerifyOptions as FuncVerifyOptions,
  type SM2EncryptOptions,
  type SM2DecryptOptions,
  type SM2CurveParams,
  type SM2KeyExchangeResult,
} from './index';
import type { BytesLike } from '../../core/utils';

/**
 * SM2 类，提供面向对象的 API
 * 
 * SM2 是中国国家密码管理局发布的椭圆曲线密码算法，
 * 支持公钥加密、数字签名和密钥交换功能。
 * 
 * @example
 * ```typescript
 * // 生成密钥对
 * const sm2 = SM2.generateKeyPair();
 * 
 * // 加密/解密
 * const encrypted = sm2.encrypt('Hello, SM2!');
 * const decrypted = sm2.decrypt(encrypted);
 * 
 * // 签名/验签
 * const signature = sm2.sign('message');
 * const isValid = sm2.verify('message', signature);
 * ```
 */
export class SM2 {
  /** 公钥（十六进制字符串，04 开头的非压缩格式） */
  private publicKey?: string;
  /** 私钥（十六进制字符串，32 字节） */
  private privateKey?: string;
  /** 自定义椭圆曲线参数 */
  private curveParams?: SM2CurveParams;

  /**
   * 创建新的 SM2 实例
   * @param keyPair - 可选的密钥对（公钥和/或私钥）
   * @param curveParams - 可选的自定义椭圆曲线参数
   */
  constructor(keyPair?: Partial<KeyPair>, curveParams?: SM2CurveParams) {
    this.publicKey = keyPair?.publicKey;
    this.privateKey = keyPair?.privateKey;
    this.curveParams = curveParams;
  }

  /**
   * 生成新的密钥对
   * @param curveParams - 可选的自定义椭圆曲线参数
   * @returns 带有生成的密钥对的新 SM2 实例
   */
  static generateKeyPair(curveParams?: SM2CurveParams): SM2 {
    const keyPair = generateKeyPairFunc();
    return new SM2(keyPair, curveParams);
  }

  /**
   * 从私钥创建 SM2 实例
   * @param privateKey - 私钥（十六进制字符串）
   * @param curveParams - 可选的自定义椭圆曲线参数
   * @returns 新的 SM2 实例
   */
  static fromPrivateKey(privateKey: string, curveParams?: SM2CurveParams): SM2 {
    const publicKey = getPublicKeyFromPrivateKeyFunc(privateKey);
    return new SM2({ privateKey, publicKey }, curveParams);
  }

  /**
   * 从公钥创建 SM2 实例
   * @param publicKey - 公钥（十六进制字符串）
   * @param curveParams - 可选的自定义椭圆曲线参数
   * @returns 新的 SM2 实例
   */
  static fromPublicKey(publicKey: string, curveParams?: SM2CurveParams): SM2 {
    return new SM2({ publicKey }, curveParams);
  }

  /**
   * 获取公钥
   * @returns 公钥（十六进制字符串，04 开头的非压缩格式）
   * @throws 如果公钥未设置则抛出异常
   */
  getPublicKey(): string {
    if (!this.publicKey) {
      throw new Error('公钥未设置');
    }
    return this.publicKey;
  }

  /**
   * 获取私钥
   * @returns 私钥（十六进制字符串，32 字节）
   * @throws 如果私钥未设置则抛出异常
   */
  getPrivateKey(): string {
    if (!this.privateKey) {
      throw new Error('私钥未设置');
    }
    return this.privateKey;
  }

  /**
   * 加密数据
   * @param data - 要加密的数据（字符串或 Uint8Array）
   * @param options - 加密选项（密文模式、输出格式等）
   * @returns 加密后的数据（默认十六进制字符串）
   */
  encrypt(data: string | Uint8Array, options?: SM2EncryptOptions): string {
    const publicKey = this.getPublicKey();
    return encryptFunc(publicKey, data, options);
  }

  /**
   * 解密数据
   * @param encryptedData - 加密的数据（十六进制字符串或 Uint8Array）
   * @param options - 解密选项（密文模式、输入格式等）
   * @returns 解密后的数据（字符串）
   */
  decrypt(encryptedData: BytesLike, options?: SM2DecryptOptions): string {
    const privateKey = this.getPrivateKey();
    return decryptFunc(privateKey, encryptedData, options);
  }

  /**
   * 签名数据
   * @param data - 要签名的数据（字符串或 Uint8Array）
   * @param options - 签名选项（签名格式、用户 ID 等）
   * @returns 签名（默认十六进制字符串，r || s 格式）
   */
  sign(data: string | Uint8Array, options?: Omit<FuncSignOptions, 'curveParams'>): string {
    const privateKey = this.getPrivateKey();
    return signFunc(privateKey, data, { ...options, curveParams: this.curveParams });
  }

  /**
   * 验证签名
   * @param data - 原始数据（字符串或 Uint8Array）
   * @param signature - 签名（十六进制字符串）
   * @param options - 验签选项（签名格式、用户 ID 等）
   * @returns 签名是否有效
   */
  verify(data: string | Uint8Array, signature: string, options?: Omit<FuncVerifyOptions, 'curveParams'>): boolean {
    const publicKey = this.getPublicKey();
    return verifyFunc(publicKey, data, signature, { ...options, curveParams: this.curveParams });
  }

  /**
   * 设置自定义曲线参数
   * @param curveParams - 自定义椭圆曲线参数
   */
  setCurveParams(curveParams: SM2CurveParams): void {
    this.curveParams = curveParams;
  }

  /**
   * 获取曲线参数
   */
  getCurveParams(): SM2CurveParams | undefined {
    return this.curveParams;
  }

  /**
   * 执行 SM2 密钥交换协议
   *
   * @param peerPublicKey - 对方公钥（十六进制字符串）
   * @param peerTempPublicKey - 对方临时公钥（十六进制字符串）
   * @param isInitiator - 是否为发起方
   * @param options - 可选参数
   * @returns 密钥交换结果
   *
   * @example
   * ```typescript
   * const sm2A = SM2.generateKeyPair();
   * const sm2B = SM2.generateKeyPair();
   *
   * // A 生成临时密钥
   * const resultA1 = sm2A.keyExchange(sm2B.getPublicKey(), '', true);
   *
   * // B 进行密钥交换
   * const resultB = sm2B.keyExchange(sm2A.getPublicKey(), resultA1.tempPublicKey, false);
   *
   * // A 完成密钥交换
   * const resultA2 = sm2A.keyExchange(sm2B.getPublicKey(), resultB.tempPublicKey, true);
   * 
   * // 此时 resultA2.sharedKey === resultB.sharedKey
   * ```
   */
  keyExchange(
    peerPublicKey: string,
    peerTempPublicKey: string,
    isInitiator: boolean,
    options?: {
      userId?: string;
      peerUserId?: string;
      tempPrivateKey?: string;
      keyLength?: number;
    }
  ): SM2KeyExchangeResult {
    const privateKey = this.getPrivateKey();
    const publicKey = this.getPublicKey();

    return keyExchangeFunc({
      privateKey,
      publicKey,
      peerPublicKey,
      peerTempPublicKey,
      isInitiator,
      userId: options?.userId,
      peerUserId: options?.peerUserId,
      tempPrivateKey: options?.tempPrivateKey,
      keyLength: options?.keyLength,
    });
  }
}
