# GMKitX

`gmkitx` 是 GMKit 的 TypeScript/JavaScript 包，提供 SM2、SM3、SM4、ZUC、SHA-2 和 HMAC。接入流程统一维护在 [TypeScript 使用手册](https://gmkit.cn/manual/typescript/)；本页只保留安装与最小自检。

> 当前 `0.x` 版本尚未完成独立第三方安全审计。上线前仍需完成密钥管理、随机源、nonce、协议字段和合规评估。

## 安装

```bash
npm install gmkitx@0.10.1
```

发布包支持 Node.js 18+、ESM、CommonJS、浏览器 IIFE 和 TypeScript 声明。应用从 `gmkitx` 根入口使用具名导出，不导入 `dist/*` 或 `src/*`。

## 30 秒自检

```ts
import { sm3Digest } from 'gmkitx';

// 1. 计算摘要：使用标准输入 abc 检查包入口和 UTF-8 路径。
const actual = sm3Digest('abc');
const expected =
  '66c7f0f462eeedd9d1f2d46bdc10e4e2'
  + '4167c4875cf2f7a2297da02b8f4ba8e0';

// 2. 固定向量断言：结果不一致时停止接入，不继续测试随机算法。
if (actual !== expected) {
  throw new Error(`SM3 vector mismatch: ${actual}`);
}
```

这段代码只证明依赖和固定摘要路径可用。接着应在手册中完成严格随机源、SM2 签名验签、SM4-GCM 加解密和篡改失败测试。

## 文档

- [五分钟快速入门](https://gmkit.cn/guide/typescript.html)
- [TypeScript 使用手册](https://gmkit.cn/manual/typescript/)
- [TypeScript API 参数](https://gmkit.cn/api/typescript/)
- [跨语言协议接入](https://gmkit.cn/manual/interoperability.html)
- [旧系统迁移](https://gmkit.cn/manual/migration.html)

## 仓库内验证

```bash
npm ci
npm run verify -w packages/ts
```

Apache License 2.0，见 [LICENSE](LICENSE)。第三方版权与许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
