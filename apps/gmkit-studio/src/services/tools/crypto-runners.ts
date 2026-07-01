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
  sm2CompressPublicKey,
  sm2Decrypt,
  sm2DecompressPublicKey,
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
import { ok, okFields, outputField, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';

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
  const userId = textValue(request.options, 'userId', '1234567812345678');

  if (request.tab === '密钥') {
    const keyPair = sm2GenerateKeyPair();
    // SM2 工具站需要同时给出非压缩和压缩公钥，便于直接对接不同 SDK 的输入格式。
    const compressed = sm2CompressPublicKey(keyPair.publicKey);
    return okFields(
      [
        outputField('privateKeyHex', '私钥 Hex', keyPair.privateKey, 'hex', { secret: true }),
        outputField('privateKeyBase64', '私钥 Base64', bytesToBase64(hexToBytes(keyPair.privateKey)), 'base64', { secret: true }),
        outputField('publicKeyHex', '公钥 Hex', keyPair.publicKey, 'hex', { primary: true }),
        outputField('publicKeyBase64', '公钥 Base64', bytesToBase64(hexToBytes(keyPair.publicKey)), 'base64'),
        outputField('compressedPublicKeyHex', '压缩公钥 Hex', compressed, 'hex'),
        outputField('compressedPublicKeyBase64', '压缩公钥 Base64', bytesToBase64(hexToBytes(compressed)), 'base64'),
      ],
      'SM2 密钥对已生成',
    );
  }

  if (request.tab === '压缩公钥') {
    const publicKey = String(payload.publicKey ?? request.input).trim();
    const compressed = sm2CompressPublicKey(publicKey);
    return okFields(
      [
        outputField('compressedPublicKeyHex', '压缩公钥 Hex', compressed, 'hex', { primary: true }),
        outputField('compressedPublicKeyBase64', '压缩公钥 Base64', bytesToBase64(hexToBytes(compressed)), 'base64'),
      ],
      'SM2 公钥压缩完成',
    );
  }

  if (request.tab === '解压公钥') {
    const publicKey = String(payload.publicKey ?? request.input).trim();
    const uncompressed = sm2DecompressPublicKey(publicKey);
    return okFields(
      [
        outputField('publicKeyHex', '非压缩公钥 Hex', uncompressed, 'hex', { primary: true }),
        outputField('publicKeyBase64', '非压缩公钥 Base64', bytesToBase64(hexToBytes(uncompressed)), 'base64'),
      ],
      'SM2 公钥解压完成',
    );
  }

  if (request.tab === '加密') {
    const keyPair = payload.publicKey ? undefined : sm2GenerateKeyPair();
    const publicKey = String(payload.publicKey ?? keyPair?.publicKey);
    const message = String(payload.message ?? request.input);
    const ciphertext = sm2Encrypt(publicKey, message, { mode });
    return okFields(
      [
        outputField('ciphertext', '密文', ciphertext, 'hex', { primary: true }),
        outputField('mode', '密文顺序', mode),
        ...(keyPair
          ? [
              outputField('demoPrivateKey', '临时私钥 Hex', keyPair.privateKey, 'hex', { secret: true, note: '未填写公钥时自动生成，仅用于本次解密验证。' }),
              outputField('demoPublicKey', '临时公钥 Hex', keyPair.publicKey, 'hex'),
            ]
          : []),
      ],
      'SM2 加密完成',
    );
  }

  if (request.tab === '解密') {
    const payloadStrict = requireJsonInput<JsonRecord>(request.input, '包含 privateKey/ciphertext 的 JSON');
    const plaintext = sm2Decrypt(String(payloadStrict.privateKey), String(payloadStrict.ciphertext), { mode });
    return okFields([outputField('plaintext', '明文', plaintext, 'text', { primary: true }), outputField('mode', '密文顺序', mode)], 'SM2 解密完成');
  }

  if (request.tab === '签名') {
    const keyPair = payload.privateKey ? undefined : sm2GenerateKeyPair();
    const privateKey = String(payload.privateKey ?? keyPair?.privateKey);
    const message = String(payload.message ?? request.input);
    const signature = sm2Sign(privateKey, message, {
      userId: String(payload.userId ?? userId),
      signatureFormat: 'raw',
    });
    return okFields(
      [
        outputField('signature', '签名 Hex', signature, 'hex', { primary: true }),
        outputField('message', '签名原文', message),
        ...(keyPair ? [outputField('demoPublicKey', '临时公钥 Hex', keyPair.publicKey, 'hex')] : []),
      ],
      'SM2 签名完成',
    );
  }

  const verifyPayload = requireJsonInput<JsonRecord>(request.input, '包含 publicKey/message/signature 的 JSON');
  const valid = sm2Verify(
    String(verifyPayload.publicKey),
    String(verifyPayload.message),
    String(verifyPayload.signature),
    { userId: String(verifyPayload.userId ?? userId), signatureFormat: 'auto' },
  );
  return okFields([outputField('valid', '验签结果', String(valid), 'boolean', { primary: true })], 'SM2 验签完成');
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
    return okFields(
      [
        outputField('ciphertext', '密文', result.ciphertext, outputFormat, { primary: true }),
        outputField('key', 'Key Hex', key, 'hex', { secret: true }),
        ...(iv ? [outputField('iv', 'IV Hex', iv, 'hex')] : []),
      ],
      'SM4 加密完成',
    );
  }

  const payload = requireJsonInput<JsonRecord>(request.input, '包含 key/ciphertext 的 JSON，或在选项中填写 key');
  const ciphertext = String(payload.ciphertext ?? payload.message ?? request.input);
  const plaintext = sm4Decrypt(String(payload.key ?? key), ciphertext, {
    mode,
    padding,
    iv: String(payload.iv ?? iv) || undefined,
    inputFormat: outputFormat,
  });
  return okFields([outputField('plaintext', '明文', plaintext, 'text', { primary: true })], 'SM4 解密完成');
}

