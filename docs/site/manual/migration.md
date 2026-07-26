---
title: GMKit 旧系统迁移
description: 将 GMKit 0.10.1 的弃用别名、自动识别和非标准兼容入口迁移到明确 API。
pageInfo: false
contributors: false
editLink: false
icon: route
category: [使用手册, 迁移]
tag: [弃用, 兼容, 升级]
---

# GMKit 旧系统迁移

本页只供维护既有数据或调用方使用。新代码不要从本页选择入口；请返回对应语言使用手册。

## 迁移范围

- TypeScript 无算法前缀别名、默认聚合导出和随机策略旧名称。
- 没有格式字段的 Hex/Base64 自动识别。
- SM2 no-Z、空身份常量和预计算摘要旧入口。
- SHA-1 和旧 EEA3 密钥流入口。

每项替代 API、行为差异和验证步骤将在迁移提交中补齐。

