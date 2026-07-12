import { describe, it, expect } from 'vitest';
import {
  sm2Encrypt,
  sm2Decrypt,
  sm2GenerateKeyPair,
  sm4Encrypt,
  sm4Decrypt,
  zucEncrypt,
  zucDecrypt,
  OutputFormat,
  SM2CipherMode,
  InputFormat,
  CipherMode,
  PaddingMode
} from '../src/index';

describe('输出格式一致性测试 (Output Format Consistency Tests)', () => {
  describe('SM4 输出格式', () => {
    const key = '0123456789abcdeffedcba9876543210';
    const plaintext = 'Hello, SM4!';
    const ecbOptions = { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 };

    it('应该支持 hex 格式输出（默认）', () => {
      const encrypted = sm4Encrypt(key, plaintext, ecbOptions);
      expect(typeof encrypted).toBe('object');
      expect(encrypted.ciphertext).toMatch(/^[0-9a-f]+$/);
    });

    it('应该支持 base64 格式输出', () => {
      const encrypted = sm4Encrypt(key, plaintext, { ...ecbOptions, outputFormat: OutputFormat.BASE64 });
      expect(typeof encrypted).toBe('object');
      expect(encrypted.ciphertext).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(encrypted.ciphertext).not.toMatch(/^[0-9a-f]+$/);
    });

    it('应该能够解密 hex 格式的密文', () => {
      const encrypted = sm4Encrypt(key, plaintext, ecbOptions);
      const decrypted = sm4Decrypt(key, encrypted, ecbOptions);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够解密 base64 格式的密文', () => {
      const encrypted = sm4Encrypt(key, plaintext, { ...ecbOptions, outputFormat: OutputFormat.BASE64 });
      const decrypted = sm4Decrypt(key, encrypted, ecbOptions);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够自动识别 base64 字符串密文', () => {
      const encrypted = sm4Encrypt(key, plaintext, { ...ecbOptions, outputFormat: OutputFormat.BASE64 });
      const decrypted = sm4Decrypt(key, encrypted.ciphertext, ecbOptions);
      expect(decrypted).toBe(plaintext);
    });

    it('CBC 模式应该支持 base64 输出', () => {
      const iv = 'fedcba98765432100123456789abcdef';
      const encrypted = sm4Encrypt(key, plaintext, {
        mode: CipherMode.CBC,
        iv,
        outputFormat: OutputFormat.BASE64
      });
      expect(encrypted.ciphertext).toMatch(/^[A-Za-z0-9+/]+=*$/);

      const decrypted = sm4Decrypt(key, encrypted, {
        mode: CipherMode.CBC,
        iv
      });
      expect(decrypted).toBe(plaintext);
    });

    it('CCM 模式应该支持 base64 输出与自动识别解密', () => {
      const nonce = '00112233445566778899aabb';
      const aad = 'ccm-aad';
      const encrypted = sm4Encrypt(key, plaintext, {
        mode: CipherMode.CCM,
        iv: nonce,
        aad,
        outputFormat: OutputFormat.BASE64
      });

      expect(encrypted.ciphertext).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(encrypted.tag).toMatch(/^[A-Za-z0-9+/]+=*$/);

      const decrypted = sm4Decrypt(key, encrypted, {
        mode: CipherMode.CCM,
        iv: nonce,
        aad
      });
      expect(decrypted).toBe(plaintext);
    });

    it('CCM 模式应支持 ciphertext/tag 字符串自动识别', () => {
      const nonce = '00112233445566778899aabb';
      const aad = 'ccm-aad';
      const encrypted = sm4Encrypt(key, plaintext, {
        mode: CipherMode.CCM,
        iv: nonce,
        aad,
        outputFormat: OutputFormat.BASE64
      });

      const decrypted = sm4Decrypt(key, encrypted.ciphertext, {
        mode: CipherMode.CCM,
        iv: nonce,
        aad,
        tag: encrypted.tag
      });
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('SM2 输出格式', () => {
    const keyPair = sm2GenerateKeyPair();
    const plaintext = 'Hello, SM2!';

    it('应该支持 hex 格式输出（默认）', () => {
      const encrypted = sm2Encrypt(keyPair.publicKey, plaintext);
      expect(typeof encrypted).toBe('string');
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
    });

    it('应该支持 base64 格式输出', () => {
      const encrypted = sm2Encrypt(keyPair.publicKey, plaintext, {
        outputFormat: OutputFormat.BASE64
      });
      expect(typeof encrypted).toBe('string');
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(encrypted).not.toMatch(/^[0-9a-f]+$/);
    });

    it('应该能够解密 hex 格式的密文', () => {
      const encrypted = sm2Encrypt(keyPair.publicKey, plaintext);
      const decrypted = sm2Decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够解密 base64 格式的密文', () => {
      const encrypted = sm2Encrypt(keyPair.publicKey, plaintext, {
        outputFormat: OutputFormat.BASE64
      });
      const decrypted = sm2Decrypt(keyPair.privateKey, encrypted, { inputFormat: InputFormat.BASE64 });
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够自动识别 base64 格式的密文', () => {
      const encrypted = sm2Encrypt(keyPair.publicKey, plaintext, {
        outputFormat: OutputFormat.BASE64
      });
      const decrypted = sm2Decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('应该支持通过选项指定模式', () => {
      const encrypted = sm2Encrypt(keyPair.publicKey, plaintext, { mode: SM2CipherMode.C1C3C2 });
      const decrypted = sm2Decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('ZUC 输出格式', () => {
    const key = '00000000000000000000000000000000';
    const iv = '00000000000000000000000000000000';
    const plaintext = 'Hello, ZUC!';

    it('应该支持 hex 格式输出（默认）', () => {
      const encrypted = zucEncrypt(key, iv, plaintext);
      expect(typeof encrypted).toBe('string');
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
    });

    it('应该支持 base64 格式输出', () => {
      const encrypted = zucEncrypt(key, iv, plaintext, {
        outputFormat: OutputFormat.BASE64
      });
      expect(typeof encrypted).toBe('string');
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(encrypted).not.toMatch(/^[0-9a-f]+$/);
    });

    it('应该能够解密 hex 格式的密文', () => {
      const encrypted = zucEncrypt(key, iv, plaintext);
      const decrypted = zucDecrypt(key, iv, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够解密 base64 格式的密文', () => {
      const encrypted = zucEncrypt(key, iv, plaintext, {
        outputFormat: OutputFormat.BASE64
      });
      const decrypted = zucDecrypt(key, iv, encrypted, { inputFormat: InputFormat.BASE64 });
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够自动识别 base64 格式的密文', () => {
      const encrypted = zucEncrypt(key, iv, plaintext, {
        outputFormat: OutputFormat.BASE64
      });
      const decrypted = zucDecrypt(key, iv, encrypted);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('PKCS7/PKCS5 填充等价性说明', () => {
    it('PKCS7 填充应该能正常工作（与 Java PKCS5 等价）', () => {
      const key = '0123456789abcdeffedcba9876543210';
      const plaintext = 'Test';

      // PKCS7 是 PKCS5 的通用版本
      // 对于 8 字节块（如 DES）：PKCS5 和 PKCS7 相同
      // 对于 16 字节块（如 AES、SM4）：只能使用 PKCS7
      // JavaScript 中的 PKCS7 等同于 Java 中的 PKCS5Padding
      const encrypted = sm4Encrypt(key, plaintext, {
        mode: CipherMode.ECB,
        padding: PaddingMode.PKCS7
      });

      const decrypted = sm4Decrypt(key, encrypted, {
        mode: CipherMode.ECB,
        padding: PaddingMode.PKCS7
      });

      expect(decrypted).toBe(plaintext);
    });
  });
});
