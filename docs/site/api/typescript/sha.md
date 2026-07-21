---
title: TypeScript SHA API
description: 说明 gmkitx SHA-1、SHA-256、SHA-384、SHA-512、HMAC 和增量类。
pageInfo: false
icon: fingerprint
order: 7
category:
  - API 说明书
  - TypeScript
tag:
  - SHA
  - HMAC
  - 摘要
---

# TypeScript SHA API

`gmkitx` 提供 SHA-1、SHA-256、SHA-384、SHA-512 及 HMAC-SHA-256/384/512。新协议默认选择 SHA-256 或更高版本；SHA-1 只用于无法立即迁移的旧协议。

## 一次性摘要

```ts
interface SHAOptions {
  outputFormat?: OutputFormatType;
}

sha1(data: string | Uint8Array, options?: SHAOptions): string
sha256(data: string | Uint8Array, options?: SHAOptions): string
sha384(data: string | Uint8Array, options?: SHAOptions): string
sha512(data: string | Uint8Array, options?: SHAOptions): string
```

| 函数 | 摘要字节 | 默认 Hex 长度 | 使用建议 |
|:--|--:|--:|:--|
| `sha1` | 20 | 40 | 已弃用；仅旧协议兼容 |
| `sha256` | 32 | 64 | 通用默认选择 |
| `sha384` | 48 | 96 | 需要更宽摘要时 |
| `sha512` | 64 | 128 | 需要 512-bit 输出时 |

字符串输入按 UTF-8 编码，默认返回小写 Hex；`OutputFormat.BASE64` 返回标准 Base64。`sha` 命名空间暴露同一组函数。

```ts
import { OutputFormat, sha1, sha256, sha384, sha512 } from 'gmkitx';

if (sha256('abc') !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') {
  throw new Error('SHA-256 vector mismatch');
}
if (sha1('abc') !== 'a9993e364706816aba3e25717850c26c9cd0d89d') {
  throw new Error('legacy SHA-1 vector mismatch');
}
if (sha384('abc').length !== 96 || sha512('abc').length !== 128) {
  throw new Error('SHA output length mismatch');
}
if (sha256('abc', { outputFormat: OutputFormat.BASE64 }).length === 0) {
  throw new Error('Base64 output missing');
}
```

## HMAC

```ts
hmacSha256(key, data, options?: SHAOptions): string
hmacSha384(key, data, options?: SHAOptions): string
hmacSha512(key, data, options?: SHAOptions): string
```

`key` 和 `data` 都接受 `string | Uint8Array`；字符串一律按 UTF-8，不按 Hex 解码。需要使用 Hex key 时先调用 `hexToBytes`。

```ts
import { hexToBytes, hmacSha256, hmacSha384, hmacSha512 } from 'gmkitx';

const key = hexToBytes('0b'.repeat(20));
if (hmacSha256(key, 'Hi There') !== 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7') {
  throw new Error('HMAC-SHA-256 vector mismatch');
}
if (hmacSha384(key, 'Hi There').length !== 96) throw new Error('HMAC-SHA-384 length');
if (hmacSha512(key, 'Hi There').length !== 128) throw new Error('HMAC-SHA-512 length');
```

库没有 HMAC-SHA-1 公共入口。验证 MAC 时对解码后的字节使用 `constantTimeEqual`。

## 增量类

```ts
new SHA1(outputFormat?: OutputFormatType)
new SHA256(outputFormat?: OutputFormatType)
new SHA384(outputFormat?: OutputFormatType)
new SHA512(outputFormat?: OutputFormatType)

SHA*.digest(
  data: string | Uint8Array,
  outputFormat?: OutputFormatType,
): string

update(data: string | Uint8Array): this
digest(): string
reset(): this
setOutputFormat(format: OutputFormatType): void
getOutputFormat(): OutputFormatType
```

注意静态类方法的第二个参数直接是 `OutputFormatType`，不是 `SHAOptions` 对象；顶层函数才使用 `{ outputFormat }`。

```ts
import { OutputFormat, SHA256, sha256 } from 'gmkitx';

const state = new SHA256();
state.update('a').update('b').update('c');
if (state.digest() !== sha256('abc')) {
  throw new Error('incremental SHA-256 mismatch');
}

// digest() 自动建立新状态，可以继续复用。
if (state.update('abc').digest() !== sha256('abc')) {
  throw new Error('SHA-256 reuse failed');
}

const base64 = SHA256.digest('abc', OutputFormat.BASE64);
if (base64.length === 0) throw new Error('static class digest failed');
```

`SHA1`、`SHA256`、`SHA384`、`SHA512` 的实例方法相同，只有底层算法和输出长度不同。实例有可变状态，不应由并发任务共享。

## 安全选择

- SHA-1 已存在实际碰撞攻击，不应用于新签名、证书、内容寻址或安全校验。
- 普通 SHA 摘要不能替代 HMAC；需要共享密钥认证时使用对应 HMAC。
- SHA/HMAC 不能直接替代密码哈希或 KDF。
- Java 主包没有 `cn.gmkit.sha` 封装；跨语言 Java 端使用 JDK `MessageDigest`/`Mac`。

## 相关页面

- [SHA 算法与 Java JDK 对照](/algorithms/SHA.html)
- [编码与敏感值比较](/api/typescript/common.html)
