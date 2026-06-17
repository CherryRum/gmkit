<script setup lang="ts">
import { ref } from 'vue'
import GMKit, {
  sm2,
  sm3,
  sm4,
  zuc,
  sha,
  SM2,
  SM3,
  SM4,
  ZUC,
  SHA256,
  SHA384,
  SHA512,
  SHA1,
  generateKeyPair,
  getPublicKeyFromPrivateKey,
  compressPublicKey,
  decompressPublicKey,
  sm2Encrypt,
  sm2Decrypt,
  sign,
  verify,
  keyExchange,
  digest,
  sm3Digest,
  hmac,
  sm4Encrypt,
  sm4Decrypt,
  zucEncrypt,
  zucDecrypt,
  zucKeystream,
  zucKeystreamWords,
  zucGenerateKeystream,
  eea3,
  eia3,
  ZUCState,
  sha256,
  sha384,
  sha512,
  sha1,
  hmacSha256,
  hmacSha384,
  hmacSha512,
  CipherMode,
  PaddingMode,
  SM2CipherMode,
  OutputFormat,
  InputFormat,
  OID,
  DEFAULT_USER_ID,
  hexToBytes,
  bytesToHex,
  base64ToBytes,
  bytesToBase64,
  stringToBytes,
  bytesToString,
  normalizeInput,
  xor,
  rotl,
  encodeSignature,
  decodeSignature,
  rawToDer,
  derToRaw,
  asn1ToXml,
  signatureToXml,
} from 'gmkitx'

const results = ref<Record<string, string>>({})
const running = ref(false)

const sampleKey = '0123456789abcdeffedcba9876543210'
const sampleIv = '000102030405060708090a0b0c0d0e0f'
const sampleGcmIv = '00112233445566778899aabb'

const formatValue = (value: unknown): string => {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(
      value,
      (_key, v) => {
        if (v instanceof Uint8Array || v instanceof Uint32Array) {
          return Array.from(v)
        }
        return v
      },
      2
    )
  } catch (error) {
    return String(error)
  }
}

const setResult = (key: string, value: unknown) => {
  results.value[key] = formatValue(value)
}

const runSection = (key: string, fn: () => unknown) => {
  try {
    setResult(key, fn())
  } catch (error) {
    setResult(key, `ERROR: ${(error as Error).message}`)
  }
}

