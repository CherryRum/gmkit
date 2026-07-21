import assert from 'node:assert/strict';
import test from 'node:test';

import { auditCodeSamples } from './code-sample-audit.mjs';

const file = '/repo/docs/site/example.md';
const readSource = async () => {
  throw new Error('unexpected source read');
};

async function audit(markdown, options = {}) {
  return auditCodeSamples({
    file,
    displayPath: 'docs/site/example.md',
    content: markdown,
    readSource,
    ...options,
  });
}

test('accepts a classified calling sample with ordered Chinese comments', async () => {
  const failures = await audit(`
<!-- code-sample id="ts-sm4-gcm" steps="准备参数|加密|解密|成功断言" -->
\`\`\`ts
// 1. 准备参数：固定 key 和 nonce。
const plaintext = 'demo';
// 2. 加密：得到 ciphertext 和 tag。
const ciphertext = sm4Encrypt(key, plaintext);
// 3. 解密：恢复原始明文。
const decrypted = sm4Decrypt(key, ciphertext);
// 4. 成功断言：结果必须一致。
if (decrypted !== plaintext) throw new Error('mismatch');
\`\`\`
`);
  assert.deepEqual(failures, []);
});

test('rejects an unclassified audited-language block', async () => {
  const failures = await audit(`
\`\`\`ts
const result = digest('abc');
\`\`\`
`);
  assert.match(failures.join('\n'), /未标记/);
});

test('rejects duplicate sample ids', async () => {
  const markdown = `
<!-- code-sample id="duplicate" steps="计算摘要" -->
\`\`\`ts
// 1. 计算摘要：第一次调用。
const first = digest('a');
\`\`\`
<!-- code-sample id="duplicate" steps="计算摘要" -->
\`\`\`ts
// 1. 计算摘要：第二次调用。
const second = digest('b');
\`\`\`
`;
  const failures = await audit(markdown);
  assert.match(failures.join('\n'), /id 重复 duplicate/);
});

test('rejects missing, skipped and mismatched steps', async () => {
  const failures = await audit(`
<!-- code-sample id="bad-steps" steps="准备参数|验签" -->
\`\`\`java
// 1. 准备参数：读取公钥。
String message = "demo";
// 3. 签名：生成签名。
String signature = sm2.sign(message);
\`\`\`
`);
  assert.match(failures.join('\n'), /实际有 2 项|第 2 步.*实际为 3|验签/);
});

test('rejects metadata steps that have no corresponding code comment', async () => {
  const failures = await audit(`
<!-- code-sample id="missing-comment" steps="准备参数|加密" -->
\`\`\`ts
// 1. 准备参数：固定 key。
const ciphertext = encrypt(key, plaintext);
\`\`\`
`);
  assert.match(failures.join('\n'), /steps 声明 2 项，代码实际有 1 项/);
});

test('requires operation comments for cryptographic calls', async () => {
  const failures = await audit(`
<!-- code-sample id="missing-operation" steps="执行操作" -->
\`\`\`ts
// 1. 执行操作：返回认证密文。
const ciphertext = encrypt(key, plaintext);
\`\`\`
`);
  assert.match(failures.join('\n'), /encrypt 调用缺少“加密”步骤注释/);
});

test('rejects executable code disguised as an interface reference', async () => {
  const failures = await audit(`
<!-- code-reference -->
\`\`\`ts
configureRNG('strict');
\`\`\`
`);
  assert.match(failures.join('\n'), /接口参考中出现实际调用/);
});

test('accepts pure interface signatures as references', async () => {
  const failures = await audit(`
<!-- code-reference -->
\`\`\`ts
encrypt(key: Uint8Array, plaintext: Uint8Array): Uint8Array
\`\`\`
`);
  assert.deepEqual(failures, []);
});

test('checks comments in the real included source region', async () => {
  const source = `
// #region included-example
// 1. 计算摘要：执行真实测试源码。
const actual = digest('abc');
// 2. 固定向量断言：结果必须一致。
assert.equal(actual, expected);
// #endregion included-example
`;
  const failures = await audit(`
<!-- code-sample id="included-sample" steps="计算摘要|固定向量断言" -->
\`\`\`js
<!-- @include: ../examples/example.mjs#included-example -->
\`\`\`
`, { readSource: async () => source });
  assert.deepEqual(failures, []);
});
