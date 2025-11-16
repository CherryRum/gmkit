/**
 * SM2 椭圆曲线参数和工具函数
 *
 * 标准参考：
 * - GM/T 0003-2012: SM2 椭圆曲线公钥密码算法
 * - GM/T 0009-2023: SM2 密码算法使用规范
 *
 * 使用 @noble/curves 进行高效的椭圆曲线运算
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
 * 素数域 p = 2^256 - 2^224 - 2^96 + 2^64 - 1
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
 * 从十六进制字符串创建 bigint
 */
export function hexToBigInt(hex: string): bigint {
  if (hex.startsWith('0x')) {
    return BigInt(hex);
  }
  return BigInt('0x' + hex);
}
// SM2 曲线参数（BigInt格式）
const sm2CurveConfig = {
  p: hexToBigInt(SM2_CURVE_PARAMS.p),
  a: hexToBigInt(SM2_CURVE_PARAMS.a),
  b: hexToBigInt(SM2_CURVE_PARAMS.b),
  Gx: hexToBigInt(SM2_CURVE_PARAMS.Gx),
  Gy: hexToBigInt(SM2_CURVE_PARAMS.Gy),
  n: hexToBigInt(SM2_CURVE_PARAMS.n),
  h: BigInt(SM2_CURVE_PARAMS.h),
};

// 创建有限域
const Fp = Field(sm2CurveConfig.p);

// 创建椭圆曲线点
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
