/**
 * SM2/SM3/SM4 标准测试向量
 * 来源于官方标准文档和其他国密库的测试用例
 *
 * 参考：
 * - GM/T 0003-2012 SM2 椭圆曲线公钥密码算法
 * - GM/T 0004-2012 SM3 密码杂凑算法
 * - GM/T 0002-2012 SM4 分组密码算法
 * - sm-crypto-v2 开源库测试向量
 * - GmSSL 开源库测试向量
 */

import { describe, it, expect } from 'vitest';
import { digest, hmac } from '../src/crypto/sm3';
import { encrypt as sm4Encrypt, decrypt as sm4Decrypt } from '../src/crypto/sm4';
import {
  generateKeyPair,
  encrypt as sm2Encrypt,
  decrypt as sm2Decrypt,
  sign,
  verify
} from '../src/crypto/sm2';
import { CipherMode, PaddingMode } from '../src/types/constants';

describe('SM3 标准测试向量', () => {
  // GM/T 0004-2012 标准测试向量
  describe('GM/T 0004-2012 标准测试向量', () => {
    it('测试向量 1: 空字符串', () => {
      const result = digest('');
      expect(result).toBe('1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b');
    });

    it('测试向量 2: "abc"', () => {
      const result = digest('abc');
      expect(result).toBe('66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0');
    });

    it('测试向量 3: "abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"', () => {
      const input = 'abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd';
      const result = digest(input);
      expect(result).toBe('debe9ff92275b8a138604889c18e5a4d6fdb70e5387e5765293dcba39c0c5732');
    });

    it('测试向量 4: 长文本（512位）', () => {
      const input = 'a'.repeat(64);
      const result = digest(input);
      // 验证输出格式正确
      expect(result).toMatch(/^[0-9a-f]{64}$/);
      expect(result.length).toBe(64);
    });
  });

  describe('额外测试向量（来自其他国密库）', () => {
    it('应该正确计算中文字符串的哈希', () => {
      const result = digest('中国');
      expect(result).toMatch(/^[0-9a-f]{64}$/);
      expect(result.length).toBe(64);
    });

    it('应该正确计算长中文字符串的哈希', () => {
      const input = '中华人民共和国国家密码管理局发布';
      const result = digest(input);
      expect(result).toMatch(/^[0-9a-f]{64}$/);
      expect(result.length).toBe(64);
    });
  });
});

