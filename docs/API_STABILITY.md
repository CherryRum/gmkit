# API Stability Policy

GMKit is in **0.x** development. APIs are not yet frozen, but we follow
these rules to minimize churn for users who depend on the pre-1.0 surface.

## Stability tiers

- **Stable** — public APIs documented in `ts/README.md` and `java/README.md`.
  No breaking change without a major-version bump (1.x onwards).
- **Deprecated** — exported with `@deprecated` JSDoc / `@Deprecated`
  annotation. Scheduled for removal in a specific version; see lists below.
  Still works in current release, no behavior change.
- **Internal** — not exported from public barrel; may change at any time
  without notice. Source code internals.

## TypeScript (`gmkitx`) — Deprecated removal schedule

The following un-prefixed aliases were the original 0.1–0.8 API and remain
exported with `@deprecated` JSDoc. They will be **removed in 1.0**.
Migrate to the `sm2*` / `sm3*` prefixed equivalents.

| Deprecated alias               | Replace with                          |
| ------------------------------ | ------------------------------------- |
| `generateKeyPair`              | `sm2GenerateKeyPair`                  |
| `getPublicKeyFromPrivateKey`   | `sm2GetPublicKeyFromPrivateKey`       |
| `compressPublicKey`            | `sm2CompressPublicKey`                |
| `decompressPublicKey`          | `sm2DecompressPublicKey`              |
| `sign`                         | `sm2Sign`                             |
| `verify`                       | `sm2Verify`                           |
| `keyExchange`                  | `sm2KeyExchange`                      |
| `digest`                       | `sm3Digest`                           |
| `hmac`                         | `sm3Hmac`                             |

Programmatic detection: every alias above is annotated
`@deprecated [removal: 1.0]` in its JSDoc, picked up by TS-aware IDEs.

## Java (`cn.gmkit:gmkit`) — Stability commitment

JDK 8 source/target compatibility enforced via `animal-sniffer-maven-plugin`
on every `verify` build. The following are stable for the 0.x line:

- `cn.gmkit.sm2.SM2` / `cn.gmkit.sm2.SM2Util`
- `cn.gmkit.sm3.SM3` / `cn.gmkit.sm3.SM3Util`
- `cn.gmkit.sm4.SM4` / `cn.gmkit.sm4.SM4Util`
- `cn.gmkit.zuc.ZUC` / `cn.gmkit.zuc.ZUCUtil`
- `cn.gmkit.core.{Bytes, HexCodec, Base64Codec, GmkitException, Messages,
  SM2CipherMode, SM2SignatureFormat, SM4CipherMode, SM4Padding}`

The `cn.gmkit.sm9` package surface depends on JNI + GmSSL native libraries;
see `java/README.md` for platform support boundaries.

Internal package `cn.gmkit.test` (test-only helpers like `Vectors`,
`MiniJson`) is not part of the published artifact and not stable.

## Shared cross-language

- `vectors/interop.json` — the JSON schema is informally stable; field
  additions are non-breaking, field renames or removals require a
  CHANGELOG entry and both stacks update in the same PR.