const runSm2 = () => {
  const keyPair = generateKeyPair()
  const derivedPublicKey = getPublicKeyFromPrivateKey(keyPair.privateKey)
  const compressed = compressPublicKey(keyPair.publicKey)
  const decompressed = decompressPublicKey(compressed)

  const cipherHex = sm2Encrypt(keyPair.publicKey, 'Hello SM2')
  const plainHex = sm2Decrypt(keyPair.privateKey, cipherHex)
  const cipherBase64 = sm2Encrypt(keyPair.publicKey, 'Hello SM2', {
    mode: SM2CipherMode.C1C3C2,
    outputFormat: OutputFormat.BASE64,
  })
  const plainBase64 = sm2Decrypt(keyPair.privateKey, cipherBase64, {
    inputFormat: InputFormat.BASE64,
  })

  const sigRaw = sign(keyPair.privateKey, 'SM2 Message', { userId: DEFAULT_USER_ID })
  const sigDer = sign(keyPair.privateKey, 'SM2 Message', {
    signatureFormat: 'der',
    userId: DEFAULT_USER_ID,
  })
  const verifyRaw = verify(keyPair.publicKey, 'SM2 Message', sigRaw, { userId: DEFAULT_USER_ID })
  const verifyDer = verify(keyPair.publicKey, 'SM2 Message', sigDer, {
    signatureFormat: 'der',
    userId: DEFAULT_USER_ID,
  })

  const alice = generateKeyPair()
  const bob = generateKeyPair()
  const aliceTemp = generateKeyPair()
  const bobTemp = generateKeyPair()

  const aliceResult = keyExchange({
    privateKey: alice.privateKey,
    publicKey: alice.publicKey,
    tempPrivateKey: aliceTemp.privateKey,
    peerPublicKey: bob.publicKey,
    peerTempPublicKey: bobTemp.publicKey,
    isInitiator: true,
  })
  const bobResult = keyExchange({
    privateKey: bob.privateKey,
    publicKey: bob.publicKey,
    tempPrivateKey: bobTemp.privateKey,
    peerPublicKey: alice.publicKey,
    peerTempPublicKey: aliceTemp.publicKey,
    isInitiator: false,
  })

  const sm2Instance = SM2.fromPrivateKey(keyPair.privateKey)
  const sm2ClassCipher = sm2Instance.encrypt('Hello SM2 Class', { mode: SM2CipherMode.C1C3C2 })
  const sm2ClassPlain = sm2Instance.decrypt(sm2ClassCipher, { mode: SM2CipherMode.C1C3C2 })
  const sm2ClassSig = sm2Instance.sign('Hello SM2 Class', { userId: DEFAULT_USER_ID })
  const sm2ClassVerify = sm2Instance.verify('Hello SM2 Class', sm2ClassSig, { userId: DEFAULT_USER_ID })

  const namespaceCipher = sm2.encrypt(keyPair.publicKey, 'SM2 Namespace')
  const namespacePlain = sm2.decrypt(keyPair.privateKey, namespaceCipher)

  return {
    keyPair,
    derivedPublicKey,
    compressed,
    decompressed,
    cipherHex,
    plainHex,
    cipherBase64,
    plainBase64,
    sigRaw,
    sigDer,
    verifyRaw,
    verifyDer,
    keyExchange: {
      aliceResult,
      bobResult,
      sharedKeyMatch: aliceResult.sharedKey === bobResult.sharedKey,
    },
    classApi: {
      sm2ClassCipher,
      sm2ClassPlain,
      sm2ClassSig,
      sm2ClassVerify,
    },
    namespaceApi: {
      namespaceCipher,
      namespacePlain,
    },
  }
}

const runSm3 = () => {
  const message = 'Hello SM3'
  const hash = digest(message)
  const hashAlias = sm3Digest(message)
  const hashNs = sm3.digest(message)
  const mac = hmac('sm3-key', message)
  const sm3Instance = new SM3()
  sm3Instance.update('Hello ').update('SM3')
  const incremental = sm3Instance.digest()
  const staticDigest = SM3.digest(message)
  const staticHmac = SM3.hmac('sm3-key', message)

  return {
    hash,
    hashAlias,
    hashNs,
    mac,
    incremental,
    staticDigest,
    staticHmac,
  }
}

const runSm4 = () => {
  const plaintext = 'Hello SM4'
  const ecbCipher = sm4Encrypt(sampleKey, plaintext, {
    mode: CipherMode.ECB,
    padding: PaddingMode.PKCS7,
  })
  const ecbPlain = sm4Decrypt(sampleKey, ecbCipher, {
    mode: CipherMode.ECB,
    padding: PaddingMode.PKCS7,
  })

  const cbcCipher = sm4Encrypt(sampleKey, plaintext, {
    mode: CipherMode.CBC,
    padding: PaddingMode.PKCS7,
    iv: sampleIv,
  })
  const cbcPlain = sm4Decrypt(sampleKey, cbcCipher, {
    mode: CipherMode.CBC,
    padding: PaddingMode.PKCS7,
    iv: sampleIv,
  })

  const ctrCipherBase64 = sm4Encrypt(sampleKey, plaintext, {
    mode: CipherMode.CTR,
    padding: PaddingMode.NONE,
    iv: sampleIv,
    outputFormat: OutputFormat.BASE64,
  })
  const ctrPlain = sm4Decrypt(sampleKey, ctrCipherBase64, {
    mode: CipherMode.CTR,
    padding: PaddingMode.NONE,
    iv: sampleIv,
  })

  const gcmResult = sm4Encrypt(sampleKey, plaintext, {
    mode: CipherMode.GCM,
    padding: PaddingMode.NONE,
    iv: sampleGcmIv,
    aad: 'gmkitx-aad',
    tagLength: 16,
  })
  const gcmPlain = sm4Decrypt(sampleKey, gcmResult, {
    mode: CipherMode.GCM,
    padding: PaddingMode.NONE,
    iv: sampleGcmIv,
    aad: 'gmkitx-aad',
    tagLength: 16,
  })

  const sm4Cbc = SM4.CBC(sampleKey, sampleIv)
  const sm4CbcCipher = sm4Cbc.encrypt(plaintext)
  const sm4CbcPlain = sm4Cbc.decrypt(sm4CbcCipher)

  const sm4Gcm = SM4.GCM(sampleKey, sampleGcmIv)
  const sm4GcmCipher = sm4Gcm.encrypt(plaintext)
  const sm4GcmPlain = sm4Gcm.decrypt(sm4GcmCipher)

  const nsCipher = sm4.encrypt(sampleKey, plaintext, {
    mode: CipherMode.ECB,
    padding: PaddingMode.PKCS7,
  })
  const nsPlain = sm4.decrypt(sampleKey, nsCipher, {
    mode: CipherMode.ECB,
    padding: PaddingMode.PKCS7,
  })

  return {
    ecbCipher,
    ecbPlain,
    cbcCipher,
    cbcPlain,
    ctrCipherBase64,
    ctrPlain,
    gcmResult,
    gcmPlain,
    classApi: {
      sm4CbcCipher,
      sm4CbcPlain,
      sm4GcmCipher,
      sm4GcmPlain,
    },
    namespaceApi: {
      nsCipher,
      nsPlain,
    },
  }
}

