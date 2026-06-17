# 共享互操作测试向量

`vectors/` 存放 Java 与 TypeScript 共用的跨语言互操作向量。它用于固定协议边界，而不是声明两个语言拥有相同公共 API。

## 文件

- `interop.json`：SM2、SM3、SM4、ZUC 的 schema 化互操作用例。

当前消费方：

- TypeScript：`packages/ts/test/interop-compliance.test.ts`
- Java：`packages/java/gmkit/src/test/java/cn/gmkit/InteropComplianceTest.java`

Java 测试通过 Maven test resources 将根级 `vectors/` 挂载到 classpath；TypeScript 测试直接从 monorepo 根读取 JSON。

## 向量规则

- `source: "project"` 表示项目回归向量，只用于 GMKit Java/TS 对齐。
- 标准向量必须写明标准来源，例如 `GM/T 0004-2012`。
- SM2 加密和未固定随机数的签名不比较完整字面值，只验证解密或验签性质。
- 新增字段应向后兼容；字段重命名或删除必须同步更新 Java、TypeScript 测试和 CHANGELOG。

## 本地校验

```bash
npm run parity
npm run test:ts
npm run test:java
```

涉及 `vectors/**` 的变更会触发 `parity.yml`，并在 `ci.yml` 中覆盖两端测试。
