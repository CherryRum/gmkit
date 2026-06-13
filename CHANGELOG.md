# CHANGELOG

## Unreleased

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
