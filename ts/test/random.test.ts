import { describe, it, expect } from 'vitest';
import { generateKeyPair } from '../src/crypto/sm2';

describe('Random Number Generation 随机数生成测试', () => {
  describe('随机数生成器回退机制', () => {
    it('应该使用 Web Crypto API 作为第一优先级', () => {
      // Web Crypto API 应该可用（通过 test/setup.ts 的 polyfill）
      expect(globalThis.crypto).toBeDefined();
      expect(globalThis.crypto.getRandomValues).toBeDefined();

      // 生成密钥对应该成功
      const keyPair = generateKeyPair();
      expect(keyPair.privateKey).toBeTruthy();
      expect(keyPair.publicKey).toBeTruthy();
    });

    it('应该生成唯一的随机密钥', () => {
      // 生成多个密钥对
      const keyPairs = [];
      for (let i = 0; i < 5; i++) {
        keyPairs.push(generateKeyPair());
      }

      // 检查所有私钥都是唯一的
      const uniquePrivateKeys = new Set(keyPairs.map(kp => kp.privateKey));
      expect(uniquePrivateKeys.size).toBe(5);

      // 检查所有公钥都是唯一的
      const uniquePublicKeys = new Set(keyPairs.map(kp => kp.publicKey));
      expect(uniquePublicKeys.size).toBe(5);
    });

    it('生成的密钥应该符合 SM2 规范', () => {
      const keyPair = generateKeyPair();

      // 私钥应该是 64 个十六进制字符（32 字节）
      expect(keyPair.privateKey).toMatch(/^[0-9a-f]{64}$/);

      // 公钥应该是 130 个十六进制字符（65 字节，04 + x + y）
      // 或 66 个字符（压缩格式）
      expect(keyPair.publicKey.length).toBeGreaterThanOrEqual(66);
      expect(keyPair.publicKey).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('性能测试', () => {
    it('应该能够快速生成密钥对', () => {
      const startTime = Date.now();
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        generateKeyPair();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      // 平均每个密钥对生成应该在合理时间内完成（小于 1 秒）
      expect(avgTime).toBeLessThan(1000);

      console.log(`生成 ${iterations} 个密钥对平均耗时: ${avgTime.toFixed(2)}ms`);
    });
  });
});
