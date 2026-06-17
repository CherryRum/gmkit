# 性能基线

GMKit 现在提供独立的 `gmkit-benchmarks` Maven 模块，用 JMH 固定 SM2、SM3、SM4 的基准场景，避免后续重构只能凭感觉判断性能是否退化。

## 指标口径

- 吞吐量：`thrpt`，适合看单位时间内可完成的操作数
- 平均耗时：`avgt`，适合看单次操作的平均延迟
- 分配与 GC：建议附加 `-prof gc`，观察每次操作的分配量和 GC 压力

## 已覆盖场景

- `SM3Benchmark`
    - `digest256Bytes`
    - `digest4096Bytes`
    - `hmac256Bytes`
    - `hmac4096Bytes`
- `SM4Benchmark`
    - `encryptCbcPkcs7_1024Bytes`
    - `decryptCbcPkcs7_1024Bytes`
    - `encryptGcm_1024Bytes`
    - `decryptGcm_1024Bytes`
- `SM2Benchmark`
    - `generateKeyPair`
    - `encrypt32Bytes`
    - `decrypt32Bytes`
    - `sign32Bytes`
    - `verify32Bytes`

## 运行方式

先打包基准模块：

```bash
mvn -pl gmkit-benchmarks -am -DskipTests package
```

运行全部基准：

```bash
java -jar gmkit-benchmarks/target/gmkit-benchmarks-0.9.4-SNAPSHOT.jar
```

只看吞吐量：

```bash
java -jar gmkit-benchmarks/target/gmkit-benchmarks-0.9.4-SNAPSHOT.jar ".*SM3.*" -bm thrpt -tu s -wi 3 -i 5 -f 1
```

只看平均耗时：

```bash
java -jar gmkit-benchmarks/target/gmkit-benchmarks-0.9.4-SNAPSHOT.jar ".*SM2.*" -bm avgt -tu us -wi 3 -i 5 -f 1
```

附带分配与 GC 指标：

```bash
java -jar gmkit-benchmarks/target/gmkit-benchmarks-0.9.4-SNAPSHOT.jar ".*SM4.*" -bm avgt -tu us -prof gc -wi 3 -i 5 -f 1
```

## 结果记录建议

- 固定 JDK 版本、机器型号、CPU governor 和负载状态
- 保持相同的 `-wi/-i/-f` 参数，避免不同轮次不可比
- PR 或发布前至少记录一次 `SM2 / SM3 / SM4` 三类核心路径结果
- 如果只做 API 文档或错误语义调整，理论上不应出现明显吞吐下降；若有下降，应回看编码、数组复制和 Provider 初始化路径
