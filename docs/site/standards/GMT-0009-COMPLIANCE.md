---
title: GM/T 0009 实现边界与验证状态
description: 对照 GM/T 0009 说明 GMKit 的已实现范围、验证依据和未覆盖边界。
icon: certificate
order: 1
category:
  - 标准与合规
tag:
  - GM/T-0009
  - SM2
---

# GM/T 0009 实现边界与验证状态

本文说明 `gmkitx` 的 SM2 实现边界和当前验证证据。项目尚未对 GM/T 0009 的全部版本、条款和附录建立逐条追踪矩阵，也未取得第三方检测或产品认证，因此本页不能作为符合性证书或采购合规依据。

文中“当前行为”只描述已发布 API。标准要求应以用户合法获得的正式标准文本为准；部署系统还需结合适用行业规范、密码模块要求和密钥管理制度单独评估。

## 当前实现

| 项目 | 当前行为 |
|:--|:--|
| 曲线 | 仅支持标准 SM2 曲线；类型兼容保留的 `curveParams` 不能切换到自定义曲线 |
| 用户 ID | `DEFAULT_USER_ID = '1234567812345678'`；省略值和空字符串均回落到该值 |
| ENTL | 按 UTF-8 字节长度计算，拒绝 8192 字节及以上的 userId，避免 16-bit ENTL 溢出 |
| 密文排列 | 默认 `C1C3C2`，也支持 `C1C2C3` |
| 公钥 | 接受非压缩 `04 \|\| x \|\| y` 和压缩 `02/03 \|\| x` |
| 密文 | 支持 raw C1C3C2/C1C2C3 和严格 ASN.1 DER 解析 |
| 签名 | 默认 raw `r \|\| s`，支持 DER；验签可显式使用 `auto` |
| 二进制解密 | 使用 `sm2DecryptBytes`，不经过 UTF-8 转换 |

## userId 兼容约定

历史版本把空字符串当作“未提供”，大量调用方依赖这一行为。为避免旧签名和旧业务升级后改变语义，当前版本继续采用：

<!-- code-reference -->
```ts
options?.userId || DEFAULT_USER_ID
```

因此 `{ userId: '' }` **不是**真实空 ID，而是选择 `DEFAULT_USER_ID`。跨系统签名必须显式约定同一个非空 userId，或者双方都使用默认值。

<!-- code-sample id="standards-gmt-0009-compliance-02" steps="准备参数|SM2 签名|SM2 验签|验签断言" -->
```ts
import { sm2GenerateKeyPair, sm2Sign, sm2Verify } from 'gmkitx';

// 1. 准备参数：生成 SM2 密钥对，并显式固定非空 userId。
const { privateKey, publicKey } = sm2GenerateKeyPair();
const userId = 'example-service-v1';
const message = '可验证消息';

// 2. SM2 签名：签名计算包含当前 userId 对应的 Z。
const signature = sm2Sign(privateKey, message, { userId });

// 3. SM2 验签：验签端必须使用相同消息和 userId。
const verified = sm2Verify(publicKey, message, signature, { userId });

// 4. 验签断言：标准 SM2 签名必须验证成功。
if (!verified) {
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

## 证据与限制

- SM2 单元测试覆盖密钥生成、加解密、签名验签、格式转换、错误输入和篡改拒绝。
- Java 与 TypeScript 对共享向量执行互操作测试；随机加密和签名以解密/验签结果验证，不比较随机输出字面值。
- 固定向量、回环和差分测试只证明已覆盖输入上的行为，不证明未覆盖条款、运行环境或侧信道属性。
- `skipZComputation` 是非标准兼容选项。协议需要标准 SM2 签名时不得启用，签名端和验签端也不能靠自动推断该选项。

正式声称某个产品或部署满足特定标准前，应补充标准版本、适用条款、逐条证据、第三方检测结论和部署配置，不能引用本页标题代替这些材料。
