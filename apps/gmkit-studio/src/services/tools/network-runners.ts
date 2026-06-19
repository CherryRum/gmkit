import ipaddr from 'ipaddr.js';
import { UAParser } from 'ua-parser-js';

import { ok, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';
import { textValue } from './shared';

export const networkRunners: Record<string, ToolRunner> = {
  urlparse: runUrlParse,
  httpstatus: runHttpStatus,
  ua: runUa,
  cidr: runCidr,
  dns: runDns,
  ipinfo: runIpInfo,
  curl: runCurl,
};

function runUrlParse(request: ToolRunRequest): ToolRunResult {
  const url = new URL(request.input.trim());
  return ok(
    {
      protocol: url.protocol,
      username: url.username,
      password: url.password ? '***' : '',
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: Object.fromEntries(url.searchParams.entries()),
      hash: url.hash,
    },
    'URL 解析完成',
  );
}

function runHttpStatus(request: ToolRunRequest): ToolRunResult {
  const code = Number(request.input.trim() || 200);
  return ok({ code, text: statusText(code), range: `${Math.floor(code / 100)}xx` }, 'HTTP 状态查询完成');
}

function runUa(request: ToolRunRequest): ToolRunResult {
  return ok(new UAParser(request.input).getResult(), 'User-Agent 解析完成');
}

function runCidr(request: ToolRunRequest): ToolRunResult {
  const [addr, prefix] = ipaddr.parseCIDR(request.input.trim());
  if (addr.kind() !== 'ipv4') return ok({ address: addr.toString(), prefix, kind: addr.kind() }, 'IPv6 CIDR 解析完成');
  const value = ipv4ToNumber(addr.toString());
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = value & mask;
  const broadcast = network | (~mask >>> 0);
  return ok({ address: addr.toString(), prefix, network: numberToIpv4(network), broadcast: numberToIpv4(broadcast), size: 2 ** (32 - prefix) }, 'CIDR 计算完成');
}

async function runDns(request: ToolRunRequest): Promise<ToolRunResult> {
  const name = request.input.trim();
  const type = textValue(request.options, 'dnsType', 'A');
  const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
    headers: { accept: 'application/dns-json' },
  });
  if (!response.ok) throw new Error(`DNS 查询失败: HTTP ${response.status}`);
  return ok(await response.json(), 'DNS 查询完成');
}

async function runIpInfo(request: ToolRunRequest): Promise<ToolRunResult> {
  const endpoint = textValue(request.options, 'apiEndpoint') || `https://ipapi.co/${encodeURIComponent(request.input.trim())}/json/`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`IP 信息查询失败: HTTP ${response.status}`);
  return ok(await response.json(), 'IP 信息查询完成');
}

async function runCurl(request: ToolRunRequest): Promise<ToolRunResult> {
  const { toJava, toJavaScript, toNodeAxios } = await import('curlconverter');
  const target = textValue(request.options, 'target', 'Fetch');
  if (target === 'Axios') return ok(toNodeAxios(request.input), 'cURL 转 Axios 完成');
  if (target === 'Java') return ok(toJava(request.input), 'cURL 转 Java 完成');
  return ok(toJavaScript(request.input), 'cURL 转 Fetch 完成');
}

function ipv4ToNumber(value: string): number {
  return value.split('.').reduce((acc, part) => ((acc << 8) + Number(part)) >>> 0, 0);
}

function numberToIpv4(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.');
}

function statusText(code: number): string {
  const map: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Content',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return map[code] ?? 'Unknown';
}