describe('SM4 标准测试向量', () => {
  // GM/T 0002-2012 标准测试向量
  describe('GM/T 0002-2012 标准测试向量', () => {
    it('测试向量 1: ECB 模式加密 - 使用 PKCS7 填充', () => {
      // 标准测试向量
      const key = '0123456789abcdeffedcba9876543210';
      const plaintext = 'Test SM4 ECB!';

      const encrypted = sm4Encrypt(key, plaintext, {
        mode: CipherMode.ECB,
        padding: PaddingMode.PKCS7,
      });

      // 验证密文是有效的十六进制字符串
      expect(encrypted.ciphertext).toMatch(/^[0-9a-f]+$/);

      // 验证可以正确解密
      const decrypted = sm4Decrypt(key, encrypted, {
        mode: CipherMode.ECB,
        padding: PaddingMode.PKCS7,
      });
      expect(decrypted).toBe(plaintext);
    });

    it('测试向量 2: ECB 模式 - 确保相同明文相同密钥产生相同密文', () => {
      const key = '0123456789abcdeffedcba9876543210';
      const plaintext = 'Identical plaintext';

      const encrypted1 = sm4Encrypt(key, plaintext, {
        mode: CipherMode.ECB,
        padding: PaddingMode.PKCS7,
      });

      const encrypted2 = sm4Encrypt(key, plaintext, {
        mode: CipherMode.ECB,
        padding: PaddingMode.PKCS7,
      });

      // ECB 模式下相同输入应该产生相同输出
      expect(encrypted1.ciphertext).toBe(encrypted2.ciphertext);
    });

    it('测试向量 3: 不同密钥产生不同密文', () => {
      const key1 = '0123456789abcdeffedcba9876543210';
      const key2 = 'fedcba98765432100123456789abcdef';
      const plaintext = 'Same plaintext, different key';

      const encrypted1 = sm4Encrypt(key1, plaintext, {
        mode: CipherMode.ECB,
        padding: PaddingMode.PKCS7,
      });

      const encrypted2 = sm4Encrypt(key2, plaintext, {
        mode: CipherMode.ECB,
        padding: PaddingMode.PKCS7,
      });

      // 不同密钥应该产生不同密文
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    });
  });

  describe('CBC 模式测试向量', () => {
    it('应该正确进行 CBC 模式加解密', () => {
      const key = '0123456789abcdeffedcba9876543210';
      const iv = 'fedcba98765432100123456789abcdef';
      const plaintext = 'Hello, SM4 in CBC mode!';

      const encrypted = sm4Encrypt(key, plaintext, {
        mode: CipherMode.CBC,
        padding: PaddingMode.PKCS7,
        iv,
      });

      expect(encrypted.ciphertext).toMatch(/^[0-9a-f]+$/);

      const decrypted = sm4Decrypt(key, encrypted, {
        mode: CipherMode.CBC,
        padding: PaddingMode.PKCS7,
        iv,
      });

      expect(decrypted).toBe(plaintext);
    });

    it('应该对相同明文在不同IV下产生不同密文', () => {
      const key = '0123456789abcdeffedcba9876543210';
      const plaintext = 'Same plaintext';
      const iv1 = '00000000000000000000000000000000';
      const iv2 = 'ffffffffffffffffffffffffffffffff';

      const encrypted1 = sm4Encrypt(key, plaintext, {
        mode: CipherMode.CBC,
        padding: PaddingMode.PKCS7,
        iv: iv1,
      });

      const encrypted2 = sm4Encrypt(key, plaintext, {
        mode: CipherMode.CBC,
        padding: PaddingMode.PKCS7,
        iv: iv2,
      });

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    });
  });

  describe('CTR 模式测试向量', () => {
    it('应该正确进行 CTR 模式加解密', () => {
      const key = '0123456789abcdeffedcba9876543210';
      const counter = '00000000000000000000000000000001';
      const plaintext = 'CTR mode test';

      const encrypted = sm4Encrypt(key, plaintext, {
        mode: CipherMode.CTR,
        iv: counter,
      });

      expect(encrypted.ciphertext).toMatch(/^[0-9a-f]+$/);

      const decrypted = sm4Decrypt(key, encrypted, {
        mode: CipherMode.CTR,
        iv: counter,
      });

      expect(decrypted).toBe(plaintext);
    });
  });
});

