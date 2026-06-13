import { describe, it, expect } from 'vitest';
import {
  sha256,
  sha384,
  sha512,
  sha1,
  hmacSha256,
  hmacSha384,
  hmacSha512,
} from '../src/crypto/sha';
import { SHA256, SHA384, SHA512, SHA1 } from '../src/crypto/sha/class';
import { OutputFormat } from '../src/types/constants';

describe('SHA 哈希算法', () => {
  describe('SHA-256', () => {
    it('应该正确计算 SHA-256 哈希（hex 格式）', () => {
      const hash = sha256('Hello, World!');
      expect(hash).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
    });

    it('应该正确计算 SHA-256 哈希（base64 格式）', () => {
      const hash = sha256('Hello, World!', { outputFormat: OutputFormat.BASE64 });
      expect(hash).toBe('3/1gIbsr1bCvZ2KQgJ7DpTGR3YHH9wpLKGiKNiGCmG8=');
    });

    it('应该处理空字符串', () => {
      const hash = sha256('');
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('应该处理 Uint8Array 输入', () => {
      const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      const hash = sha256(data);
      expect(hash).toBe('185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969');
    });
  });

  describe('SHA-384', () => {
    it('应该正确计算 SHA-384 哈希（hex 格式）', () => {
      const hash = sha384('Hello, World!');
      expect(hash).toBe('5485cc9b3365b4305dfb4e8337e0a598a574f8242bf17289e0dd6c20a3cd44a089de16ab4ab308f63e44b1170eb5f515');
    });

    it('应该正确计算 SHA-384 哈希（base64 格式）', () => {
      const hash = sha384('Hello, World!', { outputFormat: OutputFormat.BASE64 });
      expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('SHA-512', () => {
    it('应该正确计算 SHA-512 哈希（hex 格式）', () => {
      const hash = sha512('Hello, World!');
      expect(hash).toBe('374d794a95cdcfd8b35993185fef9ba368f160d8daf432d08ba9f1ed1e5abe6cc69291e0fa2fe0006a52570ef18c19def4e617c33ce52ef0a6e5fbe318cb0387');
    });

    it('应该正确计算 SHA-512 哈希（base64 格式）', () => {
      const hash = sha512('Hello, World!', { outputFormat: OutputFormat.BASE64 });
      expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('SHA-1', () => {
    it('应该正确计算 SHA-1 哈希', () => {
      const hash = sha1('Hello, World!');
      expect(hash).toBe('0a0a9f2a6772942557ab5355d76af442f8f65e01');
    });

    it('应该正确计算 SHA-1 哈希（base64 格式）', () => {
      const hash = sha1('Hello, World!', { outputFormat: OutputFormat.BASE64 });
      expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('HMAC-SHA256', () => {
    it('应该正确计算 HMAC-SHA256', () => {
      const mac = hmacSha256('secret-key', 'data to authenticate');
      expect(mac).toMatch(/^[0-9a-f]{64}$/);
      expect(mac.length).toBe(64);
    });

    it('应该正确计算 HMAC-SHA256（base64 格式）', () => {
      const mac = hmacSha256('secret-key', 'data to authenticate', { outputFormat: OutputFormat.BASE64 });
      expect(mac).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  describe('HMAC-SHA384', () => {
    it('应该正确计算 HMAC-SHA384', () => {
      const mac = hmacSha384('secret-key', 'data to authenticate');
      expect(mac).toMatch(/^[0-9a-f]{96}$/);
      expect(mac.length).toBe(96);
    });
  });

  describe('HMAC-SHA512', () => {
    it('应该正确计算 HMAC-SHA512', () => {
      const mac = hmacSha512('secret-key', 'data to authenticate');
      expect(mac).toMatch(/^[0-9a-f]{128}$/);
      expect(mac.length).toBe(128);
    });
  });

  describe('SHA256 类', () => {
    it('应该支持静态方法', () => {
      const hash = SHA256.digest('Hello, World!');
      expect(hash).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
    });

    it('应该支持增量哈希', () => {
      const sha = new SHA256();
      sha.update('Hello, ').update('World!');
      const hash = sha.digest();
      expect(hash).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
    });

    it('应该支持重置', () => {
      const sha = new SHA256();
      sha.update('test');
      sha.reset();
      sha.update('Hello, World!');
      const hash = sha.digest();
      expect(hash).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
    });

    it('应该支持设置输出格式', () => {
      const sha = new SHA256();
      sha.setOutputFormat(OutputFormat.BASE64);
      sha.update('Hello, World!');
      const hash = sha.digest();
      expect(hash).toBe('3/1gIbsr1bCvZ2KQgJ7DpTGR3YHH9wpLKGiKNiGCmG8=');
    });
  });

  describe('SHA384 类', () => {
    it('应该支持静态方法', () => {
      const hash = SHA384.digest('Hello, World!');
      expect(hash).toBe('5485cc9b3365b4305dfb4e8337e0a598a574f8242bf17289e0dd6c20a3cd44a089de16ab4ab308f63e44b1170eb5f515');
    });

    it('应该支持增量哈希', () => {
      const sha = new SHA384();
      sha.update('Hello, ').update('World!');
      const hash = sha.digest();
      expect(hash).toBe('5485cc9b3365b4305dfb4e8337e0a598a574f8242bf17289e0dd6c20a3cd44a089de16ab4ab308f63e44b1170eb5f515');
    });
  });

  describe('SHA512 类', () => {
    it('应该支持静态方法', () => {
      const hash = SHA512.digest('Hello, World!');
      expect(hash).toBe('374d794a95cdcfd8b35993185fef9ba368f160d8daf432d08ba9f1ed1e5abe6cc69291e0fa2fe0006a52570ef18c19def4e617c33ce52ef0a6e5fbe318cb0387');
    });

    it('应该支持增量哈希', () => {
      const sha = new SHA512();
      sha.update('Hello, ').update('World!');
      const hash = sha.digest();
      expect(hash).toBe('374d794a95cdcfd8b35993185fef9ba368f160d8daf432d08ba9f1ed1e5abe6cc69291e0fa2fe0006a52570ef18c19def4e617c33ce52ef0a6e5fbe318cb0387');
    });
  });

  describe('SHA1 类', () => {
    it('应该支持静态方法', () => {
      const hash = SHA1.digest('Hello, World!');
      expect(hash).toBe('0a0a9f2a6772942557ab5355d76af442f8f65e01');
    });

    it('应该支持增量哈希', () => {
      const sha = new SHA1();
      sha.update('Hello, ').update('World!');
      const hash = sha.digest();
      expect(hash).toBe('0a0a9f2a6772942557ab5355d76af442f8f65e01');
    });
  });
});
