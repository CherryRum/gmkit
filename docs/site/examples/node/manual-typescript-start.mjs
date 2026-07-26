import assert from 'node:assert/strict';

import {
  configureRNG,
  getEnvReport,
  getRandomBytes,
  sm3Digest,
} from '../../../../packages/ts/dist/index.js';

// #region manual-ts-start
// 1. 检查运行环境：BigInt 与 UTF-8 codec 是 gmkitx 的基础运行条件。
const environment = getEnvReport();
assert.equal(environment.hasBigInt, true);
assert.equal(environment.hasTextEncoder, true);
assert.equal(environment.hasTextDecoder, true);

// 2. 配置随机源：正式环境没有 CSPRNG 时立即报错，不允许退回非安全随机数。
configureRNG('strict');
const nonce = getRandomBytes(12);
assert.equal(nonce.length, 12);

// 3. 计算固定向量：SM3("abc") 必须得到标准的 32 字节摘要。
const digest = sm3Digest('abc');
assert.equal(
  digest,
  '66c7f0f462eeedd9d1f2d46bdc10e4e2'
    + '4167c4875cf2f7a2297da02b8f4ba8e0',
);

// 4. 非法参数断言：随机字节长度必须是正安全整数。
assert.throws(() => getRandomBytes(0));
// #endregion manual-ts-start

console.log('TypeScript manual start example passed');
