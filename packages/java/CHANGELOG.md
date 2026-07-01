# CHANGELOG

## 0.10.0-preview.1 - 2026-06-28

### Added

- Added the `cn.gmkit.zuc.ZUC` and `cn.gmkit.zuc.ZUCUtil` ZUC-128 APIs for key stream generation, encryption/decryption, Base64/hex helpers, EEA3, and EIA3-compatible MAC output.
- Added Java ZUC tests for project key stream vectors, Unicode payloads, empty payloads, binary payloads, Base64 ciphertext, EEA3/EIA3, utility facade delegation, and invalid inputs.
- Strengthened SM2 tests with compressed public keys, both `C1C3C2` and `C1C2C3`, raw/DER signatures, wrong userId checks, Chinese text, emoji, mixed Unicode, newlines, tabs, spaces, and long text.
- Strengthened SM3 tests with fixed project vectors for empty, ASCII, Chinese, emoji, mixed Unicode, newlines/tabs, spaces, symbols, and long text.
- Strengthened SM4 tests with CBC/PKCS7 and GCM/NONE round trips over Unicode payloads, long text, AAD, and tag verification.
- Strengthened SM9 tests for native-gated Unicode signing/verifying and IBE encryption/decryption, including wrong identity and tampered data coverage.

### Documentation

- Updated the README support matrix to include ZUC in the main Java runtime and to keep SM9 documented as an independent JNI/GmSSL module.
- Documented SM2 public-key formats, `C1C3C2`/`C1C2C3`, DER/ASN.1 ciphertext helpers, raw/DER signatures, default userId, and empty-plaintext behavior.
- Documented SM4 mode, padding, IV/nonce, tag length, and AAD requirements.
- Documented the SM9 JNI/native loading order, packaged platform runtime artifacts, unsupported platforms, 255-byte single-encryption limit, and lack of SM9 key exchange support.

### Fixed

- Added explicit ZUC validation and tests for invalid key/IV length, invalid hex/base64, negative lengths, null payloads, invalid bearer, and invalid direction.
- Updated the `gmkit` module description to match the implemented SM2/SM3/SM4/ZUC support.

### Compatibility

- The main `gmkit` artifact now exposes new ZUC public APIs; no existing SM2/SM3/SM4 API was removed.
- SM9 remains native-gated: when no supported native runtime or explicit native path is available, `SM9.isAvailable()` is false and native-dependent tests are skipped.
- ZUC fixed values are project alignment vectors shared with TypeScript tests unless separately identified as external standard vectors.
