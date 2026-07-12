/**
 * gmkitx 顶层入口。
 *
 * 算法范围：
 * - 国密：SM2、SM3、SM4、ZUC（含 EEA3 / EIA3）
 * - 国际：SHA-1、SHA-256、SHA-384、SHA-512（含 HMAC）
 *
 * 三种使用方式（任选其一，能力对等）：
 *   import * as gmkit from 'gmkitx';                 // 命名空间
 *   import { sm2, sm3, sm4, zuc, sha } from 'gmkitx'; // 算法模块
 *   import { sm2Encrypt, sm3Digest, sha256 } from 'gmkitx'; // 具名函数（推荐）
 *
 * generateKeyPair / sign / digest 等无算法前缀旧名继续兼容，但已标记弃用。
 * 新代码请使用带算法前缀的具名函数，或使用 sm2 / sm3 等算法命名空间。
 */

// ============================================================================
// 算法模块命名空间导出
// ============================================================================

import * as sm2Functions from './crypto/sm2';
import * as sm3Functions from './crypto/sm3';
import * as sm4Functions from './crypto/sm4';
import * as zucFunctions from './crypto/zuc';
import * as shaFunctions from './crypto/sha';
import { SM2 as SM2Class } from './crypto/sm2/class';
import { SM3 as SM3Class } from './crypto/sm3/class';
import { SM4 as SM4Class } from './crypto/sm4/class';
import { ZUC as ZUCClass } from './crypto/zuc/class';
import { SHA256 as SHA256Class, SHA384 as SHA384Class, SHA512 as SHA512Class, SHA1 as SHA1Class } from './crypto/sha/class';

/**
 * SM2 椭圆曲线公钥密码算法模块。
 * 聚合所有具名函数与对象式入口 {@link SM2Class}。
 */
export const sm2 = {
  ...sm2Functions,
  SM2: SM2Class,
};

/**
 * SM3 密码杂凑算法模块。
 * 聚合所有具名函数与对象式入口 {@link SM3Class}。
 */
export const sm3 = {
  ...sm3Functions,
  SM3: SM3Class,
};

/**
 * SM4 分组密码算法模块。
 * 聚合所有具名函数与对象式入口 {@link SM4Class}。
 */
export const sm4 = {
  ...sm4Functions,
  SM4: SM4Class,
};

/**
 * ZUC 流密码算法模块（含 EEA3 加密 / EIA3 完整性算法）。
 * 聚合所有具名函数与对象式入口 {@link ZUCClass}。
 */
export const zuc = {
  ...zucFunctions,
  ZUC: ZUCClass,
};

/**
 * SHA 系列哈希算法模块（FIPS 180-4 国际标准）。
 * 聚合 SHA-1 / SHA-256 / SHA-384 / SHA-512 的具名函数与对象式入口。
 */
export const sha = {
  ...shaFunctions,
  SHA256: SHA256Class,
  SHA384: SHA384Class,
  SHA512: SHA512Class,
  SHA1: SHA1Class,
};

// ============================================================================
// 具名函数导出
// ============================================================================

// 优先使用带算法前缀的顶层函数，便于直接识别归属算法。
export const sm2GenerateKeyPair = sm2Functions.generateKeyPair;
export const sm2GetPublicKeyFromPrivateKey = sm2Functions.getPublicKeyFromPrivateKey;
export const sm2CompressPublicKey = sm2Functions.compressPublicKey;
export const sm2DecompressPublicKey = sm2Functions.decompressPublicKey;
export const sm2Encrypt = sm2Functions.encrypt;
export const sm2Decrypt = sm2Functions.decrypt;
export const sm2Sign = sm2Functions.sign;
export const sm2Verify = sm2Functions.verify;
export const sm2KeyExchange = sm2Functions.keyExchange;

export const sm3Digest = sm3Functions.digest;
export const sm3Hmac = sm3Functions.hmac;

export const sm4Encrypt = sm4Functions.encrypt;
export const sm4Decrypt = sm4Functions.decrypt;

export const zucEncrypt = zucFunctions.encrypt;
export const zucDecrypt = zucFunctions.decrypt;
export const zucDecryptBytes = zucFunctions.decryptBytes;
export const zucKeystream = zucFunctions.getKeystream;
export const zucKeystreamWords = zucFunctions.getKeystreamWords;
export const eea3 = zucFunctions.eea3;
export const eea3Encrypt = zucFunctions.eea3Encrypt;
export const eia3 = zucFunctions.eia3;
export const zucGenerateKeystream = zucFunctions.generateKeystream;

export const sha256 = shaFunctions.sha256;
export const sha384 = shaFunctions.sha384;
export const sha512 = shaFunctions.sha512;
export const sha1 = shaFunctions.sha1;
export const hmacSha256 = shaFunctions.hmacSha256;
export const hmacSha384 = shaFunctions.hmacSha384;
export const hmacSha512 = shaFunctions.hmacSha512;

// ============================================================================
// 弃用别名（无算法前缀的旧名）
// ============================================================================

