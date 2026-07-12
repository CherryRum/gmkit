import { describe, it, expect } from 'vitest';
import {
  CipherMode,
  InputFormat,
  OutputFormat,
  PaddingMode,
  SM2CipherMode,
  bytesToHex,
  sm2CompressPublicKey,
  sm2Decrypt,
  sm2Encrypt,
  sm2GenerateKeyPair,
  sm2Sign,
  sm2Verify,
  sm3Digest,
  sm4Decrypt,
  sm4Encrypt,
  zucDecrypt,
  zucEncrypt,
  zucKeystream,
  eea3,
  eia3,
} from '../src/index';

const SM4_KEY = '0123456789abcdeffedcba9876543210';
const SM4_IV = '000102030405060708090a0b0c0d0e0f';
const SM4_GCM_IV = '00112233445566778899aabb';
const ZUC_KEY = '00112233445566778899aabbccddeeff';
const ZUC_IV = 'ffeeddccbbaa99887766554433221100';

const unicodeCases = [
  ['ascii', 'hello gmkit'],
  ['chinese', '你好，国密'],
  ['emoji', '国密测试 😊🚀🔥'],
  ['mixed unicode', '中文 + emoji 😊 + English + 123'],
  ['newlines and tabs', '第一行\nsecond line\t第三行'],
  ['spaces', '  前后空格\tspaces  '],
  ['symbols', 'SM2/SM3/SM4/ZUC: !@#$%^&*()_+-=[]{}|;:,.<>?'],
] as const;

const longText = '国密长文本😊'.repeat(80);

const sm3Vectors = [
  ['empty', '', '1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b'],
  ['ascii', 'hello gmkit', '3425c540fb7b120f9c585786c53fba004f151ff207edcd58f1cfff18857e034a'],
  ['chinese', '你好，国密', 'd5a98f677223c159be053eb1eb74886daa87455fdbcdd1b34551caa83f0332d1'],
  ['emoji', '国密测试 😊🚀🔥', '25007eb85ec568fdc5f8acd881c1520b9e5ca48871d432ec61226fd5f42cfed5'],
  ['mixed unicode', '中文 + emoji 😊 + English + 123', '2c0fba270ed6a572d05d21a138009376e479825d746d361bcd4a583adfa8145d'],
  ['newlines and tabs', '第一行\nsecond line\t第三行', '75e37ae3b6bc3f60887d09f365d7380a5c034b83233fd65ef89cb5cd78584ec1'],
  ['spaces', '  前后空格\tspaces  ', '0e1bf25b76bd2ba2a006cb30f7fbd6eb237beca41956b3dd465b05740def94ea'],
  ['symbols', 'SM2/SM3/SM4/ZUC: !@#$%^&*()_+-=[]{}|;:,.<>?', '26967d98e958ba5e7a957706ebdffcb0fd104343689129dcf524ba5fd683d59b'],
  ['long text', longText, 'f262f8465a4f8a06b90b884600f3cb12533e6309d90c5db68c7863bb917518be'],
] as const;

const zucCipherVectors = [
  ['ascii', 'hello gmkit', 'b68eed8fe7c6dcc0772dc6'],
  ['chinese', '你好，国密', '3a5621062d5b541190a1290610c8f0'],
  ['emoji', '国密测试 😊🚀🔥', '3b703c0627605d1897ac1d2ed597e9fcc0700aa059f0cc1449'],
  ['mixed unicode', '中文 + emoji 😊 + English + 123', '3a532c051e619b863c21dfd49f0e5694d5181f1af22016ee8be1505cdb817faba1d3d2'],
  ['newlines and tabs', '第一行\nsecond line\t第三行', '39472d073066530c904ec1de960818006aecfc54bc09b42c406981a65b00d8'],
  ['spaces', '  前后空格\tspaces  ', 'fecb646a05032b23fbed085d55db7f173ae1f65faa2073'],
  ['symbols', 'SM2/SM3/SM4/ZUC: !@#$%^&*()_+-=[]{}|;:,.<>?', '8da6b3ccdbab88824f098694af32355e6aa1d519fd250da6c6a51070988c69d0cd9a9c83938be9a45e680c'],
] as const;

