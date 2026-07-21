---
title: SM9 标识密码算法
description: 说明 Java SM9 独立模块的签名、IBE、native runtime、平台和资源生命周期。
icon: key
order: 5
category: [算法]
tag: [SM9, Java, JNI, GmSSL]
---

# SM9 标识密码算法

SM9 当前只由 Java 模块 `cn.gmkit:gmkit-sm9:0.10.1` 提供。该模块通过 JNI 调用 GmSSL 本地动态库（native runtime），包含签名/验签、基于身份的加密/解密、PEM 导入导出和流式签名上下文；不提供密钥交换。`gmkitx` 没有 SM9 导出、WASM 占位或浏览器降级实现。

采用 SM9 需要的不只是算法库。项目应先确认对端协议与实现、KGC 主密钥隔离、身份登记和注销、公开主密钥分发、目标平台运行库以及适用的合规要求。下文只说明 GMKit 能验证的算法与工程边界，不替项目完成这些制度和基础设施决策。

完整句柄类型、诊断、签名、IBE、PEM、路径和大小限制见 [Java SM9 API](/api/java/sm9.html)。

## 依赖与平台

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit-sm9</artifactId>
  <version>0.10.1</version>
</dependency>
```

单个 JAR 包含以下 runtime；运行时只解压和加载当前平台资源：

| 平台标识 | GmSSL 动态库 | JNI 桥接库 |
|:--|:--|:--|
| `linux-x86_64` | `libgmssl.so.3` | `libgmkitsm9.so` |
| `linux-aarch64` | `libgmssl.so.3` | `libgmkitsm9.so` |
| `darwin-x86_64` | `libgmssl.3.dylib` | `libgmkitsm9.dylib` |
| `darwin-aarch64` | `libgmssl.3.dylib` | `libgmkitsm9.dylib` |
| `windows-x86_64` | `gmssl.dll` | `gmkitsm9.dll` |

其他操作系统或 CPU 架构会返回不支持错误。加载顺序为：

1. `-Dgmkit.sm9.native.path=<桥接库绝对路径>`；同目录存在 GmSSL 动态库时先尝试加载。
2. `System.loadLibrary("gmkitsm9")`，使用系统库路径。
3. 从 JAR 的 `native/{platform}/` 解压 GmSSL 与 JNI 文件到临时目录后加载。

## 可用性诊断

```java
import cn.gmkit.sm9.SM9;

if (!SM9.isAvailable()) {
    throw new IllegalStateException(
        "SM9 unavailable on " + SM9.nativePlatform() + ": " + SM9.nativeLoadErrorMessage());
}
System.out.println("SM9 bridge=" + SM9.nativeVersion() + ", platform=" + SM9.nativePlatform());
```

`nativeVersion()` 是 GMKit JNI 桥接版本标识，不应当作系统 GmSSL 命令行版本。正式测试若要求 SM9 可用，必须让 `isAvailable() == false` 导致测试失败，不能当作成功跳过。

## 公共类型与职责

| 类型 | 职责 | 资源所有权 |
|:--|:--|:--|
| `SM9` | 一次性门面：生成/派生、签名验签、IBE 加解密、运行时诊断 | 门面内部签名上下文自动关闭；传入密钥仍由调用方关闭 |
| `SM9SignMasterKey` | 签名主密钥或公开主密钥；派生用户签名私钥 | `AutoCloseable` |
| `SM9SignKey` | 绑定身份的用户签名私钥 | `AutoCloseable` |
| `SM9EncMasterKey` | 加密主密钥或公开主密钥；派生解密私钥并执行 IBE 加密 | `AutoCloseable` |
| `SM9EncKey` | 绑定身份的用户解密私钥 | `AutoCloseable` |
| `SM9Signature` | 可分块 update、reset、sign/verify 的 native 上下文 | `AutoCloseable` |
| `SM9Exception` | 参数、PEM、native 操作和已关闭句柄错误 | 运行时异常 |
| `SM9UnsupportedPlatformException` | 当前 OS/CPU 无内置或外部 runtime | `SM9Exception` 子类 |

所有持有 native handle 的对象都应使用 try-with-resources。`close()` 可重复调用；关闭后再次执行操作会抛出 `SM9Exception`。

## 签名与验签

KGC 保存签名主密钥私有部分并为身份派生用户签名私钥。验签方只需要签名公开主密钥、签名者身份、消息和签名。

```java
import cn.gmkit.sm9.*;
import java.nio.charset.StandardCharsets;

String id = "warehouse@gmkit.cn";
byte[] message = "order=GMKIT-DEMO-0001&amount=88.00".getBytes(StandardCharsets.UTF_8);
byte[] tampered = "order=GMKIT-DEMO-0001&amount=99.00".getBytes(StandardCharsets.UTF_8);

try (SM9SignMasterKey master = SM9.generateSignMasterKey();
     SM9SignKey signKey = master.extractKey(id)) {
    byte[] signature = SM9.sign(signKey, message);
    if (!SM9.verify(master, id, message, signature)) {
        throw new IllegalStateException("SM9 verify failed");
    }
    if (SM9.verify(master, "other@gmkit.cn", message, signature)
            || SM9.verify(master, id, tampered, signature)) {
        throw new IllegalStateException("SM9 accepted changed input");
    }
}
```

签名输出是 DER 编码。签名含随机性，不应固定完整字面值；测试应覆盖正确身份、错误身份、篡改消息和篡改签名。

## IBE 加密与解密

```java
import cn.gmkit.sm9.*;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

