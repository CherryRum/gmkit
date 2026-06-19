import bcrypt from 'bcryptjs';
import { str as crc32String } from 'crc-32';
import forge from 'node-forge';
import {
  bytesToBase64,
  bytesToHex,
  eea3,
  eia3,
  getRandomBytes,
  hmacSha256,
  hmacSha384,
  hmacSha512,
  hexToBytes,
  sha1,
  sha256,
  sha512,
  sm2Decrypt,
  sm2Encrypt,
  sm2GenerateKeyPair,
  sm2Sign,
  sm2Verify,
  sm3Digest,
  sm3Hmac,
  sm4Decrypt,
  sm4Encrypt,
  stringToBytes,
  zucDecrypt,
  zucEncrypt,
  zucKeystream,
  type CipherModeType,
  type PaddingModeType,
} from 'gmkitx';

import { JavaApiSm9Runtime, WasmSm9Runtime, type Sm9RuntimeRequest } from '@/services/sm9/runtime';

import {
  asArrayBuffer,
  decodeBytes,
  encodeBytes,
  jsonInput,
  randomHex,
  requireJsonInput,
  textValue,
} from './shared';
import { ok, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';

type JsonRecord = Record<string, any>;

export const cryptoRunners: Record<string, ToolRunner> = {
  sm2: runSm2,
  sm4: runSm4,
  zuc: runZuc,
  sm9: runSm9,
  aes: runAes,
  rsa: runRsa,
  des3: runDes3,
  pbkdf2: runPbkdf2,
  sm3: runDigest,
  sha1: runDigest,
  sha256: runDigest,
  sha512: runDigest,
  hmac: runDigest,
  md5: runDigest,
  crc32: runDigest,
  bcrypt: runDigest,
};

function runSm2(request: ToolRunRequest): ToolRunResult {
  const payload = jsonInput<JsonRecord>(request.input, { message: request.input });
  const mode = textValue(request.options, 'mode', 'C1C3C2') as 'C1C3C2' | 'C1C2C3';

  if (request.tab === '密钥') {
    return ok(sm2GenerateKeyPair(), 'SM2 密钥对已生成');
  }

  if (request.tab === '加密') {
    const keyPair = payload.publicKey ? undefined : sm2GenerateKeyPair();
    const publicKey = String(payload.publicKey ?? keyPair?.publicKey);
    const message = String(payload.message ?? request.input);
    const ciphertext = sm2Encrypt(publicKey, message, { mode });
    return ok({ ciphertext, mode, demoPrivateKey: keyPair?.privateKey }, 'SM2 加密完成');
  }

  if (request.tab === '解密') {
    const payloadStrict = requireJsonInput<JsonRecord>(request.input, '包含 privateKey/ciphertext 的 JSON');
    const plaintext = sm2Decrypt(String(payloadStrict.privateKey), String(payloadStrict.ciphertext), { mode });
    return ok({ plaintext, mode }, 'SM2 解密完成');
  }

  if (request.tab === '签名') {
    const keyPair = payload.privateKey ? undefined : sm2GenerateKeyPair();
    const privateKey = String(payload.privateKey ?? keyPair?.privateKey);
    const message = String(payload.message ?? request.input);
    const signature = sm2Sign(privateKey, message, {
      userId: String(payload.userId ?? '1234567812345678'),
      signatureFormat: 'raw',
    });
    return ok({ signature, publicKey: keyPair?.publicKey, message }, 'SM2 签名完成');
  }

  const verifyPayload = requireJsonInput<JsonRecord>(request.input, '包含 publicKey/message/signature 的 JSON');
  const valid = sm2Verify(
    String(verifyPayload.publicKey),
    String(verifyPayload.message),
    String(verifyPayload.signature),
    { userId: String(verifyPayload.userId ?? '1234567812345678'), signatureFormat: 'auto' },
  );
  return ok({ valid }, 'SM2 验签完成');
}

function runSm4(request: ToolRunRequest): ToolRunResult {
  const mode = textValue(request.options, 'mode', 'CBC').toLowerCase() as CipherModeType;
  const padding = normalizePadding(textValue(request.options, 'padding', 'PKCS7'));
  const outputFormat = textValue(request.options, 'outputEncoding', 'Base64') === 'Hex' ? 'hex' : 'base64';
  const inputPayload = jsonInput<JsonRecord>(request.input, { message: request.input });
  const key = textValue(request.options, 'key') || String(inputPayload.key ?? randomHex(16));
  const iv = textValue(request.options, 'iv') || String(inputPayload.iv ?? (mode === 'ecb' ? '' : randomHex(16)));

  if (request.tab === '加密') {
    const result = sm4Encrypt(key, String(inputPayload.message ?? request.input), {
      mode,
      padding,
      iv: iv || undefined,
      outputFormat,
    });
    return ok({ ...result, key, iv: iv || undefined }, 'SM4 加密完成');
  }

  const payload = requireJsonInput<JsonRecord>(request.input, '包含 key/ciphertext 的 JSON，或在选项中填写 key');
  const ciphertext = String(payload.ciphertext ?? payload.message ?? request.input);
  const plaintext = sm4Decrypt(String(payload.key ?? key), ciphertext, {
    mode,
    padding,
    iv: String(payload.iv ?? iv) || undefined,
    inputFormat: outputFormat,
  });
  return ok({ plaintext }, 'SM4 解密完成');
}

function runZuc(request: ToolRunRequest): ToolRunResult {
  const payload = jsonInput<JsonRecord>(request.input, { message: request.input });
  const key = textValue(request.options, 'key') || String(payload.key ?? '00000000000000000000000000000000');
  const iv = textValue(request.options, 'iv') || String(payload.iv ?? '00000000000000000000000000000000');
  const length = Number(textValue(request.options, 'length', '32'));

  if (request.tab === '密钥流') {
    return ok({ keystream: zucKeystream(key, iv, length), bytes: length }, 'ZUC 密钥流生成完成');
  }
  if (request.tab === '解密') {
    return ok({ plaintext: zucDecrypt(key, iv, String(payload.message ?? request.input)) }, 'ZUC 解密完成');
  }
  if (request.tab === 'EEA3') {
    const count = Number(payload.count ?? 0);
    const bearer = Number(payload.bearer ?? 0);
    const direction = Number(payload.direction ?? 0);
    return ok({ keystream: eea3(key, count, bearer, direction, String(payload.message ?? '').length * 8) }, 'EEA3 执行完成');
  }
  if (request.tab === 'EIA3') {
    const count = Number(payload.count ?? 0);
    const bearer = Number(payload.bearer ?? 0);
    const direction = Number(payload.direction ?? 0);
    return ok({ mac: eia3(key, count, bearer, direction, String(payload.message ?? request.input)) }, 'EIA3 执行完成');
  }
  return ok({ ciphertext: zucEncrypt(key, iv, String(payload.message ?? request.input)) }, 'ZUC 加密完成');
}

async function runSm9(request: ToolRunRequest): Promise<ToolRunResult> {
  const input = requireJsonInput<JsonRecord>(request.input || '{}', 'SM9 请求 JSON');
  const operation = String(input.operation ?? 'sign') as Sm9RuntimeRequest['operation'];
  const payload = input.payload ?? input;
  const runtimeRequest = { operation, payload };

  if (request.tab === '能力') {
    return ok({ runtime: ['java-api', 'wasm'], operations: ['sign', 'verify', 'encrypt', 'decrypt', 'generateMasterKey'] }, 'SM9 能力边界');
  }

  if (request.tab === 'Java API') {
    const runtime = new JavaApiSm9Runtime(textValue(request.options, 'endpoint'));
    return ok(await runtime.execute(runtimeRequest), 'SM9 Java API 调用完成');
  }

  const runtime = new WasmSm9Runtime(textValue(request.options, 'wasmUrl'));
  return ok(await runtime.execute(runtimeRequest), 'SM9 WASM 调用完成');
}

async function runAes(request: ToolRunRequest): Promise<ToolRunResult> {
  const mode = textValue(request.options, 'mode', 'GCM');
  const outputEncoding = textValue(request.options, 'outputEncoding', 'Base64');
  const keyLength = Number(textValue(request.options, 'keyLength', '256'));
  const payload = jsonInput<JsonRecord>(request.input, { message: request.input });
  const algorithmName = `AES-${mode}`;
  const keyBytes = textValue(request.options, 'key')
    ? decodeBytes(textValue(request.options, 'key'), 'Base64')
    : getRandomBytes(keyLength / 8);
  const ivBytes = textValue(request.options, 'iv')
    ? decodeBytes(textValue(request.options, 'iv'), 'Base64')
    : getRandomBytes(mode === 'GCM' ? 12 : 16);
  const key = await crypto.subtle.importKey('raw', asArrayBuffer(keyBytes), algorithmName, false, ['encrypt', 'decrypt']);
  const algorithm = mode === 'CTR'
    ? { name: algorithmName, counter: ivBytes, length: 64 }
    : { name: algorithmName, iv: ivBytes };

  if (request.tab === '解密') {
    const ciphertext = decodeBytes(String(payload.ciphertext ?? request.input), outputEncoding);
    const plaintext = await crypto.subtle.decrypt(algorithm, key, asArrayBuffer(ciphertext));
    return ok({ plaintext: new TextDecoder().decode(plaintext) }, 'AES 解密完成');
  }

  const encrypted = await crypto.subtle.encrypt(algorithm, key, asArrayBuffer(stringToBytes(String(payload.message ?? request.input))));
  return ok(
    {
      ciphertext: encodeBytes(new Uint8Array(encrypted), outputEncoding),
      key: bytesToBase64(keyBytes),
      iv: bytesToBase64(ivBytes),
      encoding: outputEncoding,
    },
    'AES 加密完成',
  );
}

async function runRsa(request: ToolRunRequest): Promise<ToolRunResult> {
  const hash = textValue(request.options, 'hash', 'SHA-256');
  const keyLength = Number(textValue(request.options, 'keyLength', '2048'));
  if (request.tab === '生成密钥') {
    const pair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: keyLength,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash,
      },
      true,
      ['encrypt', 'decrypt'],
    );
    return ok(
      {
        publicKey: await crypto.subtle.exportKey('jwk', pair.publicKey),
        privateKey: await crypto.subtle.exportKey('jwk', pair.privateKey),
      },
      'RSA-OAEP 密钥生成完成',
    );
  }

  const payload = requireJsonInput<JsonRecord>(request.input, 'RSA JSON');
  if (request.tab === '加密') {
    const publicKey = await crypto.subtle.importKey('jwk', payload.publicKey, { name: 'RSA-OAEP', hash }, false, ['encrypt']);
    const ciphertext = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, asArrayBuffer(stringToBytes(String(payload.message ?? ''))));
    return ok({ ciphertext: bytesToBase64(new Uint8Array(ciphertext)) }, 'RSA 加密完成');
  }
  if (request.tab === '解密') {
    const privateKey = await crypto.subtle.importKey('jwk', payload.privateKey, { name: 'RSA-OAEP', hash }, false, ['decrypt']);
    const plaintext = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, asArrayBuffer(decodeBytes(String(payload.ciphertext), 'Base64')));
    return ok({ plaintext: new TextDecoder().decode(plaintext) }, 'RSA 解密完成');
  }

  throw new Error('RSA 签名/验签请先使用 PSS key JSON，当前工作台先提供 OAEP 生成/加解密。');
}

