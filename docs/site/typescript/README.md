---
title: TypeScript
icon: code
category:
  - TypeScript
---

# TypeScript

`gmkitx` 当前面向 Node.js、现代浏览器和具备所需基础 API 的小程序环境，提供 SM2、SM3、SM4、ZUC 与 SHA 相关接口，不包含 SM9。

```bash
npm install gmkitx@0.10.1
```

```ts
import { sm3Digest } from 'gmkitx';

const digest = sm3Digest('abc');
if (digest !== '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0') {
  throw new Error('SM3 fixed vector mismatch');
}
```

字符串输入默认按 UTF-8 处理。安全敏感操作应检查运行环境的 CSPRNG；兼容降级策略会发出警告，但不提供密码学安全保证。

继续阅读：[完整快速开始](/guide/getting-started)、[导入方式](/typescript/imports)、[公开 API 清单](/typescript/api-surface)、[TypeScript API Reference](/api/)。
