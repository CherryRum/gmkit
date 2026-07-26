import assert from 'node:assert/strict';

import {
  InputFormat,
  OutputFormat,
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  bytesToString,
  constantTimeEqual,
  decodeInput,
  encodeOutput,
  hexToBytes,
  stringToBytes,
} from '../../../../packages/ts/dist/index.js';

// #region manual-ts-data
// 1. 准备二进制：该字节序列包含 NUL、非 ASCII 字节和字母 A。
const binary = Uint8Array.of(0x00, 0xff, 0x80, 0x41);

// 2. 编码二进制：协议字段分别输出为小写 Hex 和 RFC 4648 Base64。
const hex = encodeOutput(binary, OutputFormat.HEX);
const base64 = encodeOutput(binary, OutputFormat.BASE64);
assert.equal(hex, '00ff8041');
assert.equal(base64, 'AP+AQQ==');

// 3. 显式解码：接收方按协议声明的格式恢复相同字节。
assert.equal(constantTimeEqual(decodeInput(hex, InputFormat.HEX), binary), true);
assert.equal(constantTimeEqual(decodeInput(base64, InputFormat.BASE64), binary), true);

// 4. UTF-8 往返：文本转换与任意二进制转换分开处理。
const plaintext = '订单 GMKIT-DEMO-0001';
assert.equal(bytesToString(stringToBytes(plaintext)), plaintext);
assert.equal(bytesToHex(hexToBytes(hex)), hex);
assert.equal(bytesToBase64(base64ToBytes(base64)), base64);

// 5. Hex 边界：奇数长度会在高位补 0；非 Hex 字符必须被拒绝。
assert.equal(bytesToHex(hexToBytes('abc')), '0abc');
assert.throws(() => decodeInput('00xz', InputFormat.HEX));

// 6. 比较失败断言：长度相同但内容不同的认证值必须返回 false。
const tampered = Uint8Array.from(binary);
tampered[3] ^= 0x01;
assert.equal(constantTimeEqual(binary, tampered), false);
// #endregion manual-ts-data

console.log('TypeScript manual data example passed');
