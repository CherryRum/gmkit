# GMKit — 国密算法多语言工具库

GMKit 提供 SM2 / SM3 / SM4 / SM9 / ZUC 的多语言实现，本仓库以
多语言 monorepo 形式同时维护 Java 与 TypeScript 两个栈。

> 当前处于 0.x 阶段，重点保证常用算法的可用性、测试覆盖和跨语言互通；
> 不同语言实现的支持范围不完全相同，详见下方支持矩阵。

## 支持矩阵

| 算法    | Java | TypeScript | 说明 |
| ------- | ---- | ---------- | ---- |
| SM2     | 支持 | 支持       | 注意密文格式（C1C3C2 / C1C2C3）和签名格式（raw / DER） |
| SM3     | 支持 | 支持       | 摘要 / HMAC，建议统一使用 hex 输出 |
| SM4     | 支持 | 支持       | 注意 mode、padding、iv、tag；当前 ECB/PKCS7 存在已知跨语言差异，详见 CHANGELOG |
| SM9     | 支持 | 不支持     | Java 通过 JNI 调用 GmSSL v3.1.1；TS 侧不计划包装 native/WASM |
| ZUC     | 支持 | 支持       | ZUC-128（含 EEA3 / EIA3），ZUC-256 暂不支持 |
| SHA-2   | —    | 支持       | SHA-1/256/384/512 + HMAC；Java 侧直接用 JDK 自带 |

## 仓库结构

```
gmkit/                              ← git root
├── .github/workflows/
│   ├── ts-*.yml                    ← TS CI / publish / docs
│   ├── java-*.yml                  ← Java CI / publish / native build
│   └── parity.yml                  ← 跨语言互通向量校验
├── ts/                             ← TypeScript / npm 包 gmkitx
├── java/                           ← Java / Maven cn.gmkit:gmkit
└── vectors/                        ← 共享测试向量（两栈均消费）
```

详细文档：`ts/README.md`、`java/README.md`、`vectors/README.md`。

## 快速开始

```bash
make verify          # 跑两栈所有测试 + parity
make test-ts         # 仅 TS
make test-java       # 仅 Java
make parity          # 仅 parity 互通向量
```

或手动：

```bash
cd ts   && npm ci && npm test && npm run build
cd java && mvn -B test
```

## 许可证

Apache License 2.0 — 见 LICENSE。