function runZuc(request: ToolRunRequest): ToolRunResult {
  const payload = jsonInput<JsonRecord>(request.input, { message: request.input });
  const key = textValue(request.options, 'key') || String(payload.key ?? '00000000000000000000000000000000');
  const iv = textValue(request.options, 'iv') || String(payload.iv ?? '00000000000000000000000000000000');
  const length = Number(textValue(request.options, 'length', '32'));

  if (request.tab === '密钥流') {
    return okFields(
      [outputField('keystream', '密钥流 Hex', zucKeystream(key, iv, length), 'hex', { primary: true }), outputField('bytes', '字节数', String(length), 'number')],
      'ZUC 密钥流生成完成',
    );
  }
  if (request.tab === '解密') {
    return okFields([outputField('plaintext', '明文', zucDecrypt(key, iv, String(payload.message ?? request.input)), 'text', { primary: true })], 'ZUC 解密完成');
  }
  if (request.tab === 'EEA3') {
    const count = Number(payload.count ?? textValue(request.options, 'count', '0'));
    const bearer = Number(payload.bearer ?? textValue(request.options, 'bearer', '0'));
    const direction = Number(payload.direction ?? textValue(request.options, 'direction', '0'));
    return okFields([outputField('keystream', 'EEA3 密钥流 Hex', eea3(key, count, bearer, direction, String(payload.message ?? '').length * 8), 'hex', { primary: true })], 'EEA3 执行完成');
  }
  if (request.tab === 'EIA3') {
    const count = Number(payload.count ?? textValue(request.options, 'count', '0'));
    const bearer = Number(payload.bearer ?? textValue(request.options, 'bearer', '0'));
    const direction = Number(payload.direction ?? textValue(request.options, 'direction', '0'));
    return okFields([outputField('mac', 'MAC Hex', eia3(key, count, bearer, direction, String(payload.message ?? request.input)), 'hex', { primary: true })], 'EIA3 执行完成');
  }
  return okFields([outputField('ciphertext', '密文 Hex', zucEncrypt(key, iv, String(payload.message ?? request.input)), 'hex', { primary: true })], 'ZUC 加密完成');
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
    // SM9 不在 TS 侧假实现；Java API 未配置或请求失败时直接把错误返回给工作台。
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
    ? decodeAutoBytes(textValue(request.options, 'key'))
    : getRandomBytes(keyLength / 8);
  const ivBytes = textValue(request.options, 'iv')
    ? decodeAutoBytes(textValue(request.options, 'iv'))
    : getRandomBytes(mode === 'GCM' ? 12 : 16);
  const key = await crypto.subtle.importKey('raw', asArrayBuffer(keyBytes), algorithmName, false, ['encrypt', 'decrypt']);
  const algorithm = mode === 'CTR'
    ? { name: algorithmName, counter: ivBytes, length: 64 }
    : { name: algorithmName, iv: ivBytes };

  if (request.tab === '解密') {
    const ciphertext = decodeBytes(String(payload.ciphertext ?? request.input), outputEncoding);
    const plaintext = await crypto.subtle.decrypt(algorithm, key, asArrayBuffer(ciphertext));
    return okFields([outputField('plaintext', '明文', new TextDecoder().decode(plaintext), 'text', { primary: true })], 'AES 解密完成');
  }

  const encrypted = await crypto.subtle.encrypt(algorithm, key, asArrayBuffer(stringToBytes(String(payload.message ?? request.input))));
  return okFields(
    [
      outputField('ciphertext', '密文', encodeBytes(new Uint8Array(encrypted), outputEncoding), outputEncoding.toLowerCase() as 'base64' | 'hex', { primary: true }),
      outputField('keyBase64', 'Key Base64', bytesToBase64(keyBytes), 'base64', { secret: true }),
      outputField('keyHex', 'Key Hex', bytesToHex(keyBytes), 'hex', { secret: true }),
      outputField('ivBase64', 'IV/Nonce Base64', bytesToBase64(ivBytes), 'base64'),
      outputField('ivHex', 'IV/Nonce Hex', bytesToHex(ivBytes), 'hex'),
    ],
    'AES 加密完成',
  );
}

