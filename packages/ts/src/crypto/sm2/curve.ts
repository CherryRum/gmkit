/**
 * SM2 椭圆曲线参数和工具函数
 *
 * 标准参考：
 * - GM/T 0003-2012: SM2 椭圆曲线公钥密码算法
 * - GM/T 0009-2023: SM2 密码算法使用规范
 *
 * 椭圆曲线运算委托给 @noble/curves。依赖项目公开的审计材料不等于 GMKit
 * 组合实现已完成独立安全审计，JavaScript/JIT 运行时也不保证严格恒时。
 */

import { weierstrass, ecdsa } from '@noble/curves/abstract/weierstrass.js';
import { Field } from '@noble/curves/abstract/modular.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { getRandomBytes } from '../../core/utils';
/**
 * SM2 推荐曲线参数
 *
 * 标准参考：
 * - GM/T 0003-2012: SM2 椭圆曲线公钥密码算法
 * - GM/T 0009-2023: SM2 密码算法使用规范（继续使用相同的曲线参数）
 *
 * 曲线方程：y² = x³ + ax + b (mod p)
 * 
 * 素数域 p = 2^256 - 2^224 - 2^96 + 2^64 - 1
 * 这是一个具有广义梅森（伪梅森）形式的 256 位素数，其特殊结构有利于高效实现模运算
 * 
 * 安全级别：约 128 位（与 AES-128 相当）
 */
export const SM2_CURVE_PARAMS = {
  // 素数模数 p
  p: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF',
  // 系数 a
  a: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC',
  // 系数 b
  b: '28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93',
  // 基点 x 坐标
  Gx: '32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7',
  // 基点 y 坐标
  Gy: 'BC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0',
  // 阶 n
  n: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123',
  // 余因子
  h: 1,
} as const;

/**
 * 从十六进制字符串创建 BigInt
 * 
 * 支持带或不带 '0x' 前缀的十六进制字符串
 * 
 * @param hex - 十六进制字符串
 * @returns BigInt 值
 * 
 * @example
 * ```typescript
 * hexToBigInt('FF') // 返回 255n
 * hexToBigInt('0xFF') // 返回 255n
 * ```
 */
export function hexToBigInt(hex: string): bigint {
  if (hex.startsWith('0x')) {
    return BigInt(hex);
  }
  return BigInt('0x' + hex);
}
/**
 * SM2 曲线参数（BigInt 格式）
 * 用于 @noble/curves 库的椭圆曲线运算
 */
const sm2CurveConfig = {
  p: hexToBigInt(SM2_CURVE_PARAMS.p),
  a: hexToBigInt(SM2_CURVE_PARAMS.a),
  b: hexToBigInt(SM2_CURVE_PARAMS.b),
  Gx: hexToBigInt(SM2_CURVE_PARAMS.Gx),
  Gy: hexToBigInt(SM2_CURVE_PARAMS.Gy),
  n: hexToBigInt(SM2_CURVE_PARAMS.n),
  h: BigInt(SM2_CURVE_PARAMS.h),
};

/**
 * 创建 SM2 曲线的有限域 Fp
 * 所有坐标运算都在这个有限域中进行
 */
const Fp = Field(sm2CurveConfig.p);

/**
 * 创建 SM2 椭圆曲线点的 Weierstrass 形式
 * Weierstrass 形式：y² = x³ + ax + b
 */
const sm2Point = weierstrass(sm2CurveConfig, {
  Fp,
});

/**
 * SM2 椭圆曲线实例（带签名/验签功能）
 * 使用 @noble/curves 的 ecdsa 包装器
 */
export const sm2 = ecdsa(sm2Point, sha256, {
  randomBytes: getRandomBytes,
});