function runDes3(request: ToolRunRequest): ToolRunResult {
  const payload = jsonInput<JsonRecord>(request.input, { message: request.input });
  const key = String(payload.key ?? (textValue(request.options, 'key') || randomHex(24)));
  const iv = String(payload.iv ?? (textValue(request.options, 'iv') || randomHex(8)));
  const outputEncoding = textValue(request.options, 'outputEncoding', 'Base64');
  const keyBytes = forge.util.hexToBytes(key.padEnd(48, '0').slice(0, 48));
  const ivBytes = forge.util.hexToBytes(iv.padEnd(16, '0').slice(0, 16));

  if (request.tab === '解密') {
    const decipher = forge.cipher.createDecipher('3DES-CBC', keyBytes);
    decipher.start({ iv: ivBytes });
    decipher.update(forge.util.createBuffer(bytesToForgeBinary(decodeBytes(String(payload.ciphertext ?? request.input), outputEncoding))));
    const pass = decipher.finish();
    if (!pass) throw new Error('3DES 解密失败');
    return ok({ plaintext: decipher.output.toString() }, '3DES 解密完成');
  }

  const cipher = forge.cipher.createCipher('3DES-CBC', keyBytes);
  cipher.start({ iv: ivBytes });
  cipher.update(forge.util.createBuffer(String(payload.message ?? request.input), 'utf8'));
  cipher.finish();
  const bytes = Uint8Array.from(cipher.output.getBytes(), (char) => char.charCodeAt(0));
  return ok({ ciphertext: encodeBytes(bytes, outputEncoding), key, iv }, '3DES 加密完成');
}

