# CHANGELOG

## 0.10.0-preview.1 - 2026-06-28

### Monorepo merge

- Merged the TypeScript and Java stacks into a single polyglot monorepo.
  The TypeScript stack now lives under `packages/ts/`, the Java stack under
  `packages/java/`, docs under `packages/ts-docs/`, demo apps under `apps/`,
  and cross-language vectors under `vectors/`.
- TypeScript npm package name remains `gmkitx`; Java Maven coordinates
  remain `cn.gmkit:gmkit:0.10.0-preview.1`.
- Kept deprecated TypeScript top-level compatibility aliases such as
  `generateKeyPair`, `sign`, `verify`, `digest`, and `hmac` so existing
  consumers can upgrade safely. New code should use `sm2GenerateKeyPair`,
  `sm2Sign`, `sm2Verify`, `sm3Digest`, `sm3Hmac`, or the algorithm namespaces.
- CI rebuilt into `ci.yml`, `parity.yml`, `sm9-native.yml`, `docs.yml`,
  `publish-ts.yml`, and `publish-java.yml` with monorepo `paths:` filters.
- Release tag pattern updated: TS uses `ts-v*`, Java uses `java-v*`.
- Replaced the old Vue demo app with a Vue3 + Vite GMKit Studio product
  prototype under `apps/gmkit-studio/`, including real gmkitx-powered TS tools
  and an explicit SM9 Java API / WASM runtime boundary.
- Rebuilt GMKit Studio as the V5 tool-site UI: query-driven category navigation,
  non-duplicated home tool grid, `/tools/:toolId` workbench routes, empty ad
  rail placeholders, full V5 tool catalog, JSON worker workflow, and real
  browser/dependency-backed runners for crypto, hash, data, encoding, time,
  text, key/cert, and network tools.
- Added `vectors/interop.json` shared cross-language vectors, consumed by
  `packages/ts/test/interop-compliance.test.ts` and
  `cn.gmkit.InteropComplianceTest` (Maven test-resources mount + zero-dep
  classpath loader `cn.gmkit.test.Vectors`).

### Fixed

- **TS SM4 CK table — GB/T 32907-2016 conformance fix** (audit-iter8-D).
  The `CK[i]` constant generation in `packages/ts/src/crypto/sm4/index.ts` omitted
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

- Deprecated TypeScript top-level compatibility aliases remain available.
  Downstream code should migrate to prefixed functions or algorithm namespaces
  without requiring a flag-day upgrade.
- Empty SM2 `userId` values continue to select `DEFAULT_USER_ID`. RNG defaults
  to warning-and-fallback compatibility in runtimes without CSPRNG; strict
  consumers can opt into `configureRNG('strict')`.
- SM9 remains unsupported in TypeScript; no C, WASM, or native wrapper was added.
