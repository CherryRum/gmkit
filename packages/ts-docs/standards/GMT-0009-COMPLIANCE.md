---
title: GM/T 0009 实现符合性
icon: certificate
order: 1
category:
  - 标准与合规
tag:
  - GM/T-0009
  - SM2
---

# GM/T 0009 实现符合性

本文说明 `gmkitx` 的 SM2 协议边界。它不是认证声明；发布行为以公开 API、测试和共享向量为准。

## 当前实现

| 项目 | 当前行为 |
|:--|:--|
| 曲线 | 仅支持标准 SM2 曲线；类型兼容保留的 `curveParams` 不能切换到自定义曲线 |
| 用户 ID | `DEFAULT_USER_ID = '1234567812345678'`；省略值和空字符串均回落到该值 |
| ENTL | 按 UTF-8 字节长度计算，拒绝 8192 字节及以上的 userId，避免 16-bit ENTL 溢出 |
| 密文排列 | 默认 `C1C3C2`，也支持 `C1C2C3` |
| 公钥 | 接受非压缩 `04 || x || y` 和压缩 `02/03 || x` |
| 密文 | 支持 raw C1C3C2/C1C2C3 和严格 ASN.1 DER 解析 |
| 签名 | 默认 raw `r || s`，支持 DER；验签可显式使用 `auto` |
| 二进制解密 | 使用 `sm2DecryptBytes`，不经过 UTF-8 转换 |

## userId 兼容约定

历史版本把空字符串当作“未提供”，大量调用方依赖这一行为。为避免旧签名和旧业务升级后改变语义，当前版本继续采用：

```ts
options?.userId || DEFAULT_USER_ID
```

因此 `{ userId: '' }` **不是**真实空 ID，而是选择 `DEFAULT_USER_ID`。跨系统签名必须显式约定同一个非空 userId，或者双方都使用默认值。

```ts
import { sm2GenerateKeyPair, sm2Sign, sm2Verify } from 'gmkitx';

const { privateKey, publicKey } = sm2GenerateKeyPair();
const userId = 'example-service-v1';
const message = '可验证消息';
const signature = sm2Sign(privateKey, message, { userId });

if (!sm2Verify(publicKey, message, signature, { userId })) {
  throw new Error('SM2 signature verification failed');
}
```

未来若需要表达真实空 ID，应增加显式新选项或新 API，不能修改现有空字符串回落语义。

## 互操作检查项

1. 固定 `userId`，不要依赖对方库的默认值。
2. 固定 `C1C3C2` 或 `C1C2C3`，不要把自动探测当成协议字段。
3. 固定公钥表示、密文编码和签名格式。
4. 二进制明文使用 `Uint8Array` 和 `sm2DecryptBytes`。
5. 用真实公私钥做解密、验签和篡改拒绝测试；SM2 加密和签名含随机数，不能默认比较完整字面值。

## 验证命令

```bash
npm test -w packages/ts -- sm2 interop-compliance
mvn -f packages/java/pom.xml -B -ntp -pl gmkit test
```

共享互操作数据位于仓库根目录 `vectors/interop.json`。