const runZuc = () => {
  const plaintext = 'Hello ZUC'
  const cipherHex = zucEncrypt(sampleKey, sampleIv, plaintext)
  const plainHex = zucDecrypt(sampleKey, sampleIv, cipherHex)
  const cipherBase64 = zucEncrypt(sampleKey, sampleIv, plaintext, { outputFormat: OutputFormat.BASE64 })
  const plainBase64 = zucDecrypt(sampleKey, sampleIv, cipherBase64, {
    inputFormat: InputFormat.BASE64,
  })

  const keystreamHex = zucKeystream(sampleKey, sampleIv, 16)
  const keystreamWordsHex = zucKeystreamWords(sampleKey, sampleIv, 4)
  const keystreamRaw = zucGenerateKeystream(sampleKey, sampleIv, 4)

  const eea = eea3(sampleKey, 0x398a59b4, 0x15, 1, 128)
  const eia = eia3(sampleKey, 0x398a59b4, 0x15, 1, 'ZUC integrity')

  const state = new ZUCState()
  state.initialize(hexToBytes(sampleKey), hexToBytes(sampleIv))
  const firstWord = state.generateKeyword()

  const zucInstance = new ZUC(sampleKey, sampleIv)
  const zucObjCipher = zucInstance.encrypt(plaintext)
  const zucObjPlain = zucInstance.decrypt(zucObjCipher)
  const zucObjKeystream = zucInstance.keystream(16)

  const staticEea = ZUC.eea3(sampleKey, 0x398a59b4, 0x15, 1, 128)
  const staticEia = ZUC.eia3(sampleKey, 0x398a59b4, 0x15, 1, 'ZUC integrity')

  const nsCipher = zuc.encrypt(sampleKey, sampleIv, plaintext)
  const nsPlain = zuc.decrypt(sampleKey, sampleIv, nsCipher)

  return {
    cipherHex,
    plainHex,
    cipherBase64,
    plainBase64,
    keystreamHex,
    keystreamWordsHex,
    keystreamRaw,
    eea,
    eia,
    stateFirstWord: firstWord,
    classApi: {
      zucObjCipher,
      zucObjPlain,
      zucObjKeystream,
      staticEea,
      staticEia,
    },
    namespaceApi: {
      nsCipher,
      nsPlain,
    },
  }
}