/** @deprecated 请改用 {@link sm2GenerateKeyPair}。 */
export const generateKeyPair = sm2GenerateKeyPair;

/** @deprecated 请改用 {@link sm2GetPublicKeyFromPrivateKey}。 */
export const getPublicKeyFromPrivateKey = sm2GetPublicKeyFromPrivateKey;

/** @deprecated 请改用 {@link sm2CompressPublicKey}。 */
export const compressPublicKey = sm2CompressPublicKey;

/** @deprecated 请改用 {@link sm2DecompressPublicKey}。 */
export const decompressPublicKey = sm2DecompressPublicKey;

/** @deprecated 请改用 {@link sm2Sign}。 */
export const sign = sm2Sign;

/** @deprecated 请改用 {@link sm2Verify}。 */
export const verify = sm2Verify;

/** @deprecated 请改用 {@link sm2KeyExchange}。 */
export const keyExchange = sm2KeyExchange;

/** @deprecated 请改用 {@link sm3Digest}。 */
export const digest = sm3Digest;

/** @deprecated 请改用 {@link sm3Hmac}。 */
export const hmac = sm3Hmac;

// ============================================================================
// 类型与对象式入口（每个算法重新导出对应 class）
// ============================================================================

export type {
  KeyPair,
  SignOptions,
  VerifyOptions,
  SM2CurveParams,
  SM2KeyExchangeParams,
  SM2KeyExchangeResult,
  SM2EncryptOptions,
  SM2DecryptOptions,
  SM2SignatureFormat,
  SM2SignatureInputFormat,
} from './crypto/sm2';

export { SM2 } from './crypto/sm2/class';

export type { SM3Options } from './crypto/sm3';

export { SM3 } from './crypto/sm3/class';

export type {
  SM4Options,
  SM4DecryptOptions,
  SM4CipherResult,
  SM4GCMResult,
  SM4CCMResult,
  SM4AEADResult,
} from './crypto/sm4';

export { SM4 } from './crypto/sm4/class';

export { ZUCState } from './crypto/zuc';
export type { ZUCOptions, ZUCDecryptOptions } from './crypto/zuc';

export { ZUC } from './crypto/zuc/class';

export type { SHAOptions } from './crypto/sha';

export { SHA256, SHA384, SHA512, SHA1 } from './crypto/sha/class';

// ============================================================================
// 常量和类型导出
// ============================================================================

export {
  CipherMode,
  PaddingMode,
  SM2CipherMode,
  OutputFormat,
  InputFormat,
  OID,
  DEFAULT_USER_ID,
  type CipherModeType,
  type PaddingModeType,
  type SM2CipherModeType,
  type OutputFormatType,
  type InputFormatType,
} from './types/constants';

// ============================================================================
// 工具函数导出
// ============================================================================

export {
  hexToBytes,
  bytesToHex,
  base64ToBytes,
  bytesToBase64,
  stringToBytes,
  bytesToString,
  normalizeInput,
  decodeInput,
  encodeOutput,
  autoDecodeString,
  xor,
  rotl,
  isHexString,
  isBase64String,
  bytes4ToUint32BE,
  uint32ToBytes4BE,
  configureRNG,
  setRNGPolicy,
  setCustomRNG,
  clearCustomRNG,
  hasCustomRNG,
  getRandomBytes,
  setTextCodec,
  getEnvReport,
  constantTimeEqual,
  type BytesLike,
  type RNGPolicy,
  type TextCodec,
  type EnvReport,
} from './core/utils';

// ASN.1 工具
export {
  encodeSignature,
  decodeSignature,
  rawToDer,
  derToRaw,
  asn1ToXml,
  signatureToXml,
} from './core/asn1';

// ============================================================================
// 默认导出（用于 UMD 格式）
// ============================================================================

export default {
  sm2,
  sm3,
  sm4,
  zuc,
  sha,
  // 推荐使用的顶层函数导出
  sm2GenerateKeyPair,
  sm2GetPublicKeyFromPrivateKey,
  sm2CompressPublicKey,
  sm2DecompressPublicKey,
  sm2Encrypt,
  sm2Decrypt,
  sm2Sign,
  sm2Verify,
  sm2KeyExchange,
  sm3Digest,
  sm3Hmac,
  sm4Encrypt,
  sm4Decrypt,
  zucEncrypt,
  zucDecrypt,
  zucDecryptBytes,
  zucKeystream,
  zucKeystreamWords,
  zucGenerateKeystream,
  eea3,
  eea3Encrypt,
  eia3,
  sha256,
  sha384,
  sha512,
  sha1,
  hmacSha256,
  hmacSha384,
  hmacSha512,
  // 旧版调用继续可用，类型提示会引导新代码迁移到带算法前缀的名称。
  generateKeyPair,
  getPublicKeyFromPrivateKey,
  compressPublicKey,
  decompressPublicKey,
  sign,
  verify,
  keyExchange,
  digest,
  hmac,
};
