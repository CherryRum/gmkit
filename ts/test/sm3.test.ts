import { describe, it, expect } from 'vitest';
import { digest, hmac } from '../src/crypto/sm3';
import { SM3 } from '../src/crypto/sm3/class';
import { OutputFormat } from '../src/types/constants';

describe('SM3 哈希算法测试', () => {
  describe('digest 摘要计算', () => {
    it('应该能够计算空字符串的哈希', () => {
      const result = digest('');
      // GM/T 0004-2012 标准测试向量
      expect(result).toBe('1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b');
    });

    it('应该能够计算 "abc" 的哈希', () => {
      const result = digest('abc');
      // GM/T 0004-2012 标准测试向量
      expect(result).toBe('66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0');
    });

    it('应该能够计算长字符串的哈希', () => {
      const input = 'abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd';
      const result = digest(input);
      // GM/T 0004-2012 标准测试向量
      expect(result).toBe('debe9ff92275b8a138604889c18e5a4d6fdb70e5387e5765293dcba39c0c5732');
    });

    it('应该能够接受 Uint8Array 输入', () => {
      const input = new Uint8Array([0x61, 0x62, 0x63]); // "abc"
      const result = digest(input);
      expect(result).toBe('66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0');
    });

    it('应该生成 64 位十六进制字符串', () => {
      const result = digest('test');
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it('应该支持 base64 输出格式', () => {
      const hexResult = digest('abc');
      const base64Result = digest('abc', { outputFormat: OutputFormat.BASE64 });

      // base64 结果应该不同于 hex 结果
      expect(base64Result).not.toBe(hexResult);

      // base64 结果应该是有效的 base64 字符串
      expect(base64Result).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  describe('hmac 消息认证码', () => {
    it('应该能够计算 HMAC', () => {
      const key = 'key';
      const data = 'The quick brown fox jumps over the lazy dog';
      const result = hmac(key, data);
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it('应该能够接受 Uint8Array 密钥和数据', () => {
      const key = new Uint8Array([0x6b, 0x65, 0x79]); // "key"
      const data = new Uint8Array([0x64, 0x61, 0x74, 0x61]); // "data"
      const result = hmac(key, data);
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it('应该能够处理长密钥', () => {
      const key = 'a'.repeat(100);
      const data = 'test';
      const result = hmac(key, data);
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it('应该支持 base64 输出格式', () => {
      const key = 'key';
      const data = 'data';
      const hexResult = hmac(key, data);
      const base64Result = hmac(key, data, { outputFormat: OutputFormat.BASE64 });

      // base64 结果应该不同于 hex 结果
      expect(base64Result).not.toBe(hexResult);

      // base64 结果应该是有效的 base64 字符串
      expect(base64Result).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  describe('SM3 类', () => {
    it('应该支持设置输出格式', () => {
      const sm3 = new SM3(OutputFormat.BASE64);
      sm3.update('abc');
      const result = sm3.digest();

      // 应该返回 base64 格式
      expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('应该支持动态修改输出格式', () => {
      const sm3 = new SM3();
      sm3.setOutputFormat(OutputFormat.BASE64);
      sm3.update('abc');
      const result = sm3.digest();

      // 应该返回 base64 格式
      expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('静态方法应该支持输出格式选项', () => {
      const hexResult = SM3.digest('abc');
      const base64Result = SM3.digest('abc', { outputFormat: OutputFormat.BASE64 });

      expect(hexResult).toMatch(/^[0-9a-f]{64}$/);
      expect(base64Result).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });
});
