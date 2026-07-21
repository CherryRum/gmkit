---
title: TypeScript SM3 API
description: 说明 gmkitx SM3 摘要、HMAC、输出编码、增量状态与 reset 行为。
pageInfo: false
icon: fingerprint
order: 3
category:
  - API 说明书
  - TypeScript
tag:
  - SM3
  - HMAC
  - 摘要
---

# TypeScript SM3 API

SM3 接收任意字节消息并输出 256-bit（32 字节）摘要。`gmkitx` 提供一次性摘要、HMAC-SM3 和可复用的增量 `SM3` 类。

## 一次性函数

```ts
interface SM3Options {
  outputFormat?: OutputFormatType;
}

sm3Digest(
  data: string | Uint8Array,
  options?: SM3Options,
): string

sm3Hmac(
  key: string | Uint8Array,
  data: string | Uint8Array,
  options?: SM3Options,
): string
```

| 参数 | 语义 |
|:--|:--|
| `data` 字符串 | 按 UTF-8 编码后计算 |
| `data` 字节 | 原样参与计算 |
| `key` 字符串 | HMAC key 按 UTF-8 编码，不按 Hex 猜测 |
| `outputFormat` | 默认 `OutputFormat.HEX`；可选标准 Base64 |

`sm3` 命名空间中的 `digest`、`hmac` 与顶层函数行为相同。根入口的无前缀 `digest`、`hmac` 是弃用兼容别名。

```ts
import { OutputFormat, sm3Digest, sm3Hmac } from 'gmkitx';

const digest = sm3Digest('abc');
if (digest !== '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') {
  throw new Error('SM3 vector mismatch');
}

const macHex = sm3Hmac('secret-key', 'hmac-payload');
const macBase64 = sm3Hmac('secret-key', 'hmac-payload', {
  outputFormat: OutputFormat.BASE64,
});
if (macHex.length !== 64 || macBase64.length === 0) {
  throw new Error('SM3-HMAC output mismatch');
}
```

空消息是合法摘要输入。非法 `outputFormat` 会抛出 `Error`。HMAC 验证时应对解码后的 MAC 使用 `constantTimeEqual`，不要直接比较不可信字符串。

## `SM3` 增量类

```ts
new SM3(outputFormat?: OutputFormatType)

SM3.digest(data, options?): string
SM3.hmac(key, data, options?): string

update(data: string | Uint8Array): this
digest(options?: SM3Options): string
reset(): this
setOutputFormat(format: OutputFormatType): void
getOutputFormat(): OutputFormatType
```

增量实例只缓存不足一个 64 字节分组的尾部，适合流式处理大消息。`digest()` 完成计算后会自动重置内部消息状态，因此同一个实例可以开始下一条消息；实例输出格式继续保留。

```ts
import { OutputFormat, SM3, sm3Digest } from 'gmkitx';

const state = new SM3(OutputFormat.HEX);
state.update('a').update(Uint8Array.of(0x62, 0x63));
if (state.digest() !== sm3Digest('abc')) {
  throw new Error('incremental SM3 mismatch');
}

// digest() 已自动 reset，可以复用同一实例。
if (state.update('abc').digest() !== sm3Digest('abc')) {
  throw new Error('SM3 reuse failed');
}

state.setOutputFormat(OutputFormat.BASE64);
if (state.getOutputFormat() !== OutputFormat.BASE64) {
  throw new Error('output format was not retained');
}
```

`reset()` 可在放弃当前未完成消息时显式清空状态。JavaScript 对象不应由多个异步任务并发更新；需要并行计算时为每条消息创建独立实例。

## 摘要与密码的边界

- SM3 摘要不能提供消息来源认证；需要共享密钥认证时使用 HMAC-SM3。
- 不要用一次 SM3 或 HMAC 直接保存用户密码；应使用带 salt 和成本参数的密码哈希。
- 摘要输出不是加密，无法从摘要恢复原文。
- 比较敏感摘要或 MAC 时先解码为字节，再调用 `constantTimeEqual`。

## 相关页面

- [跨语言 SM3 协议与固定向量](/algorithms/SM3.html)
- [编码与敏感值比较](/api/typescript/common.html)
