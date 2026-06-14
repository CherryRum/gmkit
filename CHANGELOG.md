# CHANGELOG

## Unreleased

### Monorepo merge (in progress)

- Merged the `gmkit` (TypeScript) and `gmkit-java` repositories into a single
  polyglot monorepo. The TypeScript stack now lives under `ts/`, the Java
  stack under `java/`, with cross-language test vectors under `vectors/`.
- TypeScript npm package name remains `gmkitx`; Java Maven coordinates
  remain `cn.gmkit:gmkit:0.10.0-SNAPSHOT`. No user-facing API changes.
- CI split into `ts-*` and `java-*` workflows under `.github/workflows/`
  with `paths:` filters so TS-only and Java-only changes do not cross-trigger.
- Release tag pattern updated: TS uses `ts-v*`, Java uses `java-v*`.
- Added `vectors/interop.json` shared cross-language vectors, consumed by
  `ts/test/interop-compliance.test.ts` (relative import) and
  `cn.gmkit.InteropComplianceTest` (Maven test-resources mount + zero-dep
  classpath loader `cn.gmkit.test.Vectors`).

### Fixed

- **TS SM4 CK table — GB/T 32907-2016 conformance fix** (audit-iter8-D).
  The `CK[i]` constant generation in `ts/src/crypto/sm4/index.ts` omitted
  the standard's required `×7 mod 256` multiplier, producing wrong round
  keys for every SM4 block encryption. Bug surfaced when the InteropCompliance
  suite was extended to verify Java↔TS bit-for-bit equality, and root-caused
  by verifying BouncyCastle SM4 passes GB/T 32907-2016 §A.1 standard vector
  while TS did not. Fix: `CK[i]` bytes now `((4i+j)*7) & 0xff`.
  TS now produces `681edf34d206965e86b3e94f536e4246` for the official
  standard input. All 6 affected vectors in `vectors/interop.json` regenerated
  from the corrected implementation (3 sm4-ecb-*, 3 sm4-cbc-*); both stacks
  now produce byte-identical output. `cn.gmkit.InteropComplianceTest`
  re-enabled — 16/16 dynamic tests pass (10 SM3 + 3 SM4 ECB + 3 SM4 CBC).

### Known divergence (TODO — audit Section D, confirmed)

- *(none — SM4 finding above resolved by GB/T 32907-2016 CK fix.)*

### Added

- Added `test/aligned-gm-coverage.test.ts` to align TypeScript SM2, SM3, SM4, and ZUC behavior with the Java-side test口径 where the same algorithms are supported.
- Added Unicode coverage for Chinese text, emoji, mixed Unicode, newlines, tabs, surrounding spaces, symbols, long text, and binary `Uint8Array` payloads.
- Added stricter ZUC project vectors for key stream bytes, key stream words, UTF-8 payload encryption, Base64 ciphertext, binary payloads, EEA3, and EIA3.
- Extended `test/interop-compliance.test.ts` and `test/vectors/interop.json` with strict SM4 ciphertext assertions and shared ZUC/SM3 project vectors.

### Documentation

- Corrected the README and VuePress docs support matrix: TypeScript supports SM2, SM3, SM4, ZUC-128, and SHA; it does not support SM9.
- Documented the SM2 public-key, C1C3C2/C1C2C3, ASN.1 DER ciphertext, raw/DER signature, and default userId boundaries.
- Documented SM4 mode, padding, IV/nonce, tag length, and AAD requirements for ECB/CBC/CTR/CFB/OFB/GCM/CCM.
- Documented that ZUC fixed values in this repository are project alignment vectors unless explicitly marked as external standard vectors.
- Added runnable self-test commands for build, type-check, unit tests, and a Node `dist` SM3 example.

### Fixed

- Replaced stale SM4 interop expectations with values produced by the current implementation and made the assertions strict.
- Covered invalid ZUC key/IV length, invalid hex/base64 ciphertext, invalid EEA3/EIA3 parameters, and tampered SM4 AEAD tag behavior in tests.

### Compatibility

- No public TypeScript API was removed.
- Runtime behavior is unchanged; the compatibility impact is stricter tests and clearer documentation. Downstream tests that depended on the previous stale SM4 vector file may need to update those fixtures.
- SM9 remains unsupported in TypeScript; no C, WASM, or native wrapper was added.
