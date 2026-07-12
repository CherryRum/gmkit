import { describe, it, expect } from 'vitest';
import {
  zucEncrypt,
  zucDecrypt,
  zucDecryptBytes,
  zucKeystream,
  zucKeystreamWords,
  eea3,
  eea3Encrypt,
  eia3,
  zucGenerateKeystream,
} from '../src/index';
import { hexToBytes } from '../src/core/utils';

describe('ZUC 流密码测试', () => {
  describe('基本加密和解密', () => {
    it('应该能够正确加密和解密数据', () => {
      const key = '00000000000000000000000000000000';
      const iv = '00000000000000000000000000000000';
      const plaintext = 'Hello, ZUC!';

      const ciphertext = zucEncrypt(key, iv, plaintext);
      expect(ciphertext).toBeTruthy();
      expect(ciphertext).toMatch(/^[0-9a-f]+$/);

      const decrypted = zucDecrypt(key, iv, ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够处理空明文', () => {
      const key = '00000000000000000000000000000000';
      const iv = '00000000000000000000000000000000';
      const plaintext = '';

      const ciphertext = zucEncrypt(key, iv, plaintext);
      expect(ciphertext).toBe('');

      const decrypted = zucDecrypt(key, iv, ciphertext);
      expect(decrypted).toBe('');
    });

    it('应该能够处理中文文本', () => {
      const key = '00112233445566778899aabbccddeeff';
      const iv = 'ffeeddccbbaa99887766554433221100';
      const plaintext = '你好，祖冲之算法！';

      const ciphertext = zucEncrypt(key, iv, plaintext);
      const decrypted = zucDecrypt(key, iv, ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够处理长文本', () => {
      const key = 'ffffffffffffffffffffffffffffffff';
      const iv = '00000000000000000000000000000000';
      const plaintext = 'The quick brown fox jumps over the lazy dog. '.repeat(10);

      const ciphertext = zucEncrypt(key, iv, plaintext);
      const decrypted = zucDecrypt(key, iv, ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it('应该接受 Uint8Array 密钥和 IV', () => {
      const key = new Uint8Array(16).fill(0);
      const iv = new Uint8Array(16).fill(1);
      const plaintext = 'Test with Uint8Array';

      const ciphertext = zucEncrypt(key, iv, plaintext);
      const decrypted = zucDecrypt(key, iv, ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it('应该接受 Uint8Array 明文', () => {
      const key = '12345678901234567890123456789012';
      const iv = '09876543210987654321098765432109';
      const plaintext = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"

      const ciphertext = zucEncrypt(key, iv, plaintext);
      const decrypted = zucDecrypt(key, iv, ciphertext);
      expect(decrypted).toBe('Hello');
    });
  });

  describe('密钥流生成', () => {
    it('应该生成指定长度的密钥流', () => {
      const key = '00000000000000000000000000000000';
      const iv = '00000000000000000000000000000000';
      const length = 16; // 16 bytes = 32 hex chars

      const keystream = zucKeystream(key, iv, length);
      expect(keystream).toHaveLength(length * 2); // hex chars per byte
      expect(keystream).toMatch(/^[0-9a-f]+$/);
    });

    it('不同的密钥应该生成不同的密钥流', () => {
      const key1 = '00000000000000000000000000000000';
      const key2 = 'ffffffffffffffffffffffffffffffff';
      const iv = '00000000000000000000000000000000';

      const keystream1 = zucKeystream(key1, iv, 16);
      const keystream2 = zucKeystream(key2, iv, 16);
      expect(keystream1).not.toBe(keystream2);
    });

    it('不同的 IV 应该生成不同的密钥流', () => {
      const key = '00000000000000000000000000000000';
      const iv1 = '00000000000000000000000000000000';
      const iv2 = 'ffffffffffffffffffffffffffffffff';

      const keystream1 = zucKeystream(key, iv1, 16);
      const keystream2 = zucKeystream(key, iv2, 16);
      expect(keystream1).not.toBe(keystream2);
    });

    it('相同的密钥和 IV 应该生成一致的密钥流', () => {
      const key = 'abcdef0123456789abcdef0123456789';
      const iv = '123456789abcdef0123456789abcdef0';

      const keystream1 = zucKeystream(key, iv, 32);
      const keystream2 = zucKeystream(key, iv, 32);
      expect(keystream1).toBe(keystream2);
    });
  });

  describe('项目固定向量', () => {
    it('should match the project all-zero keystream vector', () => {
      const key = '00000000000000000000000000000000';
      const iv = '00000000000000000000000000000000';

      const keystream = zucGenerateKeystream(key, iv, 2);

      expect(keystream[0]).toBe(0x27bede74);
      expect(keystream[1]).toBe(0x018082da);
      expect(zucKeystreamWords(key, iv, 2)).toBe('27bede74018082da');
    });

    it('should match the Java-aligned project keystream vector', () => {
      const key = '00112233445566778899aabbccddeeff';
      const iv = 'ffeeddccbbaa99887766554433221100';

      expect(zucKeystream(key, iv, 32)).toBe('deeb81e388e6bbad1c44b2bbf56776644a80953ad9005380ec8d392fb3a1548b');
    });

    it('should match the project EEA3/EIA3 vectors', () => {
      const key = '00112233445566778899aabbccddeeff';

      expect(eea3(key, 0x398a59b4, 0x15, 1, 96)).toBe('ace6d69c177966fcc92ef61c');
      expect(eia3(key, 0x398a59b4, 0x15, 1, '中文 + emoji 😊 + English + 123')).toBe('09f9b184');
    });

    it('should match the official EIA3 1-bit vector', () => {
      const key = '00000000000000000000000000000000';
      expect(eia3(key, 0, 0, 0, new Uint8Array([0]), 1)).toBe('c8a9595e');
    });

    it('should match the 3GPP EEA3 800-bit vector', () => {
      const message = hexToBytes(
        '14a8ef693d678507bbe7270a7f67ff5006c3525b9807e467c4e56000ba338f5d' +
        '429559036751822246c80d3b38f07f4be2d8ff5805f5132229bde93bbbdcaf38' +
        '2bf1ee972fbf9977bada8945847a2a6c9ad34a667554e04d1f7fa2c33241bd8f' +
        '01ba220d'
      );

      expect(eea3Encrypt('e5bd3ea0eb55ade866c6ac58bd54302a', 0x00056823, 0x18, 1, message, 800)).toBe(
        '131d43e0dea1be5c5a1bfd971d852cbf712d7b4f57961fea3208afa8bca433f' +
        '456ad09c7417e58bc69cf8866d1353f74865e80781d202dfb3ecff7fcbc3b190' +
        'fe82a204ed0e350fc0f6f2613b2f2bca6df5a473a57a4a00d985ebad880d6f2' +
        '3864a07b01'
      );
    });

    it('should match EIA3 vectors across word boundaries and direction bits', () => {
      expect(eia3(
        '000102030405060708090a0b0c0d0e0f',
        0x01234567,
        0x0a,
        0,
        hexToBytes('5bad724710ba1c56'),
        64
      )).toBe('1b3d0f74');

      expect(eia3(
        'c9e6cec4607c72db000aefa88385ab0a',
        0xa94059da,
        0x0a,
        1,
        hexToBytes(
          '983b41d47d780c9e1ad11d7eb70391b1de0b35da2dc62f83e7b78d6306ca0ea0' +
          '7e941b7be91348f9fcb170e2217fecd97f9f68adb16e5d7d21e569d2'
        ),
        480
      )).toBe('395c1192');
    });

    it('should preserve arbitrary binary plaintext through decryptBytes', () => {
      const key = '00112233445566778899aabbccddeeff';
      const iv = 'ffeeddccbbaa99887766554433221100';
      const plaintext = hexToBytes('00ff800041c328');
      const ciphertext = zucEncrypt(key, iv, plaintext);

      expect(zucDecryptBytes(key, iv, ciphertext)).toEqual(plaintext);
    });

    it('should reject truncated hex parameters and invalid lengths', () => {
      expect(() => zucKeystream('0000000000000000000000000000000', '0'.repeat(32), 1)).toThrow(
        'exactly 32 hexadecimal characters'
      );
      expect(() => zucKeystream('0'.repeat(32), '0'.repeat(32), -1)).toThrow('non-negative safe integer');
      expect(() => eea3('0'.repeat(32), -1, 0, 0, 32)).toThrow('unsigned 32-bit integer');
      expect(() => eia3('0'.repeat(32), 0, 0, 0, new Uint8Array([0]), 9)).toThrow(
        'must not exceed message length'
      );
    });
  });

  describe('EEA3 - LTE 加密算法', () => {
    it('应该生成 EEA3 密钥流', () => {
      const key = '00000000000000000000000000000000';
      const count = 0;
      const bearer = 0;
      const direction = 0;
      const length = 128; // bits

      const keystream = eea3(key, count, bearer, direction, length);
      expect(keystream).toBeTruthy();
      expect(keystream).toMatch(/^[0-9a-f]+$/);
    });

    it('不同的计数值应该生成不同的密钥流', () => {
      const key = '00112233445566778899aabbccddeeff';
      const bearer = 5;
      const direction = 0;
      const length = 256;

      const keystream1 = eea3(key, 0, bearer, direction, length);
      const keystream2 = eea3(key, 1, bearer, direction, length);
      expect(keystream1).not.toBe(keystream2);
    });

    it('不同的承载值应该生成不同的密钥流', () => {
      const key = 'ffeeddccbbaa99887766554433221100';
      const count = 100;
      const direction = 1;
      const length = 192;

      const keystream1 = eea3(key, count, 0, direction, length);
      const keystream2 = eea3(key, count, 15, direction, length);
      expect(keystream1).not.toBe(keystream2);
    });

    it('不同的方向应该生成不同的密钥流', () => {
      const key = 'abcdef0123456789abcdef0123456789';
      const count = 50;
      const bearer = 10;
      const length = 512;

      const keystream1 = eea3(key, count, bearer, 0, length);
      const keystream2 = eea3(key, count, bearer, 1, length);
      expect(keystream1).not.toBe(keystream2);
    });
  });

  describe('EIA3 - LTE 完整性算法', () => {
    it('应该生成 EIA3 MAC', () => {
      const key = '00000000000000000000000000000000';
      const count = 0;
      const bearer = 0;
      const direction = 0;
      const message = 'Hello, EIA3!';

      const mac = eia3(key, count, bearer, direction, message);
      expect(mac).toBeTruthy();
      expect(mac).toMatch(/^[0-9a-f]{8}$/); // 32-bit MAC = 8 hex chars
    });

    it('相同的输入应该生成相同的 MAC', () => {
      const key = '00112233445566778899aabbccddeeff';
      const count = 100;
      const bearer = 5;
      const direction = 1;
      const message = 'Test message for integrity protection';

      const mac1 = eia3(key, count, bearer, direction, message);
      const mac2 = eia3(key, count, bearer, direction, message);
      expect(mac1).toBe(mac2);
    });

    it('不同的消息应该生成不同的 MAC', () => {
      const key = 'ffeeddccbbaa99887766554433221100';
      const count = 200;
      const bearer = 10;
      const direction = 0;

      const mac1 = eia3(key, count, bearer, direction, 'Message 1');
      const mac2 = eia3(key, count, bearer, direction, 'Message 2');
      expect(mac1).not.toBe(mac2);
    });

    it('不同的计数值应该生成不同的 MAC', () => {
      const key = '123456789abcdef0123456789abcdef0';
      const bearer = 3;
      const direction = 1;
      const message = 'Same message';

      const mac1 = eia3(key, 0, bearer, direction, message);
      const mac2 = eia3(key, 1, bearer, direction, message);
      expect(mac1).not.toBe(mac2);
    });

    it('应该接受 Uint8Array 消息', () => {
      const key = 'abcdef0123456789abcdef0123456789';
      const count = 50;
      const bearer = 7;
      const direction = 0;
      const message = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"

      const mac = eia3(key, count, bearer, direction, message);
      expect(mac).toMatch(/^[0-9a-f]{8}$/);
    });
  });

  describe('错误处理', () => {
    it('无效的密钥长度应该抛出错误', () => {
      const key = '0011223344556677'; // Only 8 bytes
      const iv = '00000000000000000000000000000000';
      const plaintext = 'Test';

      expect(() => zucEncrypt(key, iv, plaintext)).toThrow('Key must be 16 bytes');
    });

    it('无效的 IV 长度应该抛出错误', () => {
      const key = '00112233445566778899aabbccddeeff';
      const iv = '0011223344556677'; // Only 8 bytes
      const plaintext = 'Test';

      expect(() => zucEncrypt(key, iv, plaintext)).toThrow('IV must be 16 bytes');
    });
  });

  describe('流密码特性', () => {
    it('应该是对称的（加密 = 解密）', () => {
      const key = '00112233445566778899aabbccddeeff';
      const iv = 'ffeeddccbbaa99887766554433221100';
      const plaintext = 'Stream cipher test';

      const ciphertext = zucEncrypt(key, iv, plaintext);
      const decrypted1 = zucDecrypt(key, iv, ciphertext);

      // Verify decryption works
      expect(decrypted1).toBe(plaintext);

      // Encrypt again with same key/iv should give same ciphertext
      const ciphertext2 = zucEncrypt(key, iv, plaintext);
      expect(ciphertext2).toBe(ciphertext);
    });

    it('不同的明文应该产生不同的密文', () => {
      const key = 'ffffffffffffffffffffffffffffffff';
      const iv = '00000000000000000000000000000000';

      const ciphertext1 = zucEncrypt(key, iv, 'Message 1');
      const ciphertext2 = zucEncrypt(key, iv, 'Message 2');
      expect(ciphertext1).not.toBe(ciphertext2);
    });

    it('应该能够正确处理二进制数据', () => {
      const key = '12345678901234567890123456789012';
      const iv = '09876543210987654321098765432109';
      const binaryData = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        binaryData[i] = i;
      }

      const ciphertext = zucEncrypt(key, iv, binaryData);
      expect(ciphertext).toBeTruthy();
      expect(ciphertext.length).toBe(256 * 2); // 256 bytes = 512 hex chars
    });
  });

  describe('边界情况', () => {
    it('应该能够处理全零密钥和 IV', () => {
      const key = '00000000000000000000000000000000';
      const iv = '00000000000000000000000000000000';
      const plaintext = 'Edge case test';

      const ciphertext = zucEncrypt(key, iv, plaintext);
      const decrypted = zucDecrypt(key, iv, ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够处理全一密钥和 IV', () => {
      const key = 'ffffffffffffffffffffffffffffffff';
      const iv = 'ffffffffffffffffffffffffffffffff';
      const plaintext = 'Another edge case';

      const ciphertext = zucEncrypt(key, iv, plaintext);
      const decrypted = zucDecrypt(key, iv, ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够处理单字节明文', () => {
      const key = 'abcdef0123456789abcdef0123456789';
      const iv = '123456789abcdef0123456789abcdef0';
      const plaintext = 'A';

      const ciphertext = zucEncrypt(key, iv, plaintext);
      expect(ciphertext).toHaveLength(2); // 1 byte = 2 hex chars

      const decrypted = zucDecrypt(key, iv, ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够处理最大承载值 (31)', () => {
      const key = '00112233445566778899aabbccddeeff';
      const count = 0;
      const bearer = 31; // Maximum 5-bit value
      const direction = 0;
      const length = 128;

      const keystream = eea3(key, count, bearer, direction, length);
      expect(keystream).toBeTruthy();
    });
  });
});