async function runPbkdf2(request: ToolRunRequest): Promise<ToolRunResult> {
  const hash = textValue(request.options, 'hash', 'SHA-256');
  const iterations = Number(textValue(request.options, 'iterations', '100000'));
  const length = Number(textValue(request.options, 'length', '32'));
  const salt = textValue(request.options, 'salt', 'gmkit-salt');
  const baseKey = await crypto.subtle.importKey('raw', asArrayBuffer(stringToBytes(request.input)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash, salt: asArrayBuffer(stringToBytes(salt)), iterations }, baseKey, length * 8);
  return ok({ key: bytesToHex(new Uint8Array(bits)), hash, iterations, length, salt }, 'PBKDF2 派生完成');
}

async function runDigest(request: ToolRunRequest): Promise<ToolRunResult> {
  const outputEncoding = textValue(request.options, 'outputEncoding', 'Hex');
  const upper = textValue(request.options, 'case', 'Lower') === 'Upper';
  const payload = jsonInput<JsonRecord>(request.input, { message: request.input });
  const message = String(payload.message ?? request.input);
  const key = String(payload.key ?? 'gmkit-secret');
  let digest = '';

  if (request.tool.id === 'bcrypt') {
    if (request.tab === '校验') {
      const hash = textValue(request.options, 'compare') || String(payload.hash ?? '');
      return ok({ valid: await bcrypt.compare(message, hash) }, 'bcrypt 校验完成');
    }
    return ok({ hash: await bcrypt.hash(message, Number(textValue(request.options, 'cost', '12'))) }, 'bcrypt 生成完成');
  }

  if (request.tool.id === 'crc32') {
    digest = (crc32String(message) >>> 0).toString(16).padStart(8, '0');
  } else if (request.tool.id === 'md5') {
    const md = forge.md.md5.create();
    md.update(message, 'utf8');
    digest = md.digest().toHex();
  } else if (request.tab === 'HMAC' || request.tool.id === 'hmac') {
    digest = hmacDigest(request.tool.id, key, message);
  } else {
    digest = plainDigest(request.tool.id, message);
  }

  if (outputEncoding === 'Base64') {
    digest = bytesToBase64(hexToBytes(digest));
  }
  return ok({ digest: upper ? digest.toUpperCase() : digest.toLowerCase() }, '摘要计算完成');
}

function plainDigest(id: string, message: string): string {
  if (id === 'sm3') return sm3Digest(message);
  if (id === 'sha1') return sha1(message);
  if (id === 'sha256') return sha256(message);
  if (id === 'sha512') return sha512(message);
  return sha256(message);
}

function hmacDigest(id: string, key: string, message: string): string {
  if (id === 'sm3') return sm3Hmac(key, message);
  if (id === 'sha512') return hmacSha512(key, message);
  if (id === 'sha1') return hmacSha256(key, message);
  if (id === 'hmac') return hmacSha256(key, message);
  if (id === 'sha384') return hmacSha384(key, message);
  return hmacSha256(key, message);
}

function normalizePadding(value: string): PaddingModeType {
  if (value === 'NoPadding') return 'none';
  if (value === 'Zero') return 'zero';
  return 'pkcs7';
}

function bytesToForgeBinary(bytes: Uint8Array): string {
  let output = '';
  for (const byte of bytes) output += String.fromCharCode(byte);
  return output;
}