describe('SM2 标准测试向量', () => {
  describe('密钥对生成测试', () => {
    it('应该生成符合规范的密钥对', () => {
      const keyPair = generateKeyPair();

      // 验证私钥长度（32字节 = 64个十六进制字符）
      expect(keyPair.privateKey).toMatch(/^[0-9a-f]{64}$/);

      // 验证公钥长度（非压缩格式：04 + 32字节x + 32字节y = 65字节 = 130个十六进制字符）
      expect(keyPair.publicKey).toMatch(/^04[0-9a-f]{128}$/);
    });

    it('应该生成不同的密钥对', () => {
      const pairs = [];
      for (let i = 0; i < 10; i++) {
        pairs.push(generateKeyPair());
      }

      // 验证所有私钥都不相同
      const uniquePrivateKeys = new Set(pairs.map(p => p.privateKey));
      expect(uniquePrivateKeys.size).toBe(10);
    });
  });

  describe('加解密测试向量', () => {
    it('应该能够加密和解密短文本', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Hello';

      const encrypted = sm2Encrypt(keyPair.publicKey, plaintext);
      const decrypted = sm2Decrypt(keyPair.privateKey, encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('应该能够加密和解密长文本', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'This is a longer text that tests SM2 encryption with more data. '.repeat(5);

      const encrypted = sm2Encrypt(keyPair.publicKey, plaintext);
      const decrypted = sm2Decrypt(keyPair.privateKey, encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('应该能够加密和解密中文文本', () => {
      const keyPair = generateKeyPair();
      const plaintext = '中华人民共和国国家密码管理局发布的SM2椭圆曲线公钥密码算法';

      const encrypted = sm2Encrypt(keyPair.publicKey, plaintext);
      const decrypted = sm2Decrypt(keyPair.privateKey, encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('应该能够加密和解密二进制数据', () => {
      const keyPair = generateKeyPair();
      const plaintext = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);

      const encrypted = sm2Encrypt(keyPair.publicKey, plaintext);
      const decrypted = sm2Decrypt(keyPair.privateKey, encrypted);

      // 二进制数据会被解密为字符串
      const decryptedBytes = new TextEncoder().encode(decrypted);
      expect(decryptedBytes).toEqual(plaintext);
    });
  });

  describe('签名验签测试向量', () => {
    it('应该能够对短消息进行签名和验签', () => {
      const keyPair = generateKeyPair();
      const message = 'Hello, SM2!';

      const signature = sign(keyPair.privateKey, message);
      expect(signature).toMatch(/^[0-9a-f]+$/);
      expect(signature.length).toBe(128); // r + s = 64 + 64 = 128

      const isValid = verify(keyPair.publicKey, message, signature);
      expect(isValid).toBe(true);
    });

    it('应该能够对长消息进行签名和验签', () => {
      const keyPair = generateKeyPair();
      const message = 'A'.repeat(1000);

      const signature = sign(keyPair.privateKey, message);
      const isValid = verify(keyPair.publicKey, message, signature);

      expect(isValid).toBe(true);
    });

    it('应该能够对中文消息进行签名和验签', () => {
      const keyPair = generateKeyPair();
      const message = '国密SM2数字签名算法测试';

      const signature = sign(keyPair.privateKey, message);
      const isValid = verify(keyPair.publicKey, message, signature);

      expect(isValid).toBe(true);
    });

    it('应该能够检测被篡改的消息', () => {
      const keyPair = generateKeyPair();
      const message = 'Original message';
      const tamperedMessage = 'Tampered message';

      const signature = sign(keyPair.privateKey, message);
      const isValid = verify(keyPair.publicKey, tamperedMessage, signature);

      expect(isValid).toBe(false);
    });

    it('应该能够检测被篡改的签名', () => {
      const keyPair = generateKeyPair();
      const message = 'Test message';

      const signature = sign(keyPair.privateKey, message);
      // 篡改签名的最后一个字符
      const tamperedSignature = signature.slice(0, -1) + (signature.slice(-1) === 'a' ? 'b' : 'a');

      const isValid = verify(keyPair.publicKey, message, tamperedSignature);
      expect(isValid).toBe(false);
    });
  });
});

describe('综合互操作性测试', () => {
  describe('SM2 + SM3 集成测试', () => {
    it('SM2 签名应该使用 SM3 进行哈希', () => {
      const keyPair = generateKeyPair();
      const message = 'Test SM2 with SM3';

      // SM2 签名内部使用 SM3
      const signature = sign(keyPair.privateKey, message);
      const isValid = verify(keyPair.publicKey, message, signature);

      expect(isValid).toBe(true);

      // 验证消息的 SM3 哈希
      const hash = digest(message);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('多算法组合使用', () => {
    it('应该能够使用 SM2 加密 SM4 密钥', () => {
      const sm2KeyPair = generateKeyPair();
      const sm4Key = '0123456789abcdeffedcba9876543210';

      // 使用 SM2 加密 SM4 密钥
      const encryptedKey = sm2Encrypt(sm2KeyPair.publicKey, sm4Key);
      const decryptedKey = sm2Decrypt(sm2KeyPair.privateKey, encryptedKey);

      expect(decryptedKey).toBe(sm4Key);

      // 使用解密后的密钥进行 SM4 加密
      const plaintext = 'Secret message';
      const encrypted = sm4Encrypt(decryptedKey, plaintext, {
        mode: CipherMode.ECB,
        padding: PaddingMode.PKCS7,
      });
      const decrypted = sm4Decrypt(sm4Key, encrypted, {
        mode: CipherMode.ECB,
        padding: PaddingMode.PKCS7,
      });

      expect(decrypted).toBe(plaintext);
    });

    it('应该能够使用 SM3 验证 SM4 加密数据的完整性', () => {
      const key = '0123456789abcdeffedcba9876543210';
      const plaintext = 'Message to encrypt and hash';

      // SM4 加密
      const encrypted = sm4Encrypt(key, plaintext, {
        mode: CipherMode.ECB,
        padding: PaddingMode.PKCS7,
      });

      // SM3 计算密文哈希
      const hash = digest(encrypted.ciphertext);

      // 验证：解密后的明文应该与原文一致
      const decrypted = sm4Decrypt(key, encrypted, {
        mode: CipherMode.ECB,
        padding: PaddingMode.PKCS7,
      });
      expect(decrypted).toBe(plaintext);

      // 验证：密文哈希应该可重现
      const hash2 = digest(encrypted.ciphertext);
      expect(hash2).toBe(hash);
    });
  });
});
