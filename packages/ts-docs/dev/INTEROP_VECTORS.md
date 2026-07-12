---
title: GMKit 跨语言互操作向量
icon: link
order: 99
---

# GMKit 跨语言互操作向量

根目录 `vectors/interop.json` 是 Java 与 TypeScript 共享的协议数据。它用于验证密文、摘要、MAC 和格式边界，不表示两端具有相同 API 或 ABI。

## 自动化消费方

| 实现 | 测试 |
|:--|:--|
| TypeScript | `packages/ts/test/interop-compliance.test.ts` |
| Java | `packages/java/gmkit/src/test/java/cn/gmkit/InteropComplianceTest.java` |

```bash
# 两端共享向量
npm run parity

# 单独验证
npm test -w packages/ts -- interop-compliance
mvn -f packages/java/pom.xml -B -ntp -pl gmkit -Dtest=InteropComplianceTest test
```

## 向量分类

- 没有 `source` 或写明 `source: "project"` 的值是项目回归向量，用于 Java/TS 字节级对齐。
- 写明标准来源的值才是外部固定向量。当前 ZUC 包含 3GPP TS 35.221 EEA3 和 TS 35.222 EIA3 关键向量。
- SM2 加密和签名含随机数。未固定随机源时不比较完整密文或签名字面值，只验证解密结果、验签结果及篡改拒绝。
- 字符串统一使用 UTF-8，二进制字段使用小写 hex。

## 字段边界

| 算法 | 必须固定的字段 |
|:--|:--|
| SM2 | `mode`、userId、raw/DER、hex/base64、公钥表示 |
| SM3 | UTF-8/原始字节输入与 hex/base64 输出 |
| SM4 | `mode`、`padding`、key、IV/nonce、AAD、tag 长度 |
| ZUC | key、IV、COUNT、BEARER、DIRECTION、`bitLength`，以及 `eea3`/`eea3-encrypt` 操作语义 |

ZUC 的 `count` 在 JSON 中以十进制数保存，含义是 API 接收的 32-bit 整数，不是按宿主机端序解释的四字节数组。

## TypeScript 固定断言

`sm4Encrypt` 返回对象，比较固定密文时必须读取 `result.ciphertext`：

```ts
import {
  CipherMode,
  PaddingMode,
  eia3,
  hexToBytes,
  sm3Digest,
  sm4Encrypt,
} from 'gmkitx';

const sm3 = sm3Digest('abc');
if (sm3 !== '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') {
  throw new Error(`SM3 vector mismatch: ${sm3}`);
}

const sm4 = sm4Encrypt(
  '0123456789abcdeffedcba9876543210',
  hexToBytes('0123456789abcdeffedcba9876543210'),
  { mode: CipherMode.ECB, padding: PaddingMode.NONE },
);
if (sm4.ciphertext !== '681edf34d206965e86b3e94f536e4246') {
  throw new Error(`SM4 vector mismatch: ${sm4.ciphertext}`);
}

const mac = eia3(
  '000102030405060708090a0b0c0d0e0f',
  0x01234567,
  0x0a,
  0,
  hexToBytes('5bad724710ba1c56'),
  64,
);
if (mac !== '1b3d0f74') {
  throw new Error(`EIA3 vector mismatch: ${mac}`);
}
```

这里使用 `throw` 而不是只打印结果或调用 `console.assert`，以便样例在不符合预期时以非零状态退出。

## Java 固定断言

```java
import cn.gmkit.core.HexCodec;
import cn.gmkit.sm3.SM3Util;
import cn.gmkit.zuc.ZUC;

String sm3 = SM3Util.digestHex("abc");
if (!"66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0".equals(sm3)) {
    throw new IllegalStateException("SM3 vector mismatch: " + sm3);
}

String mac = ZUC.eia3(
    "000102030405060708090a0b0c0d0e0f",
    0x01234567,
    0x0a,
    0,
    HexCodec.decodeStrict("5bad724710ba1c56", "EIA3 message"),
    64);
if (!"1b3d0f74".equals(mac)) {
    throw new IllegalStateException("EIA3 vector mismatch: " + mac);
}
```

## 修改规则

1. 增加标准向量时填写准确 `source`。
2. 字段新增保持向后兼容；重命名或删除必须同步修改 Java、TypeScript 测试和 CHANGELOG。
3. 任何确定性期望值变更都应先由外部标准或独立成熟实现复核，不能只用本项目实现自证。
4. 提交前同时运行 `npm run parity` 和两端完整测试。
