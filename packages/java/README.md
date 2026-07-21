# GMKit Java

GMKit Java 提供 SM2、SM3、SM4、ZUC 和 SM2 + SM4 混合加密；SM9 通过独立的 `gmkit-sm9` 模块提供。全部公共类型、重载、Builder 默认值、编码、异常和资源生命周期统一维护在 [Java API 说明书](https://gmkit.cn/api/java/)。

> 当前 `0.x` 版本是公开测试版，尚未完成独立第三方安全审计。生产接入前请评估密钥管理、随机源、Provider、协议字段和合规要求。

## Maven 依赖

主包最低支持 Java 8：

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit</artifactId>
  <version>0.10.1</version>
</dependency>
```

只在需要 SM9 时增加独立模块：

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit-sm9</artifactId>
  <version>0.10.1</version>
</dependency>
```

## 快速开始

```java
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm2.SM2SignOptions;
import cn.gmkit.sm2.SM2VerifyOptions;
import cn.gmkit.sm3.SM3;

SM2 sm2 = new SM2();
SM2KeyPair keys = sm2.generateKeyPair();
String message = "GMKit Java quick start";

String signature = sm2.signHex(
    keys.privateKey(),
    message,
    SM2SignOptions.builder().build());
boolean valid = sm2.verify(
    keys.publicKey(),
    message,
    signature,
    SM2VerifyOptions.builder().build());
if (!valid) {
    throw new IllegalStateException("SM2 verification failed");
}

String digest = new SM3().digestHex("abc");
String expected = "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0";
if (!expected.equals(digest)) {
    throw new IllegalStateException("SM3 vector mismatch");
}
```

SM9 的密钥和签名上下文持有 native 资源，必须使用 try-with-resources；启动时先检查 `SM9.isAvailable()`。完整平台矩阵、PEM、文件路径和大小限制见 [Java SM9 API](https://gmkit.cn/api/java/sm9.html)。

## 文档

- [Java API 说明书](https://gmkit.cn/api/java/)：按 core、SM2、SM3、SM4、ZUC、SM9、SM2 + SM4 混合加密分页说明全部公共类型。
- [已发布版本签名索引](https://gmkit.cn/api/#已发布版本签名索引)：核对与 Maven 制品相同版本的逐成员签名。
- [跨语言算法与协议](https://gmkit.cn/algorithms/)：Java/TypeScript 默认值和协议差异。
- [安全边界](https://gmkit.cn/guide/security.html)：上线前检查 Provider、随机源、密钥、nonce、认证和异常处理。

## 本地验证

```bash
mvn -f packages/java/pom.xml -B -ntp test
```

Apache License 2.0，见 [LICENSE](LICENSE)。
