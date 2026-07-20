/**
 * GMKit 库的常量定义
 * 
 * 包含所有加密算法所需的常量、枚举和配置项。
 * 这些常量遵循中国国密标准和国际密码学标准。
 */

/**
 * 输出编码格式
 * 用于指定加密结果的编码方式
 *
 * - HEX: 十六进制编码（小写）- 默认格式，与现有 API 保持兼容
 * - BASE64: Base64 编码 - 更紧凑的表示方式，适合网络传输
 */
export const OutputFormat = {
  /** 小写十六进制编码。 */
  HEX: 'hex',
  /** RFC 4648 Base64 编码。 */
  BASE64: 'base64',
} as const;

/** 输出编码可选值：`hex` 或 `base64`。 */
export type OutputFormatType = typeof OutputFormat[keyof typeof OutputFormat];

/**
 * 输入编码格式
 * 用于指定密文/签名等二进制数据的输入编码方式
 *
 * - HEX: 十六进制编码（小写）
 * - BASE64: Base64 编码
 */
export const InputFormat = {
  /** 十六进制编码，输入可使用大小写字母。 */
  HEX: 'hex',
  /** RFC 4648 Base64 编码。 */
  BASE64: 'base64',
} as const;

/** 输入编码可选值：`hex` 或 `base64`。 */
export type InputFormatType = typeof InputFormat[keyof typeof InputFormat];

/**
 * 填充模式
 * Padding modes for block cipher operations
 *
 * - PKCS7: PKCS#7 填充 - 填充值为填充字节数 (Padding value equals number of padding bytes)
 * - NONE: 无填充 - 数据长度必须是块大小的倍数 (No padding - data length must be multiple of block size)
 * - ZERO: 零填充 - 用零字节填充到块大小 (Zero padding - pad with zero bytes to block size)
 */
export const PaddingMode = {
  /** PKCS#7 填充；解密会校验每个填充字节。 */
  PKCS7: 'pkcs7',
  /** 不填充；ECB/CBC 输入长度必须是 16 字节的倍数。 */
  NONE: 'none',
  /** 使用零字节补齐；不能无歧义还原以零字节结尾的原文。 */
  ZERO: 'zero',
} as const;

/** SM4 填充模式可选值。 */
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
 * - CCM: 计数器与CBC-MAC模式 - 提供加密和认证 (Counter with CBC-MAC - provides encryption and authentication)
 *
 * 磁盘加密模式 (Disk encryption modes):
 * - XTS: 可调密码本模式 - 用于磁盘加密 (XEX-based tweaked-codebook mode - for disk encryption) [计划中 Planned]
 */
export const CipherMode = {
  /** ECB 分组模式，不使用 IV；新协议不应选择。 */
  ECB: 'ecb',
  /** CBC 分组链接模式，IV 必须为 16 字节。 */
  CBC: 'cbc',
  /** CTR 计数器模式，计数器初值必须为 16 字节。 */
  CTR: 'ctr',
  /** CFB 流式反馈模式，IV 必须为 16 字节。 */
  CFB: 'cfb',
  /** OFB 流式反馈模式，IV 必须为 16 字节。 */
  OFB: 'ofb',
  /** GCM 认证加密模式，输出密文和认证标签。 */
  GCM: 'gcm',
  /** CCM 认证加密模式，nonce 长度为 7 至 13 字节。 */
  CCM: 'ccm',
} as const;

/** SM4 工作模式可选值。 */
export type CipherModeType = typeof CipherMode[keyof typeof CipherMode];

/**
 * SM2 密文排列模式
 * 
 * SM2 加密结果由三部分组成：
 * - C1：椭圆曲线点（随机数与基点的乘积，65 字节非压缩格式）
 * - C2：加密数据（与明文等长）
 * - C3：SM3 哈希值（32 字节）
 * 
 * 两种排列方式：
 * - C1C3C2（推荐）：符合 GM/T 0009-2012/2023 标准
 * - C1C2C3：旧版本兼容格式
 */
export const SM2CipherMode = {
  /** 标准排列 `C1 || C3 || C2`，是当前默认值。 */
  C1C3C2: 'C1C3C2',
  /** 旧系统常见排列 `C1 || C2 || C3`，仅用于互操作。 */
  C1C2C3: 'C1C2C3',
} as const;

/** SM2 密文排列可选值。 */
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
  /** SM2 公钥算法 OID：`1.2.156.10197.1.301`。 */
  SM2: '1.2.156.10197.1.301',
  /** SM2-with-SM3 签名 OID：`1.2.156.10197.1.501`。 */
  SM2_SM3: '1.2.156.10197.1.501',
  /** SM3 杂凑算法 OID：`1.2.156.10197.1.401`。 */
  SM3: '1.2.156.10197.1.401',
  /** SM4 分组密码算法 OID：`1.2.156.10197.1.104`。 */
  SM4: '1.2.156.10197.1.104',
  /** 标准 EC 公钥 OID，仅用于识别历史 OpenSSL 1.x 产物。 */
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
 * 当前版本把省略值和空字符串都视为默认值；需要自定义身份时，应传入
 * 一个非空 userId，并确保签名端与验签端完全一致。
 *
 * 注意：签名和验签必须使用相同的 userId，否则验签会失败
 */
export const DEFAULT_USER_ID = '1234567812345678';