async function runRsa(request: ToolRunRequest): Promise<ToolRunResult> {
  const hash = textValue(request.options, 'hash', 'SHA-256');
  const keyLength = Number(textValue(request.options, 'keyLength', '2048'));
  if (request.tab === '生成密钥') {
    const isPss = textValue(request.options, 'usage', 'OAEP 加解密') === 'PSS 签名验签';
    // Web Crypto 的 RSA-OAEP 与 RSA-PSS key usages 不兼容，生成时必须按用途拆开。
    const algorithm = isPss
      ? { name: 'RSA-PSS', modulusLength: keyLength, publicExponent: new Uint8Array([1, 0, 1]), hash }
      : { name: 'RSA-OAEP', modulusLength: keyLength, publicExponent: new Uint8Array([1, 0, 1]), hash };
    const pair = await crypto.subtle.generateKey(
      algorithm,
      true,
      isPss ? ['sign', 'verify'] : ['encrypt', 'decrypt'],
    );
    const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
    const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    const spki = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
    return okFields(
      [
        outputField('publicKeyPem', '公钥 PEM', pemWrap('PUBLIC KEY', spki), 'pem', { primary: true }),
        outputField('privateKeyPem', '私钥 PEM', pemWrap('PRIVATE KEY', pkcs8), 'pem', { secret: true }),
        outputField('publicJwk', '公钥 JWK', publicJwk, 'json'),
        outputField('privateJwk', '私钥 JWK', privateJwk, 'json', { secret: true }),
      ],
      isPss ? 'RSA-PSS 密钥生成完成' : 'RSA-OAEP 密钥生成完成',
    );
  }

  const payload = requireJsonInput<JsonRecord>(request.input, 'RSA JSON');
  if (request.tab === '加密') {
    const publicKey = await crypto.subtle.importKey('jwk', payload.publicKey ?? payload.publicJwk, { name: 'RSA-OAEP', hash }, false, ['encrypt']);
    const ciphertext = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, asArrayBuffer(stringToBytes(String(payload.message ?? ''))));
    return okFields([outputField('ciphertext', '密文 Base64', bytesToBase64(new Uint8Array(ciphertext)), 'base64', { primary: true })], 'RSA 加密完成');
  }
  if (request.tab === '解密') {
    const privateKey = await crypto.subtle.importKey('jwk', payload.privateKey ?? payload.privateJwk, { name: 'RSA-OAEP', hash }, false, ['decrypt']);
    const plaintext = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, asArrayBuffer(decodeBytes(String(payload.ciphertext), 'Base64')));
    return okFields([outputField('plaintext', '明文', new TextDecoder().decode(plaintext), 'text', { primary: true })], 'RSA 解密完成');
  }

  const saltLength = Number(textValue(request.options, 'saltLength', '32'));
  if (request.tab === '签名') {
    const privateKey = await crypto.subtle.importKey('jwk', payload.privateKey ?? payload.privateJwk, { name: 'RSA-PSS', hash }, false, ['sign']);
    const signature = await crypto.subtle.sign({ name: 'RSA-PSS', saltLength }, privateKey, asArrayBuffer(stringToBytes(String(payload.message ?? ''))));
    return okFields([outputField('signature', '签名 Base64', bytesToBase64(new Uint8Array(signature)), 'base64', { primary: true })], 'RSA-PSS 签名完成');
  }

  const publicKey = await crypto.subtle.importKey('jwk', payload.publicKey ?? payload.publicJwk, { name: 'RSA-PSS', hash }, false, ['verify']);
  const valid = await crypto.subtle.verify(
    { name: 'RSA-PSS', saltLength },
    publicKey,
    asArrayBuffer(decodeBytes(String(payload.signature), 'Base64')),
    asArrayBuffer(stringToBytes(String(payload.message ?? ''))),
  );
  return okFields([outputField('valid', '验签结果', String(valid), 'boolean', { primary: true })], 'RSA-PSS 验签完成');
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
    return okFields([outputField('plaintext', '明文', decipher.output.toString(), 'text', { primary: true })], '3DES 解密完成');
  }

  const cipher = forge.cipher.createCipher('3DES-CBC', keyBytes);
  cipher.start({ iv: ivBytes });
  cipher.update(forge.util.createBuffer(String(payload.message ?? request.input), 'utf8'));
  cipher.finish();
  const bytes = Uint8Array.from(cipher.output.getBytes(), (char) => char.charCodeAt(0));
  return okFields(
    [
      outputField('ciphertext', '密文', encodeBytes(bytes, outputEncoding), outputEncoding.toLowerCase() as 'base64' | 'hex', { primary: true }),
      outputField('keyHex', 'Key Hex', key.padEnd(48, '0').slice(0, 48), 'hex', { secret: true }),
      outputField('ivHex', 'IV Hex', iv.padEnd(16, '0').slice(0, 16), 'hex'),
    ],
    '3DES 加密完成',
  );
}

