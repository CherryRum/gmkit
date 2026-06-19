import forge from 'node-forge';
import { sm2GenerateKeyPair } from 'gmkitx';

import { ok, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';
import { randomBase64, randomHex, textValue } from './shared';

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
  if (type === 'SM2') return ok(sm2GenerateKeyPair(), 'SM2 密钥生成完成');
  if (type === 'SM4' || type === 'AES') return ok({ hex: randomHex(16), base64: randomBase64(16) }, `${type} 密钥生成完成`);
  const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 0 });
  return ok({ publicKeyPem: forge.pki.publicKeyToPem(keyPair.publicKey), privateKeyPem: forge.pki.privateKeyToPem(keyPair.privateKey) }, 'RSA 密钥生成完成');
}

function runCert(request: ToolRunRequest): ToolRunResult {
  const cert = forge.pki.certificateFromPem(request.input);
  return ok(
    {
      subject: cert.subject.attributes,
      issuer: cert.issuer.attributes,
      serialNumber: cert.serialNumber,
      validFrom: cert.validity.notBefore.toISOString(),
      validTo: cert.validity.notAfter.toISOString(),
      fingerprintSha256: forge.md.sha256.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()).digest().toHex(),
    },
    '证书解析完成',
  );
}

function runCsr(request: ToolRunRequest): ToolRunResult {
  if (request.input.trim()) {
    const csr = forge.pki.certificationRequestFromPem(request.input);
    return ok({ subject: csr.subject.attributes, verified: csr.verify() }, 'CSR 解析完成');
  }
  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 0 });
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject([{ name: 'commonName', value: 'gmkit.local' }]);
  csr.sign(keys.privateKey, forge.md.sha256.create());
  return ok({ csrPem: forge.pki.certificationRequestToPem(csr), privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey) }, 'CSR 生成完成');
}

function runPemDer(request: ToolRunRequest): ToolRunResult {
  const input = request.input.trim();
  if (input.includes('-----BEGIN')) {
    const body = input.replace(/-----BEGIN [^-]+-----|-----END [^-]+-----|\s+/g, '');
    return ok({ derBase64: body, derHex: forge.util.bytesToHex(forge.util.decode64(body)) }, 'PEM 转 DER 完成');
  }
  const pem = `-----BEGIN CERTIFICATE-----\n${input.replace(/\s+/g, '').match(/.{1,64}/g)?.join('\n') ?? input}\n-----END CERTIFICATE-----`;
  return ok(pem, 'DER Base64 转 PEM 完成');
}

function runJwk(request: ToolRunRequest): ToolRunResult {
  const value = JSON.parse(request.input);
  return ok(value, 'JWK JSON 解析完成');
}

function runSshKey(_request: ToolRunRequest): ToolRunResult {
  const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 0 });
  return ok({ publicKeyPem: forge.pki.publicKeyToPem(keyPair.publicKey), privateKeyPem: forge.pki.privateKeyToPem(keyPair.privateKey), note: '浏览器端输出 PEM；OpenSSH 封装需后续专用编码器。' }, 'SSH/RSA 密钥生成完成');
}

function runPfx(request: ToolRunRequest): ToolRunResult {
  const password = textValue(request.options, 'password');
  const der = forge.util.decode64(request.input.replace(/\s+/g, ''));
  const asn1 = forge.asn1.fromDer(der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, password);
  const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
  return ok({ certBags: bags[forge.pki.oids.certBag]?.length ?? 0 }, 'P12/PFX 解析完成');
}
