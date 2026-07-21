---
title: 集成示例
description: 按目标语言和协议能力选择可执行示例，并明确第三方库、版本和互操作证据边界。
icon: code
category:
  - 集成示例
tag:
  - 互操作
  - 示例
  - 测试向量
---

# 集成示例

这里展示 GMKit 与其他运行时的协议对接方式。第三方库示例用于锁定字段与编码，不表示 GMKit 发布对应语言的包，也不替代对第三方依赖版本、安全公告和维护状态的评估。

## 按目标选择

<ApiTable label="第三方集成示例" min-width="70rem">

| 目标 | 示例 | 当前验证重点 |
|:--|:--|:--|
| Java 项目已有 Hutool/Bouncy Castle | [Java 与 Hutool/Bouncy Castle](/integrations/java-hutool.html) | SM2 密文排列、签名格式、Provider 与迁移边界 |
| Go 服务对接 | [Go](/integrations/go.html) | 固定依赖版本、Hex/UTF-8 和共享向量 |
| Python 工具或服务对接 | [Python](/integrations/python.html) | `gmssl` 版本、输入编码和 SM2/SM3/SM4 边界 |
| Rust 服务对接 | [Rust](/integrations/rust.html) | `sm3`/`sm4` crate 版本与确定性结果 |
| Node.js 使用国际算法 | [Web Crypto](/integrations/web-crypto.html) | Web Crypto 原生能力与 gmkitx 的职责边界 |
| Java 与 TypeScript 互相验证 | [共享测试向量](/standards/interop-vectors.html) | 同一字段集合在两端得到相同确定性结果 |

</ApiTable>

## 对接前先固定协议

不要直接复制一段代码后再猜对端参数。双方至少明确：

1. 算法、工作模式、padding 与协议版本。
2. 文本是否为 UTF-8，二进制是否使用 Hex 或 Base64。
3. SM2 的 `userId`、C1C3C2/C1C2C3、公钥压缩与 raw/DER 签名格式。
4. SM4 的 IV/nonce、AAD、tag 长度及其传输位置。
5. ZUC 的 byte、word、bit 长度单位以及 EEA3/EIA3 字段。
6. 认证失败、输入非法和版本不匹配时的统一失败语义。

## 验证证据怎样看

文档 CI 会执行仓库中登记的示例 fixture。“能够运行”只证明固定依赖版本、固定输入和已覆盖路径通过，不能推导为其他版本、其他参数组合或未登记平台也能互操作。

建议按以下顺序验收：

1. 用固定向量验证确定性算法和编码。
2. 由 A 端生成随机签名或密文，让 B 端验证或解密。
3. 交换方向再执行一次。
4. 篡改 message、AAD、tag、签名或密文，确认对端拒绝。
5. 将最终字段定义与依赖版本固化到业务协议。

协议字段见[算法与协议能力](/algorithms/)，输入格式见[公共输入与安全约定](/api/common.html)，排障见[常见问题与故障排查](/guide/troubleshooting.html)。