String id = "warehouse@gmkit.cn";
byte[] plaintext = "order=GMKIT-DEMO-0001&amount=88.00".getBytes(StandardCharsets.UTF_8);

try (SM9EncMasterKey master = SM9.generateEncMasterKey();
     SM9EncKey encKey = master.extractKey(id)) {
    byte[] ciphertext = SM9.encrypt(master, id, plaintext);
    byte[] output = SM9.decrypt(encKey, ciphertext);
    if (!Arrays.equals(plaintext, output)) {
        throw new IllegalStateException("SM9 decrypt mismatch");
    }
}
```

单次明文必须为 1–255 字节，以编码后的实际字节数计；解密接受的 DER 密文最多 367 字节。更大数据应采用混合加密：随机生成 16 字节 SM4 会话 key，用 SM4-GCM 等认证加密处理业务数据，再用 SM9 保护会话 key，并明确保存算法、身份、nonce、AAD、tag 和载荷版本。

## 身份、PEM 与路径

- 身份字符串按 UTF-8 原样转换，首尾空格不会裁剪；全空白身份会拒绝。派生、签名验证和 IBE 加解密必须使用相同身份字节。
- 中文、emoji 和非 BMP 身份由 native 测试覆盖。不要在协议不同层分别做大小写转换或 Unicode 归一化。
- 主私钥和用户私钥只提供口令加密 PEM；公开主密钥使用公开 PEM。导入用户私钥时仍需传入对应身份。
- PEM 口令和路径按 UTF-8 处理；Windows native 使用宽字符文件 API。口令或路径含 NUL 会拒绝。

| 对象 | 私有 PEM | 公开 PEM |
|:--|:--|:--|
| `SM9SignMasterKey` | `export/importEncryptedMasterKeyInfoPem` | `export/importPublicMasterKeyPem` |
| `SM9SignKey` | `export/importEncryptedPrivateKeyInfoPem` | 不适用 |
| `SM9EncMasterKey` | `export/importEncryptedMasterKeyInfoPem` | `export/importPublicMasterKeyPem` |
| `SM9EncKey` | `export/importEncryptedPrivateKeyInfoPem` | 不适用 |

公开主密钥用于验签或加密，不包含派生用户私钥所需的主私钥部分。不要把同一对象引用同时交给多个会关闭它的组件。

## 流式签名

`SM9Signature` 支持多次 `update`，完成后可通过 `reset(true/false)` 切换并复用上下文。分块边界不应改变最终验签结果。

```java
import cn.gmkit.sm9.*;
import java.nio.charset.StandardCharsets;

byte[] data = "part-1|part-2".getBytes(StandardCharsets.UTF_8);
String id = "stream@example.com";
try (SM9SignMasterKey master = SM9.generateSignMasterKey();
     SM9SignKey key = master.extractKey(id);
     SM9Signature signer = new SM9Signature(true);
     SM9Signature verifier = new SM9Signature(false)) {
    signer.update(data, 0, 6).update(data, 6, data.length - 6);
    byte[] signature = signer.sign(key);
    verifier.update(data);
    if (!verifier.verify(signature, master, id)) {
        throw new IllegalStateException("streaming SM9 verify failed");
    }
}
```

## 验证证据边界

发布流水线固定 GmSSL `v3.1.1` commit `d655c06b3a6b0fe8cff900f293bf0e5aac6eb0a2`。验证分为三层，不能用其中一层替代另外两层：

<ApiTable label="SM9 三层验证证据" min-width="48rem">

| 层级 | 测试内容 | 结论边界 |
|:--|:--|:--|
| 1. GmSSL 固定向量 | 五个平台先执行上游 `sm9test.c` 中的 `ks`、`ds`、`ke`、`de` 派生向量 | 证明锁定版本的底层实现通过其固定向量 |
| 2. Java/JNI 行为 | 签名、错误身份、消息与签名篡改、IBE、1/255/256 字节边界、PEM 和句柄关闭 | 证明 Java 参数到 native 的桥接与错误语义 |
| 3. 聚合 JAR | 五个平台下载同一个聚合 JAR，验证平台自动选择、签名、IBE 和 Unicode PEM | 证明实际发布物包含并能加载对应平台 runtime |

</ApiTable>

固定向量的可核查来源是锁定提交的 [`tests/sm9test.c`](https://github.com/guanzhi/GmSSL/blob/d655c06b3a6b0fe8cff900f293bf0e5aac6eb0a2/tests/sm9test.c)。Java 公共 API 不暴露原始 `ks/ke/ds/de` 内存结构，因此 Java 层随机生成的密钥、签名和密文只能证明 API 行为，不能描述成固定国标向量。

- `.github/workflows/sm9-native.yml`
- `.github/workflows/publish-java.yml`
- `packages/java/gmkit-sm9/src/test/java/cn/gmkit/sm9/`
- [Java SM9 API 说明书](/api/java/sm9.html)