const runSha = () => {
  const message = 'Hello SHA'
  const sha256Hash = sha256(message)
  const sha384Hash = sha384(message)
  const sha512Hash = sha512(message)
  const sha1Hash = sha1(message)
  const hmac256 = hmacSha256('sha-key', message)
  const hmac384 = hmacSha384('sha-key', message)
  const hmac512 = hmacSha512('sha-key', message)
  const nsHash = sha.sha256(message)

  const sha256Obj = new SHA256()
  sha256Obj.update('Hello ').update('SHA-256')
  const sha256Inc = sha256Obj.digest()

  const sha384Obj = new SHA384()
  sha384Obj.update('Hello ').update('SHA-384')
  const sha384Inc = sha384Obj.digest()

  const sha512Obj = new SHA512()
  sha512Obj.update('Hello ').update('SHA-512')
  const sha512Inc = sha512Obj.digest()

  const sha1Obj = new SHA1()
  sha1Obj.update('Hello ').update('SHA-1')
  const sha1Inc = sha1Obj.digest()

  const sha256Static = SHA256.digest(message)
  const sha384Static = SHA384.digest(message)
  const sha512Static = SHA512.digest(message)
  const sha1Static = SHA1.digest(message)

  return {
    sha256Hash,
    sha384Hash,
    sha512Hash,
    sha1Hash,
    hmac256,
    hmac384,
    hmac512,
    nsHash,
    classApi: {
      sha256Inc,
      sha384Inc,
      sha512Inc,
      sha1Inc,
    },
    staticApi: {
      sha256Static,
      sha384Static,
      sha512Static,
      sha1Static,
    },
  }
}

const runUtils = () => {
  const bytes = stringToBytes('hello')
  const hex = bytesToHex(bytes)
  const base64 = bytesToBase64(bytes)
  const fromHex = hexToBytes(hex)
  const fromBase64 = base64ToBytes(base64)
  const text = bytesToString(fromHex)
  const normalized = normalizeInput('hello')
  const xorResult = xor(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]))
  const rotated = rotl(0x12345678, 8)

  return {
    bytes,
    hex,
    base64,
    fromHex,
    fromBase64,
    text,
    normalized,
    xorResult,
    rotated,
    constants: {
      CipherMode,
      PaddingMode,
      SM2CipherMode,
      OutputFormat,
      InputFormat,
      OID,
      DEFAULT_USER_ID,
    },
  }
}

const runAsn1 = () => {
  const keyPair = generateKeyPair()
  const rawSignature = sign(keyPair.privateKey, 'ASN.1 Demo', { userId: DEFAULT_USER_ID })
  const r = rawSignature.slice(0, 64)
  const s = rawSignature.slice(64)
  const derBytes = encodeSignature(r, s)
  const derHex = bytesToHex(derBytes)
  const decoded = decodeSignature(derBytes)
  const derFromRaw = rawToDer(rawSignature)
  const rawFromDer = derToRaw(derFromRaw)
  const xml = asn1ToXml(derFromRaw)
  const xmlRaw = signatureToXml(rawSignature, { signatureFormat: 'raw' })
  const xmlDer = signatureToXml(derFromRaw, { signatureFormat: 'der' })

  return {
    rawSignature,
    r,
    s,
    derHex,
    decoded,
    derFromRaw: bytesToHex(derFromRaw),
    rawFromDer,
    xml,
    xmlRaw,
    xmlDer,
  }
}

const runNamespaceAndDefault = () => {
  const message = 'Namespace Demo'
  const keyPair = generateKeyPair()
  const nsDigest = sm3.digest(message)
  const nsSha = sha.sha256(message)
  const nsSm2Cipher = sm2.encrypt(keyPair.publicKey, message)
  const nsSm2Plain = sm2.decrypt(keyPair.privateKey, nsSm2Cipher)
  const gmkitDigest = GMKit.sm3.digest(message)
  const gmkitSm4Cipher = GMKit.sm4Encrypt(sampleKey, message, {
    mode: CipherMode.ECB,
    padding: PaddingMode.PKCS7,
  })
  const gmkitSm4Plain = GMKit.sm4Decrypt(sampleKey, gmkitSm4Cipher, {
    mode: CipherMode.ECB,
    padding: PaddingMode.PKCS7,
  })

  return {
    nsDigest,
    nsSha,
    nsSm2Cipher,
    nsSm2Plain,
    gmkitDigest,
    gmkitSm4Cipher,
    gmkitSm4Plain,
  }
}

