---
title: Rust 对接指南
description: 使用固定 RustCrypto crate 版本对照 GMKit 的 SM3、SM4 和确定性结果。
icon: code
order: 7
category: [集成示例, Rust]
tag: [Rust, RustCrypto, SM3, SM4]
---

# Rust 对接指南

本页使用 RustCrypto `sm3 = 0.5.0`、`sm4 = 0.6.0`，最低 Rust 版本由这些 crate 决定。仓库 fixture 提交 `Cargo.lock` 并真实编译；旧文档中的 `sm3 0.10`、`sm4 0.5` API 已不作为当前基线。

## 依赖与验证

```toml
[dependencies]
hex-literal = "0.4.1"
sm3 = "0.5.0"
sm4 = "0.6.0"
```

```bash
cd docs/site/examples/rust
cargo test --locked
```

```rust
use hex_literal::hex;
use sm3::{Digest, Sm3};
use sm4::cipher::{BlockCipherEncrypt, KeyInit};
use sm4::Sm4;

let digest = Sm3::digest(b"abc");
assert_eq!(digest[..], hex!("66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0"));

let cipher = Sm4::new(&hex!("0123456789abcdeffedcba9876543210").into());
let mut block = hex!("0123456789abcdeffedcba9876543210").into();
cipher.encrypt_block(&mut block);
assert_eq!(block[..], hex!("681edf34d206965e86b3e94f536e4246"));
```

`sm4` crate 提供分组原语，不自动替你设计 CBC/GCM、填充或密文封装。业务应选成熟 mode/AEAD crate，并为完整协议做互操作测试。

## SM2 选型

Rust 国密生态存在 `libsm`、其他 SM2 crate 及 OpenSSL/GmSSL 绑定，不同项目的维护状态和数据格式差异明显。本仓库当前不对某个 Rust SM2 库做发布级兼容承诺，因此本页不放未经 CI 编译的大段 SM2 样例。

选择后必须冻结：公私钥编码、C1 布局、密文排列、签名 raw/DER、userId、输入编码，并验证双向加解密与验签。FFI 绑定还需核对 native 库版本、错误码和内存所有权。

## 工程约束

- 提交 `Cargo.lock`，CI 使用 `cargo test --locked`。
- 不在业务层手写 padding、MAC 或 ASN.1。
- 对 secret 类型启用可用的 `zeroize` feature，但要理解这不能清除所有复制和日志。
- 升级 RustCrypto 主次版本时按 breaking change 处理并重新编译示例。
