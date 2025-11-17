/**
 * Example usage of GMKit
 * Run with: npx tsx examples.ts
 */

import {
  // Functional API - SM3
  digest,
  hmac,
  // Functional API - SM4
  sm4Encrypt,
  sm4Decrypt,
  // Functional API - SM2
  generateKeyPair,
  sm2Encrypt,
  sm2Decrypt,
  sign,
  verify,
  // Functional API - ZUC
  zucEncrypt,
  zucDecrypt,
  zucKeystream,
  eea3,
  eia3,
  // Functional API - SHA
  sha256,
  sha384,
  sha512,
  hmacSha256,
  // Utilities
  hexToBytes,
  bytesToHex,
  // Object-Oriented API
  SM2,
  SM3,
  SM4,
  ZUC,
  SHA256,
  // Constants
  CipherMode,
  PaddingMode,
  SM2CipherMode,
  OutputFormat,
  OID,
  DEFAULT_USER_ID,
} from './src/index';

console.log('=== GMKit Examples ===\n');

// Constants Examples
console.log('--- Constants ---');
console.log('OID.SM2:', OID.SM2);
console.log('OID.SM3:', OID.SM3);
console.log('OID.SM4:', OID.SM4);
console.log('OID.SM2_SM3:', OID.SM2_SM3);
console.log('DEFAULT_USER_ID:', DEFAULT_USER_ID);
console.log();

// SM3 Functional API Examples
console.log('--- SM3 Hash (Functional API) ---');
const hash1 = digest('abc');
console.log('SM3("abc"):', hash1);

const hash2 = digest('Hello, World!');
console.log('SM3("Hello, World!"):', hash2);

const mac = hmac('key', 'message');
console.log('HMAC-SM3("key", "message"):', mac);
console.log();

// SM3 Object-Oriented API Examples
console.log('--- SM3 Hash (OOP API) ---');
const hash3 = SM3.digest('abc');
console.log('SM3.digest("abc"):', hash3);

const sm3 = new SM3();
sm3.update('Hello, ').update('World!');
const hash4 = sm3.digest();
console.log('SM3 incremental hash:', hash4);
console.log();

// SM4 Functional API Examples
console.log('--- SM4 Block Cipher (Functional API) ---');
const sm4Key = '0123456789abcdeffedcba9876543210';
const plaintext = 'Hello, SM4!';

