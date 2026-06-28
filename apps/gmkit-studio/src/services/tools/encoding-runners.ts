import { decode as decodeHtml, encode as encodeHtml } from 'html-entities';
import { base64ToBytes, bytesToBase64, bytesToHex, hexToBytes, stringToBytes } from 'gmkitx';
import { decodeJwt, decodeProtectedHeader, jwtVerify, SignJWT } from 'jose';

import { pretty, textValue } from './shared';
import { okFields, outputField, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';

export const encodingRunners: Record<string, ToolRunner> = {
  base64: runBase64,
  url: runUrl,
  hex: runHex,
  unicode: runUnicode,
  htmlentity: runHtmlEntity,
  jwt: runJwt,
};

function runBase64(request: ToolRunRequest): ToolRunResult {
  const urlSafe = textValue(request.options, 'variant', 'Standard') === 'URL Safe';
  if (request.tab === '解码') {
    const normalized = urlSafe ? fromUrlSafe(request.input.trim()) : request.input.trim();
    return okFields([outputField('text', '解码文本', new TextDecoder().decode(base64ToBytes(normalized)), 'text', { primary: true })], 'Base64 解码完成');
  }
  const encoded = bytesToBase64(stringToBytes(request.input));
  return okFields([outputField('base64', urlSafe ? 'Base64 URL Safe' : 'Base64', urlSafe ? toUrlSafe(encoded) : encoded, 'base64', { primary: true })], 'Base64 编码完成');
}

function runUrl(request: ToolRunRequest): ToolRunResult {
  if (request.tab === '解码') return okFields([outputField('text', '解码文本', decodeURIComponent(request.input), 'text', { primary: true })], 'URL 解码完成');
  return okFields([outputField('encoded', 'URL 编码', encodeURIComponent(request.input), 'text', { primary: true })], 'URL 编码完成');
}

function runHex(request: ToolRunRequest): ToolRunResult {
  if (request.tab === '解码') return okFields([outputField('text', '解码文本', new TextDecoder().decode(hexToBytes(request.input.replace(/\s+/g, ''))), 'text', { primary: true })], 'Hex 解码完成');
  return okFields([outputField('hex', 'Hex', bytesToHex(stringToBytes(request.input)), 'hex', { primary: true })], 'Hex 编码完成');
}

function runUnicode(request: ToolRunRequest): ToolRunResult {
  if (request.tab === '解码') {
    return okFields([outputField('text', '解码文本', request.input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16))), 'text', { primary: true })], 'Unicode 反转义完成');
  }
  return okFields([outputField('escaped', 'Unicode 转义', Array.from(request.input).map((char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`).join(''), 'text', { primary: true })], 'Unicode 转义完成');
}

function runHtmlEntity(request: ToolRunRequest): ToolRunResult {
  if (request.tab === '解码') return okFields([outputField('text', '解码文本', decodeHtml(request.input), 'text', { primary: true })], 'HTML Entity 解码完成');
  return okFields([outputField('entity', 'HTML Entity', encodeHtml(request.input), 'text', { primary: true })], 'HTML Entity 编码完成');
}

async function runJwt(request: ToolRunRequest): Promise<ToolRunResult> {
  const secret = textValue(request.options, 'secret', 'gmkit-secret');
  const algorithm = textValue(request.options, 'algorithm', 'HS256') as 'HS256' | 'HS384' | 'HS512';
  const secretBytes = stringToBytes(secret);
  if (request.tab === '解析') {
    const token = request.input.trim();
    return okFields(
      [
        outputField('header', 'Header', decodeProtectedHeader(token), 'json'),
        outputField('payload', 'Payload', decodeJwt(token), 'json', { primary: true }),
        outputField('signature', 'Signature', token.split('.')[2] ?? '', 'base64'),
      ],
      'JWT 解析完成',
    );
  }

  if (request.tab === '验签') {
    const verified = await jwtVerify(request.input.trim(), secretBytes, { algorithms: [algorithm] });
    return okFields(
      [
        outputField('valid', '验签结果', 'true', 'boolean', { primary: true }),
        outputField('payload', 'Payload', verified.payload, 'json'),
        outputField('protectedHeader', 'Header', verified.protectedHeader, 'json'),
      ],
      `JWT ${algorithm} 验签完成`,
    );
  }

  const input = request.input.trim() ? JSON.parse(request.input) : { name: 'GMKit', iat: Math.floor(Date.now() / 1000) };
  const token = await new SignJWT(input).setProtectedHeader({ alg: algorithm, typ: 'JWT' }).sign(secretBytes);
  return okFields([outputField('token', `JWT ${algorithm}`, token, 'text', { primary: true })], `JWT ${algorithm} 生成完成`);
}

function toUrlSafe(value: string): string {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromUrlSafe(value: string): string {
  return value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
}

export function describeEncoding(value: unknown): string {
  return pretty(value);
}