describe('Java/TypeScript aligned GM coverage', () => {
  describe('SM3 project vectors', () => {
    it.each(sm3Vectors)('matches %s digest', (_name, input, expectedHex) => {
      expect(sm3Digest(input)).toBe(expectedHex);
    });
  });

  describe('SM2 Unicode payloads and formats', () => {
    it('encrypts/decrypts Unicode payloads with both C1C3C2 and C1C2C3 layouts', () => {
      const keyPair = sm2GenerateKeyPair();
      const compressedPublicKey = sm2CompressPublicKey(keyPair.publicKey);

      for (const [, plaintext] of [...unicodeCases, ['long text', longText] as const]) {
        for (const mode of [SM2CipherMode.C1C3C2, SM2CipherMode.C1C2C3]) {
          const ciphertext = sm2Encrypt(compressedPublicKey, plaintext, { mode });

          expect(ciphertext).toMatch(/^04[0-9a-f]+$/);
          expect(sm2Decrypt(keyPair.privateKey, ciphertext, { mode })).toBe(plaintext);
          expect(sm2Decrypt(keyPair.privateKey, ciphertext)).toBe(plaintext);
        }
      }
    });

    it('signs and verifies Unicode payloads in raw and DER formats', () => {
      const keyPair = sm2GenerateKeyPair();
      const compressedPublicKey = sm2CompressPublicKey(keyPair.publicKey);
      const userId = 'gmkit-user-中文-😊';

      for (const [, message] of [...unicodeCases, ['long text', longText] as const]) {
        const rawSignature = sm2Sign(keyPair.privateKey, message, {
          signatureFormat: 'raw',
          userId,
        });
        const derSignature = sm2Sign(keyPair.privateKey, message, {
          signatureFormat: 'der',
          userId,
        });

        expect(rawSignature).toMatch(/^[0-9a-f]{128}$/);
        expect(derSignature).toMatch(/^30[0-9a-f]+$/);
        expect(sm2Verify(compressedPublicKey, message, rawSignature, { signatureFormat: 'raw', userId })).toBe(true);
        expect(sm2Verify(compressedPublicKey, message, derSignature, { signatureFormat: 'der', userId })).toBe(true);
        expect(sm2Verify(compressedPublicKey, message, derSignature, { signatureFormat: 'auto', userId })).toBe(true);
        expect(sm2Verify(compressedPublicKey, message + 'tampered', rawSignature, { signatureFormat: 'raw', userId })).toBe(false);
        expect(sm2Verify(compressedPublicKey, message, rawSignature, { signatureFormat: 'raw', userId: 'wrong-user' })).toBe(false);
      }
    });
  });

  describe('SM4 Unicode payloads, IVs, padding, and tags', () => {
    it('round-trips Unicode payloads in CBC/PKCS7 and GCM/NONE modes', () => {
      for (const [, plaintext] of [['empty', ''] as const, ...unicodeCases, ['long text', longText] as const]) {
        const cbcOptions = {
          mode: CipherMode.CBC,
          padding: PaddingMode.PKCS7,
          iv: SM4_IV,
        };
        const cbcCipher = sm4Encrypt(SM4_KEY, plaintext, cbcOptions);
        expect(cbcCipher.ciphertext).toMatch(/^[0-9a-f]+$/);
        expect(sm4Decrypt(SM4_KEY, cbcCipher, cbcOptions)).toBe(plaintext);

        const gcmOptions = {
          mode: CipherMode.GCM,
          padding: PaddingMode.NONE,
          iv: SM4_GCM_IV,
          aad: 'gmkit-aad-中文-😊',
          tagLength: 16,
        };
        const gcmCipher = sm4Encrypt(SM4_KEY, plaintext, gcmOptions);
        expect(gcmCipher.ciphertext).toMatch(/^[0-9a-f]*$/);
        expect(gcmCipher.tag).toMatch(/^[0-9a-f]{32}$/);
        expect(sm4Decrypt(SM4_KEY, gcmCipher, gcmOptions)).toBe(plaintext);

        const tamperedTag = `${gcmCipher.tag!.slice(0, -1)}${gcmCipher.tag!.endsWith('0') ? '1' : '0'}`;
        expect(() => sm4Decrypt(SM4_KEY, { ...gcmCipher, tag: tamperedTag }, gcmOptions))
          .toThrow('Authentication tag verification failed');
      }
    });

    it('rejects invalid IV, padding, and tag inputs', () => {
      expect(() => sm4Encrypt(SM4_KEY, 'iv required', {
        mode: CipherMode.CBC,
        padding: PaddingMode.PKCS7,
      })).toThrow('IV is required for CBC mode');

      expect(() => sm4Encrypt(SM4_KEY, 'bad gcm iv', {
        mode: CipherMode.GCM,
        iv: SM4_IV,
      })).toThrow('IV must be 12 bytes (24 hex characters) for GCM mode');

      expect(() => sm4Encrypt(SM4_KEY, 'not block aligned', {
        mode: CipherMode.ECB,
        padding: PaddingMode.NONE,
      })).toThrow('Data length must be multiple of 16 bytes when padding is None');

      expect(() => sm4Decrypt(SM4_KEY, '00112233', {
        mode: CipherMode.GCM,
        iv: SM4_GCM_IV,
        tag: '0011',
      })).toThrow('Tag length must be between 12 and 16 bytes');
    });

    it('encrypts block-aligned binary data without padding', () => {
      const binary = new Uint8Array(16);
      for (let i = 0; i < binary.length; i++) binary[i] = i;

      const encrypted = sm4Encrypt(SM4_KEY, binary, {
        mode: CipherMode.ECB,
        padding: PaddingMode.NONE,
      });

      expect(bytesToHex(binary)).toBe('000102030405060708090a0b0c0d0e0f');
      expect(encrypted.ciphertext).toMatch(/^[0-9a-f]{32}$/);
    });
  });

  describe('ZUC project vectors, encodings, and errors', () => {
    it('matches Java-aligned project vectors for Unicode payloads', () => {
      for (const [, plaintext, expectedHex] of zucCipherVectors) {
        const ciphertext = zucEncrypt(ZUC_KEY, ZUC_IV, plaintext);

        expect(ciphertext).toBe(expectedHex);
        expect(zucDecrypt(ZUC_KEY, ZUC_IV, ciphertext)).toBe(plaintext);
      }
    });

    it('round-trips empty, long, Base64, and binary payloads', () => {
      expect(zucEncrypt(ZUC_KEY, ZUC_IV, '')).toBe('');
      expect(zucDecrypt(ZUC_KEY, ZUC_IV, '')).toBe('');

      const longCipher = zucEncrypt(ZUC_KEY, ZUC_IV, longText);
      expect(zucDecrypt(ZUC_KEY, ZUC_IV, longCipher)).toBe(longText);

      const base64Cipher = zucEncrypt(ZUC_KEY, ZUC_IV, 'hello gmkit', {
        outputFormat: OutputFormat.BASE64,
      });
      expect(zucDecrypt(ZUC_KEY, ZUC_IV, base64Cipher, {
        inputFormat: InputFormat.BASE64,
      })).toBe('hello gmkit');

      const binary = new Uint8Array([0, 1, 2, 3, 4, 5, 0xff, 0xfe, 0xfd, 0xfc, 0x80, 0x40]);
      const binaryCipher = zucEncrypt(ZUC_KEY, ZUC_IV, binary);
      expect(binaryCipher).toBe('deea83e08ce34453e1b832fb');
    });

    it('matches project keystream and LTE helper vectors', () => {
      expect(zucKeystream('00000000000000000000000000000000', '00000000000000000000000000000000', 8))
        .toBe('27bede74018082da');
      expect(zucKeystream(ZUC_KEY, ZUC_IV, 32))
        .toBe('deeb81e388e6bbad1c44b2bbf56776644a80953ad9005380ec8d392fb3a1548b');
      expect(eea3(ZUC_KEY, 0x398a59b4, 0x15, 1, 96)).toBe('ace6d69c177966fcc92ef61c');
      expect(eia3(ZUC_KEY, 0x398a59b4, 0x15, 1, '中文 + emoji 😊 + English + 123')).toBe('09f9b184');
    });

    it('rejects invalid ZUC key, IV, and hex ciphertext inputs', () => {
      expect(() => zucEncrypt('0011223344556677', ZUC_IV, 'bad key')).toThrow('Key must be 16 bytes');
      expect(() => zucEncrypt(ZUC_KEY, '0011223344556677', 'bad iv')).toThrow('IV must be 16 bytes');
      expect(() => zucDecrypt(ZUC_KEY, ZUC_IV, 'zz', { inputFormat: InputFormat.HEX }))
        .toThrow('Invalid hex string');
    });
  });
});