// ECB mode with constants
const encryptedECB = sm4Encrypt(sm4Key, plaintext, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
console.log('SM4 ECB Encrypted:', encryptedECB);
const decryptedECB = sm4Decrypt(sm4Key, encryptedECB, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
console.log('SM4 ECB Decrypted:', decryptedECB);

// CBC mode with constants
const iv = 'fedcba98765432100123456789abcdef';
const encryptedCBC = sm4Encrypt(sm4Key, plaintext, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
console.log('SM4 CBC Encrypted:', encryptedCBC);
const decryptedCBC = sm4Decrypt(sm4Key, encryptedCBC, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
console.log('SM4 CBC Decrypted:', decryptedCBC);
console.log();

// SM4 Object-Oriented API Examples
console.log('--- SM4 Block Cipher (OOP API) ---');
const sm4ecb = SM4.ECB(sm4Key);
const encrypted1 = sm4ecb.encrypt('Hello, SM4 OOP!');
console.log('SM4 ECB Encrypted:', encrypted1);
const decrypted1 = sm4ecb.decrypt(encrypted1);
console.log('SM4 ECB Decrypted:', decrypted1);

const sm4cbc = SM4.CBC(sm4Key, iv);
const encrypted2 = sm4cbc.encrypt('Hello, SM4 OOP!');
console.log('SM4 CBC Encrypted:', encrypted2);
const decrypted2 = sm4cbc.decrypt(encrypted2);
console.log('SM4 CBC Decrypted:', decrypted2);
console.log();

// SM2 Functional API Examples
console.log('--- SM2 Elliptic Curve (Functional API) ---');
const keyPair = generateKeyPair();
console.log('Generated key pair:');
console.log('  Public Key:', keyPair.publicKey.slice(0, 40) + '...');
console.log('  Private Key:', keyPair.privateKey.slice(0, 40) + '...');

const sm2Plaintext = 'Hello, SM2!';
const encryptedSM2 = sm2Encrypt(keyPair.publicKey, sm2Plaintext, SM2CipherMode.C1C3C2);
console.log('SM2 Encrypted:', encryptedSM2.slice(0, 40) + '...');
const decryptedSM2 = sm2Decrypt(keyPair.privateKey, encryptedSM2, SM2CipherMode.C1C3C2);
console.log('SM2 Decrypted:', decryptedSM2);

const message = 'Message to sign';
const signature = sign(keyPair.privateKey, message, { userId: DEFAULT_USER_ID });
console.log('SM2 Signature:', signature.slice(0, 40) + '...');
const isValid = verify(keyPair.publicKey, message, signature, { userId: DEFAULT_USER_ID });
console.log('Signature Valid:', isValid);
console.log();

// SM2 Object-Oriented API Examples
console.log('--- SM2 Elliptic Curve (OOP API) ---');
const sm2 = SM2.generateKeyPair();
console.log('SM2 generated key pair:');
console.log('  Public Key:', sm2.getPublicKey().slice(0, 40) + '...');
console.log('  Private Key:', sm2.getPrivateKey().slice(0, 40) + '...');

const encrypted3 = sm2.encrypt('Hello, SM2 OOP!');
console.log('SM2 Encrypted:', encrypted3.slice(0, 40) + '...');
const decrypted3 = sm2.decrypt(encrypted3);
console.log('SM2 Decrypted:', decrypted3);

const signature2 = sm2.sign('Message to sign');
console.log('SM2 Signature:', signature2.slice(0, 40) + '...');
const isValid2 = sm2.verify('Message to sign', signature2);
console.log('SM2 Signature Valid:', isValid2);
console.log();

// ZUC Functional API Examples
console.log('--- ZUC Stream Cipher (Functional API) ---');
const zucKey = '00112233445566778899aabbccddeeff';
const zucIv = 'ffeeddccbbaa99887766554433221100';
const zucPlaintext = 'Hello, ZUC!';

// 加密
const encryptedZUC = zucEncrypt(zucKey, zucIv, zucPlaintext);
console.log('ZUC Encrypted:', encryptedZUC.slice(0, 40) + '...');

// 解密
const decryptedZUC = zucDecrypt(zucKey, zucIv, encryptedZUC);
console.log('ZUC Decrypted:', decryptedZUC);

// 生成密钥流
const keystream = zucKeystream(zucKey, zucIv, 4); // 生成 4 个 32 位字
console.log('ZUC Keystream (4 words):', keystream.slice(0, 40) + '...');

// EEA3 - 3GPP LTE 加密算法
const count = 0x12345678;
const bearer = 5;
const direction = 0;
const keystreamLength = 256;
const eea3Keystream = eea3(zucKey, count, bearer, direction, keystreamLength);
console.log('EEA3 Keystream:', eea3Keystream.slice(0, 40) + '...');

// EIA3 - 3GPP LTE 完整性算法
const zucMessage = 'Message to authenticate';
const macValue = eia3(zucKey, count, bearer, direction, zucMessage);
console.log('EIA3 MAC:', macValue);
console.log();

// ZUC Object-Oriented API Examples
console.log('--- ZUC Stream Cipher (OOP API) ---');
const zucInstance = new ZUC(zucKey, zucIv);
const encrypted4 = zucInstance.encrypt('Hello, ZUC OOP!');
console.log('ZUC Encrypted:', encrypted4.slice(0, 40) + '...');
const decrypted4 = zucInstance.decrypt(encrypted4);
console.log('ZUC Decrypted:', decrypted4);
console.log();

// SHA Functional API Examples
console.log('--- SHA Hash Algorithms (Functional API) ---');
const shaData = 'Hello, World!';

// SHA-256
const hash256 = sha256(shaData);
console.log('SHA-256:', hash256);

// SHA-384
const hash384 = sha384(shaData);
console.log('SHA-384:', hash384);

// SHA-512
const hash512 = sha512(shaData);
console.log('SHA-512:', hash512);

// HMAC-SHA256
const hmacKey = 'secret-key';
const mac256 = hmacSha256(hmacKey, shaData);
console.log('HMAC-SHA256:', mac256);
console.log();

// SHA Object-Oriented API Examples
console.log('--- SHA Hash Algorithms (OOP API) ---');
const sha256Instance = new SHA256();
sha256Instance.update('Hello, ').update('World!');
const hash256OOP = sha256Instance.digest();
console.log('SHA-256 incremental:', hash256OOP);
console.log();

// Output Format Examples
console.log('--- Output Format Examples ---');
// SM3 with Base64 output
const base64Hash = digest('test', { outputFormat: OutputFormat.BASE64 });
console.log('SM3 (Base64):', base64Hash);

// SHA-256 with Base64 output
const base64Hash256 = sha256('test', { outputFormat: OutputFormat.BASE64 });
console.log('SHA-256 (Base64):', base64Hash256);

// ZUC with Base64 output
const encryptedZUCBase64 = zucEncrypt(zucKey, zucIv, 'test', { outputFormat: OutputFormat.BASE64 });
console.log('ZUC Encrypted (Base64):', encryptedZUCBase64);
console.log();

// Utility Examples
console.log('--- Utilities ---');
const hexStr = '48656c6c6f';
const bytes = hexToBytes(hexStr);
console.log('Hex to Bytes:', hexStr, '->', bytes);
const backToHex = bytesToHex(bytes);
console.log('Bytes to Hex:', bytes, '->', backToHex);
console.log();

console.log('=== Examples Complete ===');
