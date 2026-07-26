# GMKit Java

GMKit Java 主包提供 SM2、SM3、SM4、ZUC 和 SM2 + SM4 混合加密；SM9 位于独立制品。接入流程统一维护在 [Java 使用手册](https://gmkit.cn/manual/java/)；本页只保留依赖与最小自检。

> 当前 `0.x` 版本尚未完成独立第三方安全审计。上线前仍需完成 Provider、随机源、密钥管理、协议字段和合规评估。

## 安装

主包最低支持 Java 8：

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit</artifactId>
  <version>0.10.1</version>
</dependency>
```

只在使用 SM9 时增加：

```xml
<dependency>
  <groupId>cn.gmkit</groupId>
  <artifactId>gmkit-sm9</artifactId>
  <version>0.10.1</version>
</dependency>
```

## 30 秒自检

```java
import cn.gmkit.sm3.SM3Util;

// 1. 计算摘要：使用标准输入 abc 检查制品和 UTF-8 路径。
String actual = SM3Util.digestHex("abc");
String expected =
    "66c7f0f462eeedd9d1f2d46bdc10e4e2"
    + "4167c4875cf2f7a2297da02b8f4ba8e0";

// 2. 固定向量断言：结果不一致时停止接入，不继续测试随机算法。
if (!expected.equals(actual)) {
    throw new IllegalStateException("SM3 vector mismatch: " + actual);
}
```

这段代码只证明依赖和固定摘要路径可用。接着应在手册中完成 Provider、安全上下文、SM2 签名验签、SM4-GCM 加解密和篡改失败测试。

## 文档

- [五分钟快速入门](https://gmkit.cn/guide/java.html)
- [Java 使用手册](https://gmkit.cn/manual/java/)
- [Java API 参数](https://gmkit.cn/api/java/)
- [Java SM9 手册](https://gmkit.cn/manual/java/sm9.html)
- [跨语言协议接入](https://gmkit.cn/manual/interoperability.html)
- [旧系统迁移](https://gmkit.cn/manual/migration.html)

## 仓库内验证

```bash
mvn -f packages/java/pom.xml -B -ntp test
```

Apache License 2.0，见 [LICENSE](LICENSE)。
