/**
 * GMKit 库的常量定义
 */

/**
 * 输出编码格式
 * 用于指定加密结果的编码方式
 *
 * - HEX: 十六进制编码（小写）- 默认格式，与现有 API 保持兼容
 * - BASE64: Base64 编码 - 更紧凑的表示方式，适合网络传输
 */
export const OutputFormat = {
  HEX: 'hex',
  BASE64: 'base64',
} as const;

export type OutputFormatType = typeof OutputFormat[keyof typeof OutputFormat];

/**
 * 填充模式
 * Padding modes for block cipher operations
 *
 * - PKCS7: PKCS#7 填充 - 填充值为填充字节数 (Padding value equals number of padding bytes)
 * - NONE: 无填充 - 数据长度必须是块大小的倍数 (No padding - data length must be multiple of block size)
 * - ZERO: 零填充 - 用零字节填充到块大小 (Zero padding - pad with zero bytes to block size)
 */
export const PaddingMode = {
  PKCS7: 'pkcs7',
  NONE: 'none',
  ZERO: 'zero',
} as const;

export type PaddingModeType = typeof PaddingMode[keyof typeof PaddingMode];

/**
 * 加密模式
 * Cipher modes for SM4 block cipher
 *
 * 分组密码模式 (Block cipher modes):
 * - ECB: 电码本模式 - 每个块独立加密 (Electronic Codebook - each block encrypted independently)
 * - CBC: 分组链接模式 - 每个块与前一个密文块异或 (Cipher Block Chaining - each block XORed with previous ciphertext)
 *
 * 流密码模式 (Stream cipher modes):
 * - CTR: 计数器模式 - 加密计数器产生密钥流 (Counter mode - encrypts counter to produce keystream)
 * - CFB: 密文反馈模式 - 加密前一个密文块产生密钥流 (Cipher Feedback - encrypts previous ciphertext to produce keystream)
 * - OFB: 输出反馈模式 - 加密前一个输出块产生密钥流 (Output Feedback - encrypts previous output to produce keystream)
 *
 * 认证加密模式 (Authenticated Encryption with Associated Data modes):
 * - GCM: 伽罗瓦/计数器模式 - 提供加密和认证 (Galois/Counter Mode - provides encryption and authentication)
 * - CCM: 计数器与CBC-MAC模式 - 提供加密和认证 (Counter with CBC-MAC - provides encryption and authentication) [计划中 Planned]
 *
 * 磁盘加密模式 (Disk encryption modes):
 * - XTS: 可调密码本模式 - 用于磁盘加密 (XEX-based tweaked-codebook mode - for disk encryption) [计划中 Planned]
 */
export const CipherMode = {
  ECB: 'ecb',
  CBC: 'cbc',
  CTR: 'ctr',
  CFB: 'cfb',
  OFB: 'ofb',
  GCM: 'gcm',
} as const;

export type CipherModeType = typeof CipherMode[keyof typeof CipherMode];

/**
 * SM2 密文排列模式
 */
export const SM2CipherMode = {
  C1C3C2: 'C1C3C2',
  C1C2C3: 'C1C2C3',
} as const;

export type SM2CipherModeType = typeof SM2CipherMode[keyof typeof SM2CipherMode];

/**
 * SM 算法的 OID（对象标识符）常量
 * 基于 GM/T 0006-2012 标准和 GB/T 33560-2017 信息安全技术 密码应用标识规范
 *
 * 说明：
 * - 1.2.156 是中国国家密码管理局的注册号
 * - 10197 是商用密码标识
 * - SM2 椭圆曲线基于 ECC，但使用中国自主注册的 OID 和参数
 * - 这些 OID 与国际标准的 ECC OID 不同，确保了商密算法的独立性
 * - SM2 曲线参数：素数域 p = 2^256 - 2^224 - 2^96 + 2^64 - 1
 *
 * ⚠️ OpenSSL 版本兼容性说明：
 * - OpenSSL 1.x 版本：SM2 公钥被错误地标识为标准 EC 公钥（OID: 1.2.840.10045.2.1）
 * - OpenSSL 3.x 版本：SM2 公钥使用正确的国密标准 OID（1.2.156.10197.1.301）
 * - 如果您解析 OpenSSL 1.x 生成的证书，可能会看到 OID 1.2.840.10045.2.1
 * - 建议使用 OpenSSL 3.x 以确保符合国密标准
 */
export const OID = {
  // SM2 算法 OID: 1.2.156.10197.1.301（国密标准，OpenSSL 3.x+）
  // SM2 椭圆曲线公钥密码算法，兼容 ECC 但使用中国标准参数
  SM2: '1.2.156.10197.1.301',
  // SM2 with SM3 签名 OID: 1.2.156.10197.1.501
  // 结合 SM2 签名和 SM3 哈希的完整签名方案
  SM2_SM3: '1.2.156.10197.1.501',
  // SM3 哈希算法 OID: 1.2.156.10197.1.401
  SM3: '1.2.156.10197.1.401',
  // SM4 密码算法 OID: 1.2.156.10197.1.104
  SM4: '1.2.156.10197.1.104',
  // 标准 EC 公钥 OID: 1.2.840.10045.2.1（OpenSSL 1.x 对 SM2 的错误标识）
  // 此 OID 仅供参考，用于识别 OpenSSL 1.x 生成的证书
  EC_PUBLIC_KEY: '1.2.840.10045.2.1',
} as const;

/**
 * SM2 签名的默认用户 ID
 *
 * 标准演进说明：
 * - GM/T 0009-2012: 推荐使用 '1234567812345678' 作为默认用户标识
 * - GM/T 0009-2023: 推荐使用空字符串 '' 作为默认用户标识
 *
 * 为保持向后兼容性，本库继续使用 '1234567812345678' 作为默认值。
 * 如需符合 GMT 0009-2023 最新标准，请在签名和验签时显式传入 userId: ''
 *
 * 注意：签名和验签必须使用相同的 userId，否则验签会失败
 */
export const DEFAULT_USER_ID = '1234567812345678';