async function runPbkdf2(request: ToolRunRequest): Promise<ToolRunResult> {
  const hash = textValue(request.options, 'hash', 'SHA-256');
  const iterations = Number(textValue(request.options, 'iterations', '100000'));
  const length = Number(textValue(request.options, 'length', '32'));
  const salt = textValue(request.options, 'salt', 'gmkit-salt');
  const baseKey = await crypto.subtle.importKey('raw', asArrayBuffer(stringToBytes(request.input)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash, salt: asArrayBuffer(stringToBytes(salt)), iterations }, baseKey, length * 8);
  const key = bytesToHex(new Uint8Array(bits));
  return okFields(
    [
      outputField('keyHex', '派生 Key Hex', key, 'hex', { primary: true, secret: true }),
      outputField('keyBase64', '派生 Key Base64', bytesToBase64(hexToBytes(key)), 'base64', { secret: true }),
      outputField('params', '参数', { hash, iterations, length, salt }, 'json'),
    ],
    'PBKDF2 派生完成',
  );
}

async function runDigest(request: ToolRunRequest): Promise<ToolRunResult> {
  const outputEncoding = textValue(request.options, 'outputEncoding', 'Hex');
  const upper = textValue(request.options, 'case', 'Lower') === 'Upper';
  const payload = jsonInput<JsonRecord>(request.input, { message: request.input });
  const message = String(payload.message ?? request.input);
  const key = String(payload.key ?? textValue(request.options, 'key', 'gmkit-secret'));
  let digest = '';

  if (request.tool.id === 'bcrypt') {
    if (request.tab === '校验') {
      const hash = textValue(request.options, 'compare') || String(payload.hash ?? '');
      return okFields([outputField('valid', '校验结果', String(await bcrypt.compare(message, hash)), 'boolean', { primary: true })], 'bcrypt 校验完成');
    }
    return okFields([outputField('hash', 'bcrypt Hash', await bcrypt.hash(message, Number(textValue(request.options, 'cost', '12'))), 'secret', { primary: true, secret: true })], 'bcrypt 生成完成');
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
  return okFields([outputField('digest', '摘要', upper ? digest.toUpperCase() : digest.toLowerCase(), outputEncoding.toLowerCase() as 'hex' | 'base64', { primary: true })], '摘要计算完成');
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

function decodeAutoBytes(value: string): Uint8Array {
  const clean = value.trim();
  return /^[0-9a-fA-F]+$/.test(clean) && clean.length % 2 === 0 ? hexToBytes(clean) : decodeBytes(clean, 'Base64');
}

function pemWrap(label: string, bytes: Uint8Array): string {
  const body = bytesToBase64(bytes).match(/.{1,64}/g)?.join('\n') ?? '';
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
}
