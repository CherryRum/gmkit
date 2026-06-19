import { decode as decodeHtml, encode as encodeHtml } from 'html-entities';
import { base64ToBytes, bytesToBase64, bytesToHex, hexToBytes, stringToBytes } from 'gmkitx';

import { asArrayBuffer, decodeBytes, encodeBytes, pretty, textValue } from './shared';
import { ok, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';

export const encodingRunners: Record<string, ToolRunner> = {
  base64: runBase64,
  url: runUrl,
  hex: runHex,
  unicode: runUnicode,
  htmlentity: runHtmlEntity,
  jwt: runJwt,
};

function runBase64(request: ToolRunRequest): ToolRunResult {
  if (request.tab === '解码') return ok(new TextDecoder().decode(base64ToBytes(request.input.trim())), 'Base64 解码完成');
  return ok(bytesToBase64(stringToBytes(request.input)), 'Base64 编码完成');
}

function runUrl(request: ToolRunRequest): ToolRunResult {
  if (request.tab === '解码') return ok(decodeURIComponent(request.input), 'URL 解码完成');
  return ok(encodeURIComponent(request.input), 'URL 编码完成');
}

function runHex(request: ToolRunRequest): ToolRunResult {
  if (request.tab === '解码') return ok(new TextDecoder().decode(hexToBytes(request.input.replace(/\s+/g, ''))), 'Hex 解码完成');
  return ok(bytesToHex(stringToBytes(request.input)), 'Hex 编码完成');
}

function runUnicode(request: ToolRunRequest): ToolRunResult {
  if (request.tab === '解码') {
    return ok(request.input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16))), 'Unicode 反转义完成');
  }
  return ok(Array.from(request.input).map((char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`).join(''), 'Unicode 转义完成');
}

function runHtmlEntity(request: ToolRunRequest): ToolRunResult {
  if (request.tab === '解码') return ok(decodeHtml(request.input), 'HTML Entity 解码完成');
  return ok(encodeHtml(request.input), 'HTML Entity 编码完成');
}

async function runJwt(request: ToolRunRequest): Promise<ToolRunResult> {
  const secret = textValue(request.options, 'secret', 'gmkit-secret');
  if (request.tab === '解析') {
    const [header, payload, signature] = request.input.trim().split('.');
    return ok(
      {
        header: JSON.parse(new TextDecoder().decode(base64UrlToBytes(header))),
        payload: JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))),
        signature,
      },
      'JWT 解析完成',
    );
  }

  if (request.tab === '验签') {
    const [header, payload, signature] = request.input.trim().split('.');
    const expected = await hmacJwt(`${header}.${payload}`, secret);
    return ok({ valid: expected === signature, expected, signature }, 'JWT HS256 验签完成');
  }

  const input = request.input.trim() ? JSON.parse(request.input) : { name: 'GMKit', iat: Math.floor(Date.now() / 1000) };
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify(input));
  const signature = await hmacJwt(`${header}.${payload}`, secret);
  return ok(`${header}.${payload}.${signature}`, 'JWT HS256 生成完成');
}

async function hmacJwt(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', asArrayBuffer(stringToBytes(secret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, asArrayBuffer(stringToBytes(data)));
  return bytesToBase64Url(new Uint8Array(signature));
}

function base64Url(input: string): string {
  return bytesToBase64Url(stringToBytes(input));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return encodeBytes(bytes, 'Base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return decodeBytes(padded, 'Base64');
}

export function describeEncoding(value: unknown): string {
  return pretty(value);
}
