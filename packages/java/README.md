# GMKit - 国密算法 Java 工具库

[![License](https://img.shields.io/badge/license-Apache%202-blue.svg)](LICENSE)
[![JDK](https://img.shields.io/badge/JDK-1.8+-green.svg)](https://www.oracle.com/java/technologies/javase-downloads.html)

GMKit 是一个基于 BouncyCastle 的国密算法工具库，提供 SM2、SM3、SM4 的对象式/静态工具 API，并提供 ZUC-128 静态 API，兼容 JDK 8+。SM9 以独立模块通过 JNI 桥接 GmSSL native 实现。

## 特性

- 单一运行时 artifact，接入和发布更简单
- SM2、SM3、SM4 保留对象式和静态工具式两套调用方式；ZUC 提供主入口类和工具类静态 API
- `SM2Util`、`SM3Util`、`SM4Util`、`ZUCUtil` 作为静态工具入口，适合原有工具类调用习惯
- 内部按职责拆分实现，外部 API 保持直接、清晰
- 对常见空输入、格式错误和 Provider 问题统一抛出双语 `GmkitException`
- 内置测试覆盖 SM2/SM3/SM4/ZUC 常见路径、Unicode 输入、错误语义和跨 JDK 场景

## 支持算法

| 算法  | 说明         | 主入口                |
|-----|------------|--------------------|
| SM2 | 椭圆曲线公钥密码算法 | `cn.gmkit.sm2.SM2` |
| SM3 | 密码杂凑算法     | `cn.gmkit.sm3.SM3` |
| SM4 | 分组密码算法     | `cn.gmkit.sm4.SM4` |
| ZUC | ZUC-128 密钥流、标准 EEA3 消息加密、EIA3 MAC；保留旧 EEA3 密钥流入口 | `cn.gmkit.zuc.ZUC` |
| SM9 | 标识密码算法（签名/验签、IBE 加解密） | `cn.gmkit.sm9.SM9`（独立模块 `gmkit-sm9`，JNI 桥接 GmSSL） |

> SM2/SM3/SM4 为纯 Java（BouncyCastle）实现，ZUC 为主包内纯 Java 实现；SM9 通过 JNI 桥接 GmSSL native 实现，
> 只需引入独立的 `gmkit-sm9` 模块，不需要再选择平台依赖，详见
> [SM9 标识密码（JNI）](#sm9-标识密码jni)。

## Maven 引入

```xml
<dependency>
    <groupId>cn.gmkit</groupId>
    <artifactId>gmkit</artifactId>
    <version>0.10.0</version>
</dependency>
```


## 快速开始

### SM2 对象式

```java
import cn.gmkit.core.SM2CipherMode;
import cn.gmkit.core.SM2SignatureFormat;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm2.SM2SignOptions;

import java.nio.charset.StandardCharsets;

SM2 sm2 = new SM2();
SM2KeyPair keyPair = sm2.generateKeyPair(false);
byte[] plaintext = "Hello GMKit!".getBytes(StandardCharsets.UTF_8);

byte[] ciphertext = sm2.encrypt(keyPair.publicKey(), plaintext, SM2CipherMode.C1C3C2);
byte[] decrypted = sm2.decrypt(keyPair.privateKey(), ciphertext, SM2CipherMode.C1C3C2);

byte[] signature = sm2.sign(
    keyPair.privateKey(),
    plaintext,
    SM2SignOptions.builder()
        .signatureFormat(SM2SignatureFormat.RAW)
        .build());
boolean valid = sm2.verify(keyPair.publicKey(), plaintext, signature);
```

说明：SM2 加密要求明文至少包含 1 个字节；传入空字符串或空字节数组时会直接抛出 `GmkitException`，而不会进入底层 Provider。

### SM3 对象式

```java
import cn.gmkit.sm3.SM3;

import java.nio.charset.StandardCharsets;

SM3 sm3 = new SM3();
String hash = sm3.digestHex("Hello GMKit!");
String hmac = sm3.hmacHex("secret".getBytes(StandardCharsets.UTF_8), "Hello GMKit!");
```

### SM4 对象式

```java
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;
import cn.gmkit.sm4.SM4;
import cn.gmkit.sm4.SM4CipherResult;
import cn.gmkit.sm4.SM4Options;

import java.nio.charset.StandardCharsets;

SM4 sm4 = new SM4();
byte[] key = sm4.generateKey();
byte[] iv = new byte[16];

SM4Options options = SM4Options.builder()
    .mode(SM4CipherMode.CBC)
    .padding(SM4Padding.PKCS7)
    .iv(iv)
    .build();

SM4CipherResult encrypted = sm4.encrypt(key, "Hello GMKit!".getBytes(StandardCharsets.UTF_8), options);
String decrypted = sm4.decryptToUtf8(key, encrypted, options);
```

### ZUC 静态工具式

```java
import cn.gmkit.zuc.ZUC;

String keyHex = "00112233445566778899aabbccddeeff";
String ivHex = "ffeeddccbbaa99887766554433221100";

String ciphertext = ZUC.encryptHex(keyHex, ivHex, "中文 + emoji 😊");
String plaintext = ZUC.decryptHexToUtf8(keyHex, ivHex, ciphertext);
String keystream = ZUC.keystreamHex(keyHex, ivHex, 32);
String eea3Keystream = ZUC.eea3(keyHex, 0x398a59b4, 0x15, 1, 96);
String mac = ZUC.eia3(keyHex, 0x398a59b4, 0x15, 1, "payload");
```

说明：当前 ZUC 只实现 ZUC-128，key 与 iv 均为 16 字节。旧 `eea3(...)` 为兼容入口，只返回按 32-bit word 对齐的密钥流；标准消息加密使用 `eea3Encrypt(...)`，完整性标签使用 `eia3(...)`。ZUC 通用加密本身不提供完整性保护，业务数据建议优先使用 SM4-GCM/CCM。

3GPP TS 35.222 固定向量可直接验证：

```java
import cn.gmkit.core.HexCodec;
import cn.gmkit.zuc.ZUC;

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

### 静态工具式

```java
import cn.gmkit.sm2.SM2Util;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm3.SM3Util;
import cn.gmkit.sm4.SM4Util;
import cn.gmkit.zuc.ZUCUtil;

SM2KeyPair keyPair = SM2Util.generateKeyPair(false);
String hash = SM3Util.digestHex("Hello GMKit!");
byte[] key = SM4Util.generateKey();
String zucCipher = ZUCUtil.encryptHex(
    "00112233445566778899aabbccddeeff",
    "ffeeddccbbaa99887766554433221100",
    "Hello ZUC");
```

### 后端混合加密封装（SM2 + SM4）

后端常见场景是：用 `SM2` 保护一次性 `SM4` 会话密钥，再用 `SM4` 加密业务数据。现在可以直接使用统一封装，避免业务层手工拼装多个字段。

```java
import cn.gmkit.integration.SM2Sm4Hybrid;
import cn.gmkit.integration.SM2Sm4HybridPayload;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;

SM2 sm2 = new SM2();
SM2KeyPair keyPair = sm2.generateKeyPair(false);
SM2Sm4Hybrid hybrid = new SM2Sm4Hybrid();

SM2Sm4HybridPayload payload = hybrid.encrypt(keyPair.publicKey(), "后端统一混合加密");
String plain = hybrid.decryptToUtf8(keyPair.privateKey(), payload);
```

默认情况下该封装会使用 `SM4-GCM + 随机 nonce + 16 字节 tag`，并把 `encryptedKey / ciphertext / iv / aad / tag / mode / padding`
统一放入 `SM2Sm4HybridPayload`，更适合后端服务间传输或落库。

## SM2 与 SM4 格式边界

### SM2

| 项目 | 当前行为 |
|------|----------|
| 公钥格式 | 支持非压缩 `04 || x || y` 与压缩 `02/03 || x`；`generateKeyPair(false)` 默认输出非压缩公钥 |
| 密文排列 | 默认 `C1C3C2`，可显式使用 `SM2CipherMode.C1C2C3` |
| 密文编码 | raw 密文字节以非压缩 C1 开头；`SM2Ciphertexts` 支持 DER/ASN.1 编解码辅助 |
| 签名格式 | 默认 RAW `r || s`，可指定 `SM2SignatureFormat.DER` |
| 用户 ID | 默认 `SM2.DEFAULT_USER_ID` (`1234567812345678`)；如需 GM/T 0009-2023 推荐空 ID，请显式传入 `""` |
| 输入边界 | SM2 加密不接受空明文；验签 wrong userId、错误签名、篡改消息均返回失败或抛出统一异常 |

### SM4

| mode | IV / nonce | padding | tag / AAD |
|------|------------|---------|-----------|
| `ECB` | 不使用 | `PKCS7` / `ZERO` / `NONE` | 无 |
| `CBC` | 16 字节 IV | `PKCS7` / `ZERO` / `NONE` | 无 |
| `CTR` / `CFB` / `OFB` | 16 字节 IV | 流式模式不做分组填充，建议 `NONE` | 无 |
| `GCM` | 12 字节 IV | `NONE` | tag 12-16 字节，默认 16；AAD 必须与解密端一致 |
| `CCM` | 7-13 字节 nonce，建议 12 | `NONE` | tag 4-16 字节偶数，默认 16；AAD 必须与解密端一致 |

`SM4CipherResult` 会拆出 AEAD 的 `ciphertext` 与 `tag`。解密时可以传入加密结果对象，也可以在 `SM4Options` 中显式传 `tag(...)` 与 `tagLength(...)`。

## SM9 标识密码（JNI）

SM9 以独立模块 `gmkit-sm9` 提供 Java API，通过 JNI 桥接 [GmSSL](https://github.com/guanzhi/GmSSL) v3.1.1
的 native 实现。与 GmSSL 一致，**仅支持签名/验签与基于身份的加密（IBE）加解密，不支持密钥交换**；
单次加密明文上限为 **255 字节**，更大数据请采用混合加密（如用 SM4 加密数据、用 SM9 封装 SM4 密钥）。
native 二进制不进入 `gmkit` 主包，而是随独立的 `gmkit-sm9` JAR 一次性交付。未使用 SM9 的项目只依赖 `gmkit`，不会下载这些文件；使用 SM9 的项目只需增加一个依赖。

### Maven 引入

推荐使用 BOM 统一版本。`gmkit-sm9` 已包含支持平台的 JNI 桥接库和 GmSSL 动态库：

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>cn.gmkit</groupId>
            <artifactId>gmkit-bom</artifactId>
            <version>0.10.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>cn.gmkit</groupId>
        <artifactId>gmkit-sm9</artifactId>
    </dependency>
</dependencies>
```

不用 BOM 时直接给 `gmkit-sm9` 指定版本：

```xml
<dependency>
    <groupId>cn.gmkit</groupId>
    <artifactId>gmkit-sm9</artifactId>
    <version>0.10.0</version>
</dependency>
```

对于自行编译的平台或特殊部署，可使用
`-Dgmkit.sm9.native.path=/abs/path/to/libgmkitsm9.so`（Windows 为 `gmkitsm9.dll`）
显式指定桥接库路径。桥接库同目录应放置匹配的 GmSSL 动态库。

### 签名 / 验签

```java
import cn.gmkit.sm9.SM9;
import cn.gmkit.sm9.SM9SignKey;
import cn.gmkit.sm9.SM9SignMasterKey;

import java.nio.charset.StandardCharsets;

byte[] data = "Hello GMKit SM9!".getBytes(StandardCharsets.UTF_8);
try (SM9SignMasterKey master = SM9.generateSignMasterKey();
     SM9SignKey signKey = master.extractKey("alice@example.com")) {
    byte[] signature = SM9.sign(signKey, data);
    boolean ok = SM9.verify(master, "alice@example.com", data, signature);
}
```

### 加密 / 解密（IBE）

```java
import cn.gmkit.sm9.SM9;
import cn.gmkit.sm9.SM9EncKey;
import cn.gmkit.sm9.SM9EncMasterKey;

try (SM9EncMasterKey master = SM9.generateEncMasterKey();
     SM9EncKey encKey = master.extractKey("bob@example.com")) {
    byte[] ciphertext = SM9.encrypt(master, "bob@example.com", plaintext);
    byte[] decrypted = SM9.decrypt(encKey, ciphertext);
}
```

> 所有密钥与签名/验签上下文都实现了 `AutoCloseable`，持有 native 资源，建议使用
> try-with-resources 及时释放。大数据可使用 `SM9Signature` 的流式 `update` 接口。

### 平台支持矩阵

| 平台标识 | 操作系统 / 架构 | 桥接库 | 依赖库 |
|---------|----------------|--------|--------|
| `linux-x86_64`   | Linux x86_64   | `libgmkitsm9.so`    | `libgmssl.so.3`   |
| `linux-aarch64`  | Linux ARM64    | `libgmkitsm9.so`    | `libgmssl.so.3`   |
| `darwin-x86_64`  | macOS Intel    | `libgmkitsm9.dylib` | `libgmssl.3.dylib`|
| `darwin-aarch64` | macOS Apple 芯片 | `libgmkitsm9.dylib` | `libgmssl.3.dylib`|
| `windows-x86_64` | Windows x86_64 | `gmkitsm9.dll`      | `gmssl.dll`       |

native 库由 `cn.gmkit.sm9.SM9NativeLoader` 按 `os.name` / `os.arch` 自动选择并加载，
加载顺序为：`-Dgmkit.sm9.native.path` 指定路径 → `java.library.path`（系统已安装）→
JAR 内置 `native/{平台}/` 资源。当前平台无可用 native 库时，`SM9.isAvailable()` 返回 `false`。
JAR 中其他平台的文件不会被加载到内存。除上表列出的五类平台标识外，当前没有内置 runtime；这些平台需要自行编译并通过 `gmkit.sm9.native.path` 或 `java.library.path` 加载，否则会返回明确的不支持错误。

### SM9 native 构建

仓库提供 `scripts/sm9-native.ps1` 做完整 native 构建闭环：拉取 GmSSL、构建 GmSSL 共享库、构建
`gmkitsm9` JNI 桥接库、把当前平台文件写入 `gmkit-sm9` 的生成资源目录，并用
`-Dgmkit.sm9.requireNative=true` 强制运行 SM9 native 测试。

```powershell
# 当前平台构建、写入 gmkit-sm9、打包并强制测试
./scripts/sm9-native.ps1 -Platform current -Stage -PackageRuntime -Test

# 指定平台，例如 Windows x86_64
./scripts/sm9-native.ps1 -Platform windows-x86_64 -Stage -PackageRuntime -Test
```

脚本产物位于 `packages/java/target/sm9-native/{平台}/runtime/`，并在 `-Stage` 时复制到：

```text
packages/java/gmkit-sm9/target/generated-resources/sm9-runtime/native/{平台}/
```

构建前请准备 Git、CMake、JDK、Maven 和当前平台可用的 C 编译器；Windows 需要 Visual Studio C++ Build Tools。
CI 的 `sm9-native.yml` 在 Linux、macOS、Windows 上构建并强制跑 native 测试。Java 发布流程会收集五个平台文件，生成来源与 SHA-256 清单，组装单一 `gmkit-sm9` JAR，再由五个平台分别消费该 JAR。

如果你已经有自行构建的 native 库，也可以覆盖 JAR 内置资源，使用
`-Dgmkit.sm9.native.path=/abs/path/to/libgmkitsm9.so`（Windows 为 `gmkitsm9.dll`）
显式指定桥接库路径。桥接库同目录应放置对应 GmSSL 动态库，例如 Windows 的 `gmssl.dll`。

## 迁移说明

- `SM2`、`SM3`、`SM4`、`ZUC` 为主入口；其中 ZUC 当前为静态 API。
- `SM2Util`、`SM3Util`、`SM4Util`、`ZUCUtil` 为静态工具入口，适合工具类调用风格。
- `SM2EncryptOptions`、`SM2DecryptOptions`、`SM4DecryptOptions` 已移除：
    - SM2 加解密改为默认重载或直接传 `SM2CipherMode`
    - SM4 解密和加密统一使用 `SM4Options`，AEAD tag 通过 `tag(...)` 传入
- 所有公开命名统一使用大写缩写 `SM*` 风格，例如 `SM2KeyPair`、`SM4Options`。
- 未发布阶段移除了前缀式兼容别名，公开 API 统一收敛为 `SM2/SM3/SM4/ZUC` 与 `SM2Util/SM3Util/SM4Util/ZUCUtil` 两套主入口。

## 编码与格式工具

如果需要在后端侧统一处理 Hex / Base64 输入输出，可直接使用 `ByteEncodings`、`InputFormat`、`OutputFormat`：

```java
import cn.gmkit.core.ByteEncodings;
import cn.gmkit.core.InputFormat;
import cn.gmkit.core.OutputFormat;

String base64 = ByteEncodings.encode("abc".getBytes(StandardCharsets.UTF_8), OutputFormat.BASE64);
byte[] decoded = ByteEncodings.decode(base64, InputFormat.BASE64, "payload");
```

## 仓库结构

```text
packages/java/
├── gmkit/               # 主运行时模块（SM2/SM3/SM4/ZUC）
├── gmkit-sm9/           # SM9 Java API、JNI C 源码与聚合多平台 runtime
│   └── src/main/c/      # JNI C 源码与 CMakeLists.txt
├── gmkit-benchmarks/    # JMH 性能基线模块
│   └── src/
├── docs/
├── pom.xml              # 父工程
└── README.md
```

## 构建

```bash
mvn -f packages/java/pom.xml clean test
mvn -f packages/java/pom.xml -DskipTests verify
mvn -f packages/java/pom.xml -pl gmkit-benchmarks -am -DskipTests package
```

## 性能基线

JMH 基准已拆到独立模块 `gmkit-benchmarks`，用于固定 SM2、SM3、SM4 的吞吐与延迟指标；ZUC 基准尚未补入。

```bash
java -jar packages/java/gmkit-benchmarks/target/gmkit-benchmarks-<version>.jar ".*SM3.*" -bm thrpt -tu s -wi 3 -i 5 -f 1
```

完整说明见 [docs/performance.md](docs/performance.md)。

## GitHub Actions

仓库已提供 monorepo CI、互操作 parity、SM9 native、Java 发布工作流，使用方法见 [docs/github-actions.md](docs/github-actions.md)。

普通 Java CI 不要求 native runtime；没有可用 GmSSL/JNI 时，SM9 native 相关测试会通过 assumptions 跳过。
`sm9-native.yml` 是专门的强制 native 作业，会在 Linux、macOS、Windows 上编译 GmSSL/JNI runtime 后运行 SM9 模块的全部功能测试。
因此普通本地发布前检查无需准备 JNI/GmSSL；SM9 平台交付由 GitHub Actions 的专用矩阵负责阻断验证。

## 许可证

本项目采用 [Apache License 2.0](LICENSE) 开源协议。
