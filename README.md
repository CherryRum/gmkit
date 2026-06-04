# GMKit - 国密算法 Java 工具库

[![License](https://img.shields.io/badge/license-Apache%202-blue.svg)](LICENSE)
[![JDK](https://img.shields.io/badge/JDK-1.8+-green.svg)](https://www.oracle.com/java/technologies/javase-downloads.html)

GMKit 是一个基于 BouncyCastle 的国密算法工具库，提供 SM2、SM3、SM4 的对象式 API 和静态工具 API，兼容 JDK 8+。

## 特性

- 单一运行时 artifact，接入和发布更简单
- 一个算法一个主入口类，同时保留对象式和静态工具式两套调用方式
- `SM2Util`、`SM3Util`、`SM4Util` 作为静态工具入口，适合原有工具类调用习惯
- 内部按职责拆分实现，外部 API 保持直接、清晰
- 对常见空输入、格式错误和 Provider 问题统一抛出双语 `GmkitException`
- 内置测试覆盖 SM2/SM3/SM4 常见路径、错误语义和跨 JDK 场景

## 支持算法

| 算法  | 说明         | 主入口                |
|-----|------------|--------------------|
| SM2 | 椭圆曲线公钥密码算法 | `cn.gmkit.sm2.SM2` |
| SM3 | 密码杂凑算法     | `cn.gmkit.sm3.SM3` |
| SM4 | 分组密码算法     | `cn.gmkit.sm4.SM4` |
| SM9 | 标识密码算法（签名/验签、IBE 加解密） | `cn.gmkit.sm9.SM9`（独立模块 `gmkit-sm9-native`，JNI 桥接 GmSSL） |

> SM2/SM3/SM4 为纯 Java（BouncyCastle）实现；SM9 通过 JNI 桥接 GmSSL native 实现，
> 需引入独立的 `gmkit-sm9-native` 模块并提供对应平台的 native 库，详见
> [SM9 标识密码（JNI）](#sm9-标识密码jni)。

## Maven 引入

```xml
<dependency>
    <groupId>cn.gmkit</groupId>
    <artifactId>gmkit</artifactId>
    <version>0.10.0-SNAPSHOT</version>
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

### 静态工具式

```java
import cn.gmkit.sm2.SM2Util;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm3.SM3Util;
import cn.gmkit.sm4.SM4Util;

SM2KeyPair keyPair = SM2Util.generateKeyPair(false);
String hash = SM3Util.digestHex("Hello GMKit!");
byte[] key = SM4Util.generateKey();
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

## SM9 标识密码（JNI）

SM9 以独立模块 `gmkit-sm9-native` 提供，通过 JNI 桥接 [GmSSL](https://github.com/guanzhi/GmSSL) v3.1.1
的 native 实现。与 GmSSL 一致，**仅支持签名/验签与基于身份的加密（IBE）加解密，不支持密钥交换**；
单次加密明文上限为 **255 字节**，更大数据请采用混合加密（如用 SM4 加密数据、用 SM9 封装 SM4 密钥）。

### Maven 引入

```xml
<dependency>
    <groupId>cn.gmkit</groupId>
    <artifactId>gmkit-sm9-native</artifactId>
    <version>0.10.0-SNAPSHOT</version>
</dependency>
```

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

### SM9 本地编译

GmSSL 没有发布到 Maven Central，native 库需自行编译。先安装 GmSSL v3.1.1：

```bash
git clone --depth 1 --branch v3.1.1 https://github.com/guanzhi/GmSSL.git
cmake -S GmSSL -B GmSSL/build -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=ON
cmake --build GmSSL/build -j
sudo cmake --install GmSSL/build
```

再编译 JNI 桥接库（产物位于 `gmkit-sm9-native/target/native-build/`）：

```bash
mvn -pl gmkit-sm9-native -Pnative-build -Dgmssl.root=/usr/local process-classes
```

将桥接库与 `gmssl` 依赖库复制到对应平台目录
`gmkit-sm9-native/src/main/resources/native/{平台}/` 后，即可被打包与加载。
各平台的 native 库也可由 GitHub Actions 工作流 `build-native.yml` 自动构建。

## 迁移说明

- `SM2`、`SM3`、`SM4` 为对象式主入口，适合通过 `new` 绑定上下文或复用实例。
- `SM2Util`、`SM3Util`、`SM4Util` 为静态工具入口，适合工具类调用风格。
- `SM2EncryptOptions`、`SM2DecryptOptions`、`SM4DecryptOptions` 已移除：
    - SM2 加解密改为默认重载或直接传 `SM2CipherMode`
    - SM4 解密和加密统一使用 `SM4Options`，AEAD tag 通过 `tag(...)` 传入
- 所有公开命名统一使用大写缩写 `SM*` 风格，例如 `SM2KeyPair`、`SM4Options`。
- 未发布阶段移除了前缀式兼容别名，公开 API 统一收敛为 `SM2/SM3/SM4` 与 `SM2Util/SM3Util/SM4Util` 两套主入口。

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
gmkit-java/
├── gmkit/               # 单一运行时模块（SM2/SM3/SM4，纯 Java）
├── gmkit-sm9-native/    # SM9 模块（JNI 桥接 GmSSL）
│   └── src/main/c/      # JNI C 源码与 CMakeLists.txt
├── gmkit-benchmarks/    # JMH 性能基线模块
│   └── src/
├── docs/
├── pom.xml              # 父工程
└── README.md
```

## 构建

```bash
mvn clean test
mvn -DskipTests verify
mvn -pl gmkit-benchmarks -am -DskipTests package
```

## 性能基线

JMH 基准已拆到独立模块 `gmkit-benchmarks`，用于固定 SM2、SM3、SM4 的吞吐与延迟指标。

```bash
java -jar gmkit-benchmarks/target/gmkit-benchmarks-0.10.0-SNAPSHOT.jar ".*SM3.*" -bm thrpt -tu s -wi 3 -i 5 -f 1
```

完整说明见 [docs/performance.md](docs/performance.md)。

## GitHub Actions

仓库已提供 CI、Release Verify、GitHub Packages 发布和 Maven Central 发布工作流，使用方法见 [docs/github-actions.md](docs/github-actions.md)。

此外，`build-native.yml` 用于在各平台从 GmSSL v3.1.1 源码编译 SM9 native 库；CI 中的 `sm9-native`
作业会在 Linux / macOS 上编译 GmSSL 后运行 SM9 模块的全部功能测试。

## 许可证

本项目采用 [Apache License 2.0](LICENSE) 开源协议。