const runAll = () => {
  running.value = true
  runSection('sm2', runSm2)
  runSection('sm3', runSm3)
  runSection('sm4', runSm4)
  runSection('zuc', runZuc)
  runSection('sha', runSha)
  runSection('utils', runUtils)
  runSection('asn1', runAsn1)
  runSection('namespace', runNamespaceAndDefault)
  running.value = false
}
</script>

<template>
  <div class="api-view">
    <div class="page-header">
      <div class="title-row">
        <div>
          <h1>📚 全部 API 演示</h1>
          <p class="page-description">
            一次性覆盖 gmkitx 的全部公开 API：算法函数、类、命名空间、默认导出、工具与 ASN.1。
          </p>
        </div>
        <button class="btn btn-primary" :disabled="running" @click="runAll">
          {{ running ? '运行中...' : '一键运行全部示例' }}
        </button>
      </div>
    </div>

    <div class="demo-grid">
      <section class="demo-card">
        <header>
          <h2>SM2 全功能</h2>
          <button class="btn btn-secondary" @click="runSection('sm2', runSm2)">运行</button>
        </header>
        <pre class="result">{{ results.sm2 || '尚未运行' }}</pre>
      </section>

      <section class="demo-card">
        <header>
          <h2>SM3 全功能</h2>
          <button class="btn btn-secondary" @click="runSection('sm3', runSm3)">运行</button>
        </header>
        <pre class="result">{{ results.sm3 || '尚未运行' }}</pre>
      </section>

      <section class="demo-card">
        <header>
          <h2>SM4 全功能</h2>
          <button class="btn btn-secondary" @click="runSection('sm4', runSm4)">运行</button>
        </header>
        <pre class="result">{{ results.sm4 || '尚未运行' }}</pre>
      </section>

      <section class="demo-card">
        <header>
          <h2>ZUC 全功能</h2>
          <button class="btn btn-secondary" @click="runSection('zuc', runZuc)">运行</button>
        </header>
        <pre class="result">{{ results.zuc || '尚未运行' }}</pre>
      </section>

      <section class="demo-card">
        <header>
          <h2>SHA 全功能</h2>
          <button class="btn btn-secondary" @click="runSection('sha', runSha)">运行</button>
        </header>
        <pre class="result">{{ results.sha || '尚未运行' }}</pre>
      </section>

      <section class="demo-card">
        <header>
          <h2>工具函数与常量</h2>
          <button class="btn btn-secondary" @click="runSection('utils', runUtils)">运行</button>
        </header>
        <pre class="result">{{ results.utils || '尚未运行' }}</pre>
      </section>

      <section class="demo-card">
        <header>
          <h2>ASN.1 工具</h2>
          <button class="btn btn-secondary" @click="runSection('asn1', runAsn1)">运行</button>
        </header>
        <pre class="result">{{ results.asn1 || '尚未运行' }}</pre>
      </section>

      <section class="demo-card">
        <header>
          <h2>命名空间与默认导出</h2>
          <button class="btn btn-secondary" @click="runSection('namespace', runNamespaceAndDefault)">运行</button>
        </header>
        <pre class="result">{{ results.namespace || '尚未运行' }}</pre>
      </section>
    </div>
  </div>
</template>

<style scoped>
.api-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  padding: 32px;
  border-radius: 16px;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.page-header h1 {
  font-size: 2.1em;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
  font-weight: 700;
}

.page-description {
  color: #555;
  line-height: 1.7;
  font-size: 1.02em;
  max-width: 760px;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.demo-card {
  background: white;
  padding: 22px;
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  min-height: 260px;
}

.demo-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.demo-card h2 {
  font-size: 1.25em;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.result {
  background: #f8f9fb;
  border-radius: 10px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  flex: 1;
  border: 1px solid #eef0f4;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #333;
}

.btn-secondary:hover,
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

@media (max-width: 768px) {
  .page-header {
    padding: 20px;
  }

  .page-header h1 {
    font-size: 1.7em;
  }

  .demo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
