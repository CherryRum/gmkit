---
title: Go 对接指南
icon: code
order: 5
category: [开发指南, 集成]
tag: [Go, SM3, SM4, 互操作]
---

# Go 对接指南

本页采用 `github.com/emmansun/gmsm v0.40.0`。仓库中的 `docs/site/examples/go` 会真实编译并核对 SM3、SM4 标准向量；这证明固定算法结果一致，不代表该库与 gmkitx 的 API、默认值或全部协议行为相同。

## 安装与验证

```bash
cd docs/site/examples/go
go test ./...
```

```go
package main

import (
    "encoding/hex"
    "fmt"

    "github.com/emmansun/gmsm/sm3"
    "github.com/emmansun/gmsm/sm4"
)

func main() {
    digest := sm3.Sum([]byte("abc"))
    if hex.EncodeToString(digest[:]) != "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0" {
        panic("SM3 vector mismatch")
    }

    key, _ := hex.DecodeString("0123456789abcdeffedcba9876543210")
    plain, _ := hex.DecodeString("0123456789abcdeffedcba9876543210")
    block, err := sm4.NewCipher(key)
    if err != nil { panic(err) }
    output := make([]byte, block.BlockSize())
    block.Encrypt(output, plain)
    if hex.EncodeToString(output) != "681edf34d206965e86b3e94f536e4246" {
        panic("SM4 vector mismatch")
    }
    fmt.Println("Go vectors passed")
}
```

完整测试源码位于 `docs/site/examples/go/vectors_test.go`，`go.sum` 固定依赖校验值。

## 互操作协议

| 算法 | 两端必须固定 |
|:--|:--|
| SM2 加密 | `C1C3C2`/`C1C2C3`、C1 是否含 `04`、raw/ASN.1、hex/base64 |
| SM2 签名 | userId、raw/DER、消息原始字节 |
| SM3/HMAC | UTF-8 或原始字节、HMAC key 原始字节、输出编码 |
| SM4 | mode、padding、IV/nonce、AAD、tag 长度和 tag 布局 |

Go `cipher.Block` 只实现单分组原语。CBC、CTR、填充和认证必须选择标准库或成熟库的对应模式；不要自行拼接不带认证的“业务加密协议”。

## SM2 注意事项

不同 Go 国密库的 SM2 公钥、私钥、密文和签名类型差异较大。对接时先用固定私钥导出同一公钥，再分别完成：

1. gmkitx 加密、Go 解密；Go 加密、gmkitx 解密。
2. gmkitx 签名、Go 验签；Go 签名、gmkitx 验签。
3. 篡改消息、签名、密文后两端都必须拒绝。

随机 SM2 密文和签名不能按字面值相等来判断互操作。共享边界见[互操作向量](/dev/INTEROP_VECTORS)。

## 版本策略

- 固定模块版本并提交 `go.sum`。
- 升级依赖后重新运行本页 fixture 和业务协议测试。
- Go 示例测试不是 gmkitx 发布包的一部分，只用于验证文档所声明的外部库调用。
