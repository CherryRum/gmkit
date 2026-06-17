import { describe, it, expect } from 'vitest';
import { digest } from '../src/crypto/sm3';
import { sha256 } from '../src/crypto/sha';
import { encrypt as sm4Encrypt, decrypt as sm4Decrypt } from '../src/crypto/sm4';
import { generateKeyPair, sign, verify } from '../src/crypto/sm2';
import { CipherMode, PaddingMode } from '../src/types/constants';

/**
 * 密码学属性测试
 * 测试加密算法应该具备的基本密码学性质
 */
describe('密码学属性测试', () => {
  describe('哈希函数属性', () => {
    describe('确定性 (Deterministic)', () => {
      it('相同输入应该产生相同输出 - SM3', () => {
        const input = 'test message';
        const hash1 = digest(input);
        const hash2 = digest(input);
        expect(hash1).toBe(hash2);
      });

      it('相同输入应该产生相同输出 - SHA256', () => {
        const input = 'test message';
        const hash1 = sha256(input);
        const hash2 = sha256(input);
        expect(hash1).toBe(hash2);
      });

      // 参数化测试：多个输入
      const testInputs = [
        '',
        'a',
        'hello',
        'The quick brown fox jumps over the lazy dog',
        '中文测试',
        '🎉🚀',
        'A'.repeat(1000),
      ];

      testInputs.forEach((input) => {
        it(`SM3 对输入"${input.substring(0, 20)}..."应保持确定性`, () => {
          const hash1 = digest(input);
          const hash2 = digest(input);
          expect(hash1).toBe(hash2);
        });
      });
    });

    describe('雪崩效应 (Avalanche Effect)', () => {
      it('输入微小变化应导致输出巨大变化 - SM3', () => {
        const input1 = 'test message';
        const input2 = 'test messag_'; // 最后一个字符不同
        
        const hash1 = digest(input1);
        const hash2 = digest(input2);
        
        expect(hash1).not.toBe(hash2);
        
        // 计算汉明距离（不同位数）
        const hammingDistance = calculateHammingDistance(hash1, hash2);
        
        // 好的哈希函数应该有约50%的位不同
        // 64个字符 * 4位/字符 = 256位，期望约128位不同
        expect(hammingDistance).toBeGreaterThan(64); // 至少25%不同
        expect(hammingDistance).toBeLessThan(192); // 至多75%不同
      });

      it('单比特变化应导致约50%输出位变化 - SM3', () => {
        const tests = [
          ['hello', 'iello'], // 第一个字符变化
          ['hello', 'hallo'], // 中间字符变化
          ['hello', 'helln'], // 最后字符变化
        ];

        for (const [input1, input2] of tests) {
          const hash1 = digest(input1);
          const hash2 = digest(input2);
          const distance = calculateHammingDistance(hash1, hash2);
          
          // 应该有显著差异
          expect(distance).toBeGreaterThan(50);
        }
      });
    });

    describe('抗碰撞性 (Collision Resistance)', () => {
      it('不同输入应该产生不同哈希 - 基本测试', () => {
        const hashes = new Set<string>();
        const inputs = ['a', 'b', 'c', 'aa', 'ab', 'ba', 'abc', 'bac', 'cab'];
        
        for (const input of inputs) {
          const hash = digest(input);
          expect(hashes.has(hash)).toBe(false);
          hashes.add(hash);
        }
        
        expect(hashes.size).toBe(inputs.length);
      });

      it('随机输入应该产生唯一哈希', () => {
        const hashes = new Set<string>();
        const count = 1000;
        
        for (let i = 0; i < count; i++) {
          const randomInput = Math.random().toString(36) + Date.now() + i;
          const hash = digest(randomInput);
          expect(hashes.has(hash)).toBe(false);
          hashes.add(hash);
        }
        
        expect(hashes.size).toBe(count);
      });
    });

    describe('输出长度固定性', () => {
      const testCases = [
        { name: 'empty', input: '' },
        { name: 'short', input: 'a' },
        { name: 'medium', input: 'hello world' },
        { name: 'long', input: 'x'.repeat(10000) },
        { name: 'unicode', input: '你好世界🌍' },
      ];

      testCases.forEach(({ name, input }) => {
        it(`SM3 输出长度应为64字符 - ${name}`, () => {
          const hash = digest(input);
          expect(hash).toHaveLength(64);
          expect(hash).toMatch(/^[0-9a-f]{64}$/);
        });

        it(`SHA256 输出长度应为64字符 - ${name}`, () => {
          const hash = sha256(input);
          expect(hash).toHaveLength(64);
          expect(hash).toMatch(/^[0-9a-f]{64}$/);
        });
      });
    });
  });

  describe('对称加密属性', () => {
    const key = '0123456789abcdeffedcba9876543210';

    describe('加解密正确性', () => {
      const plaintexts = [
        '',
        'a',
        'Hello, World!',
        '中文测试数据',
        '🎉🚀🌍',
        'A'.repeat(16), // 正好一个分组
        'B'.repeat(17), // 超过一个分组
        'C'.repeat(100), // 多个分组
      ];

      const modes = [
        { mode: CipherMode.ECB, name: 'ECB' },
        { mode: CipherMode.CBC, name: 'CBC', iv: 'fedcba98765432100123456789abcdef' },
        { mode: CipherMode.CTR, name: 'CTR', iv: 'fedcba98765432100123456789abcdef' },
      ];

      modes.forEach(({ mode, name, iv }) => {
        plaintexts.forEach((plaintext, idx) => {
          it(`SM4 ${name}模式 加解密往返应保持数据完整性 - case ${idx}`, () => {
            const options: any = { mode, padding: PaddingMode.PKCS7 };
            if (iv) options.iv = iv;

            const encrypted = sm4Encrypt(key, plaintext, options);
            const decrypted = sm4Decrypt(key, encrypted, options);
            
            expect(decrypted).toBe(plaintext);
          });
        });
      });
    });

    describe('语义安全性 (Semantic Security)', () => {
      it('相同明文在不同模式下应产生不同密文', () => {
        const plaintext = 'test data';
        const iv = 'fedcba98765432100123456789abcdef';

        const ecbCipher = sm4Encrypt(key, plaintext, { 
          mode: CipherMode.ECB, 
          padding: PaddingMode.PKCS7 
        });

        const cbcCipher = sm4Encrypt(key, plaintext, { 
          mode: CipherMode.CBC, 
          padding: PaddingMode.PKCS7, 
          iv 
        });

        expect(ecbCipher.ciphertext).not.toBe(cbcCipher.ciphertext);
      });

      it('ECB模式：相同明文分组产生相同密文分组', () => {
        // ECB模式的已知弱点
        const plaintext = 'aaaaaaaaaaaaaaaa' + 'aaaaaaaaaaaaaaaa'; // 两个相同分组
        const encrypted = sm4Encrypt(key, plaintext, { 
          mode: CipherMode.ECB, 
          padding: PaddingMode.NONE 
        });

        // 前16字节和后16字节的密文应该相同（ECB特性）
        const firstBlock = encrypted.ciphertext.substring(0, 32);
        const secondBlock = encrypted.ciphertext.substring(32, 64);
        expect(firstBlock).toBe(secondBlock);
      });

      it('CBC模式：相同明文分组产生不同密文分组', () => {
        // CBC模式应该更安全
        const iv = 'fedcba98765432100123456789abcdef';
        const plaintext = 'aaaaaaaaaaaaaaaa' + 'aaaaaaaaaaaaaaaa'; // 两个相同分组
        const encrypted = sm4Encrypt(key, plaintext, { 
          mode: CipherMode.CBC, 
          padding: PaddingMode.NONE, 
          iv 
        });

        // 前16字节和后16字节的密文应该不同（CBC特性）
        const firstBlock = encrypted.ciphertext.substring(0, 32);
        const secondBlock = encrypted.ciphertext.substring(32, 64);
        expect(firstBlock).not.toBe(secondBlock);
      });
    });

    describe('密文不可预测性', () => {
      it('多次加密相同数据在ECB模式下应产生相同密文', () => {
        const plaintext = 'consistent data';
        const cipher1 = sm4Encrypt(key, plaintext, { 
          mode: CipherMode.ECB, 
          padding: PaddingMode.PKCS7 
        });
        const cipher2 = sm4Encrypt(key, plaintext, { 
          mode: CipherMode.ECB, 
          padding: PaddingMode.PKCS7 
        });

        expect(cipher1.ciphertext).toBe(cipher2.ciphertext); // ECB是确定性的
      });

      it('密文应该看起来随机（统计测试）', () => {
        const plaintext = 'test data for randomness';
        const encrypted = sm4Encrypt(key, plaintext, { 
          mode: CipherMode.ECB, 
          padding: PaddingMode.PKCS7 
        });

        // 检查密文的字符分布
        const charCounts = new Map<string, number>();
        for (const char of encrypted.ciphertext) {
          charCounts.set(char, (charCounts.get(char) || 0) + 1);
        }

        // 16进制字符应该相对均匀分布（不应该某个字符出现过多）
        const maxCount = Math.max(...charCounts.values());
        const avgCount = encrypted.ciphertext.length / 16; // 16个可能的字符
        
        // 最多出现的字符不应该超过平均值的3倍
        expect(maxCount).toBeLessThan(avgCount * 3);
      });
    });
  });

  describe('非对称加密和签名属性', () => {
    describe('签名唯一性和验证', () => {
      it('相同消息的签名应该可以被验证', () => {
        const keyPair = generateKeyPair();
        const message = 'test message';
        
        const signature = sign(keyPair.privateKey, message);
        const isValid = verify(keyPair.publicKey, message, signature);
        
        expect(isValid).toBe(true);
      });

      it('不同消息应该有不同的签名', () => {
        const keyPair = generateKeyPair();
        const message1 = 'message 1';
        const message2 = 'message 2';
        
        const sig1 = sign(keyPair.privateKey, message1);
        const sig2 = sign(keyPair.privateKey, message2);
        
        expect(sig1).not.toBe(sig2);
      });

      it('错误的公钥应该无法验证签名', () => {
        const keyPair1 = generateKeyPair();
        const keyPair2 = generateKeyPair();
        const message = 'test message';
        
        const signature = sign(keyPair1.privateKey, message);
        const isValid = verify(keyPair2.publicKey, message, signature);
        
        expect(isValid).toBe(false);
      });

      it('修改消息应该导致验证失败', () => {
        const keyPair = generateKeyPair();
        const originalMessage = 'original message';
        const modifiedMessage = 'modified message';
        
        const signature = sign(keyPair.privateKey, originalMessage);
        const isValid = verify(keyPair.publicKey, modifiedMessage, signature);
        
        expect(isValid).toBe(false);
      });
    });

    describe('签名不可伪造性', () => {
      it('随机签名应该无法通过验证', () => {
        const keyPair = generateKeyPair();
        const message = 'test message';
        
        // 创建随机"签名"
        const fakeSignature = Array.from({ length: 128 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        const isValid = verify(keyPair.publicKey, message, fakeSignature);
        expect(isValid).toBe(false);
      });
    });

    describe('密钥对独立性', () => {
      it('每次生成的密钥对应该不同', () => {
        const keyPairs = new Set<string>();
        const count = 10;
        
        for (let i = 0; i < count; i++) {
          const keyPair = generateKeyPair();
          const key = keyPair.privateKey + keyPair.publicKey;
          expect(keyPairs.has(key)).toBe(false);
          keyPairs.add(key);
        }
        
        expect(keyPairs.size).toBe(count);
      });
    });
  });
});

/**
 * 计算两个十六进制字符串的汉明距离（不同位数）
 */
function calculateHammingDistance(hex1: string, hex2: string): number {
  if (hex1.length !== hex2.length) {
    throw new Error('Strings must have equal length');
  }

  let distance = 0;
  for (let i = 0; i < hex1.length; i++) {
    const val1 = parseInt(hex1[i], 16);
    const val2 = parseInt(hex2[i], 16);
    const xor = val1 ^ val2;
    
    // 计算xor结果中1的个数
    for (let bit = 0; bit < 4; bit++) {
      if ((xor >> bit) & 1) {
        distance++;
      }
    }
  }
  
  return distance;
}
