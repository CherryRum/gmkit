import forge from 'node-forge';
import { bytesToBase64, bytesToHex, getRandomBytes, hexToBytes, sm2CompressPublicKey, sm2GenerateKeyPair } from 'gmkitx';

import { okFields, outputField, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';
import { textValue } from './shared';

export const keycertRunners: Record<string, ToolRunner> = {
  keygen: runKeygen,
  cert: runCert,
  csr: runCsr,
  pemder: runPemDer,
  jwk: runJwk,
  sshkey: runSshKey,
  pfx: runPfx,
};

function runKeygen(request: ToolRunRequest): ToolRunResult {
  const type = textValue(request.options, 'type', 'SM2');
  if (type === 'SM2') {
    const keyPair = sm2GenerateKeyPair();
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
      'SM2 密钥生成完成',
    );
  }
  if (type === 'SM4') return symmetricFields('SM4', 16, 16);
  if (type === 'AES') return symmetricFields('AES', 32, 16, 12);
  if (type === '3DES') return symmetricFields('3DES', 24, 8);
  const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 0 });
  return okFields(
    [
      outputField('publicKeyPem', '公钥 PEM', forge.pki.publicKeyToPem(keyPair.publicKey), 'pem', { primary: true }),
      outputField('privateKeyPem', '私钥 PEM', forge.pki.privateKeyToPem(keyPair.privateKey), 'pem', { secret: true }),
      outputField('publicJwk', '公钥 JWK', rsaPublicJwk(keyPair.publicKey), 'json'),
      outputField('privateJwk', '私钥 JWK', rsaPrivateJwk(keyPair.privateKey), 'json', { secret: true }),
    ],
    'RSA 密钥生成完成',
  );
}

function runCert(request: ToolRunRequest): ToolRunResult {
  const cert = forge.pki.certificateFromPem(request.input);
  return okFields(
    [
      outputField('subject', 'Subject', cert.subject.attributes, 'json', { primary: true }),
      outputField('issuer', 'Issuer', cert.issuer.attributes, 'json'),
      outputField('serialNumber', '序列号', cert.serialNumber),
      outputField('validity', '有效期', { validFrom: cert.validity.notBefore.toISOString(), validTo: cert.validity.notAfter.toISOString() }, 'json'),
      outputField('fingerprintSha256', 'SHA-256 指纹', forge.md.sha256.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()).digest().toHex(), 'hex'),
    ],
    '证书解析完成',
  );
}

function runCsr(request: ToolRunRequest): ToolRunResult {
  if (request.input.trim()) {
    const csr = forge.pki.certificationRequestFromPem(request.input);
    return okFields(
      [outputField('subject', 'Subject', csr.subject.attributes, 'json', { primary: true }), outputField('verified', '签名校验', String(csr.verify()), 'boolean')],
      'CSR 解析完成',
    );
  }
  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 0 });
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject([{ name: 'commonName', value: 'gmkit.local' }]);
  csr.sign(keys.privateKey, forge.md.sha256.create());
  return okFields(
    [
      outputField('csrPem', 'CSR PEM', forge.pki.certificationRequestToPem(csr), 'pem', { primary: true }),
      outputField('privateKeyPem', '私钥 PEM', forge.pki.privateKeyToPem(keys.privateKey), 'pem', { secret: true }),
    ],
    'CSR 生成完成',
  );
}

function runPemDer(request: ToolRunRequest): ToolRunResult {
  const input = request.input.trim();
  if (input.includes('-----BEGIN')) {
    const body = input.replace(/-----BEGIN [^-]+-----|-----END [^-]+-----|\s+/g, '');
    return okFields(
      [outputField('derBase64', 'DER Base64', body, 'base64', { primary: true }), outputField('derHex', 'DER Hex', forge.util.bytesToHex(forge.util.decode64(body)), 'hex')],
      'PEM 转 DER 完成',
    );
  }
  const label = textValue(request.options, 'pemLabel', 'CERTIFICATE');
  const pem = `-----BEGIN ${label}-----\n${input.replace(/\s+/g, '').match(/.{1,64}/g)?.join('\n') ?? input}\n-----END ${label}-----`;
  return okFields([outputField('pem', `${label} PEM`, pem, 'pem', { primary: true })], 'DER Base64 转 PEM 完成');
}

function runJwk(request: ToolRunRequest): ToolRunResult {
  const value = JSON.parse(request.input);
  return okFields([outputField('jwk', 'JWK JSON', value, 'json', { primary: true })], 'JWK JSON 解析完成');
}

function runSshKey(_request: ToolRunRequest): ToolRunResult {
  const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 0 });
  return okFields(
    [
      outputField('publicKeyPem', '公钥 PEM', forge.pki.publicKeyToPem(keyPair.publicKey), 'pem', { primary: true, note: '浏览器端当前输出 PEM；OpenSSH authorized_keys 需专用封装。' }),
      outputField('privateKeyPem', '私钥 PEM', forge.pki.privateKeyToPem(keyPair.privateKey), 'pem', { secret: true }),
    ],
    'SSH/RSA 密钥生成完成',
  );
}

function runPfx(request: ToolRunRequest): ToolRunResult {
  const password = textValue(request.options, 'password');
  const der = forge.util.decode64(request.input.replace(/\s+/g, ''));
  const asn1 = forge.asn1.fromDer(der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, password);
  const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
  return okFields([outputField('certBags', '证书数量', String(bags[forge.pki.oids.certBag]?.length ?? 0), 'number', { primary: true })], 'P12/PFX 解析完成');
}

function symmetricFields(label: string, keyLength: number, ivLength: number, nonceLength?: number): ToolRunResult {
  const key = getRandomBytes(keyLength);
  const iv = getRandomBytes(ivLength);
  const fields = [
    outputField('keyHex', `${label} Key Hex`, bytesToHex(key), 'hex', { primary: true, secret: true }),
    outputField('keyBase64', `${label} Key Base64`, bytesToBase64(key), 'base64', { secret: true }),
    outputField('ivHex', `${label} IV Hex`, bytesToHex(iv), 'hex'),
    outputField('ivBase64', `${label} IV Base64`, bytesToBase64(iv), 'base64'),
  ];
  if (nonceLength) {
    const nonce = getRandomBytes(nonceLength);
    fields.push(outputField('nonceHex', `${label} GCM Nonce Hex`, bytesToHex(nonce), 'hex'));
    fields.push(outputField('nonceBase64', `${label} GCM Nonce Base64`, bytesToBase64(nonce), 'base64'));
  }
  return okFields(fields, `${label} 密钥生成完成`);
}

function rsaPublicJwk(publicKey: forge.pki.rsa.PublicKey): Record<string, string> {
  return { kty: 'RSA', n: bigIntBase64Url(publicKey.n), e: bigIntBase64Url(publicKey.e) };
}

function rsaPrivateJwk(privateKey: forge.pki.rsa.PrivateKey): Record<string, string> {
  return {
    kty: 'RSA',
    n: bigIntBase64Url(privateKey.n),
    e: bigIntBase64Url(privateKey.e),
    d: bigIntBase64Url(privateKey.d),
    p: bigIntBase64Url(privateKey.p),
    q: bigIntBase64Url(privateKey.q),
    dp: bigIntBase64Url(privateKey.dP),
    dq: bigIntBase64Url(privateKey.dQ),
    qi: bigIntBase64Url(privateKey.qInv),
  };
}

function bigIntBase64Url(value: forge.jsbn.BigInteger): string {
  const hex = value.toString(16).padStart(value.toString(16).length + (value.toString(16).length % 2), '0');
  return bytesToBase64(hexToBytes(hex)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
