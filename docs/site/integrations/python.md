---
title: Python 对接指南
description: 使用固定 gmssl 版本对照 GMKit 的 SM2、SM3、SM4、编码和互操作边界。
icon: code
order: 6
category: [集成示例, Python]
tag: [Python, gmssl, SM3, SM4]
---

# Python 对接指南

本页采用 `gmssl==3.2.2`。该包 API 较底层且版本行为有限，适合已有系统互操作验证，不应据此推导其已完成独立安全审计。仓库 fixture 使用隔离虚拟环境安装固定版本。

## 安装与验证

```bash
python -m venv .venv
# Windows: .venv\Scripts\python -m pip install -r requirements.txt
# Linux/macOS: .venv/bin/python -m pip install -r requirements.txt
python verify_vectors.py
```

仓库统一命令：

```bash
npm run docs:test-examples
```

核心示例：

```python
from gmssl import func, sm3, sm4

digest = sm3.sm3_hash(func.bytes_to_list(b"abc"))
expected_sm3 = "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0"
if digest != expected_sm3:
    raise AssertionError(f"SM3 vector mismatch: {digest}")

key = bytes.fromhex("0123456789abcdeffedcba9876543210")
plain = bytes.fromhex("0123456789abcdeffedcba9876543210")
cipher = sm4.CryptSM4()
cipher.set_key(key, sm4.SM4_ENCRYPT)
encrypted = bytes(cipher.crypt_ecb(plain))
if encrypted[:16].hex() != "681edf34d206965e86b3e94f536e4246":
    raise AssertionError("SM4 vector mismatch")
```

`CryptSM4()` 必须先调用 `set_key()`。`crypt_ecb()` 默认加入填充，因此固定单分组向量只比较第一分组；业务协议应显式测试完整填充和解密行为。

## SM2 边界

Python `gmssl` 常见 SM2 接口使用裸 hex 私钥、公钥和整数 `mode`，但不同版本对 C1 前缀、C1C2C3/C1C3C2、签名是否预摘要的约定不直观。不要仅凭“都叫 SM2”直接上线。

至少固定：

- 公钥是 `x || y` 还是 `04 || x || y`。
- 密文是 C1C3C2 还是 C1C2C3，C1 是否携带 `04`。
- 签名是 raw `r || s` 还是 DER。
- 是否计算 `SM3(ZA || M)`，以及双方 userId。

跨语言测试必须同时做双向加解密、双向签名验签和篡改拒绝。普通 SM3 摘要不能用于存储用户密码。

## 版本与部署

- 固定 `requirements.txt`，在 CI 中从干净 venv 安装。
- 不把私钥写进源码、日志或测试失败输出。
- 升级 `gmssl` 后先跑 fixture，再跑业务级 SM2/SM4 协议测试。
