import ipaddr from 'ipaddr.js';
import statuses from 'statuses';
import { UAParser } from 'ua-parser-js';

import { okFields, outputField, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';
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
  return okFields(
    [
      outputField('origin', 'Origin', url.origin, 'text', { primary: true }),
      outputField('host', 'Host', url.host),
      outputField('pathname', 'Path', url.pathname),
      outputField('query', 'Query', Object.fromEntries(url.searchParams.entries()), 'json'),
      outputField('parts', '完整解析', { protocol: url.protocol, username: url.username, password: url.password ? '***' : '', hostname: url.hostname, port: url.port, hash: url.hash }, 'json'),
    ],
    'URL 解析完成',
  );
}

function runHttpStatus(request: ToolRunRequest): ToolRunResult {
  const code = Number(request.input.trim() || 200);
  return okFields(
    [
      outputField('status', '状态', `${code} ${statuses(code) || 'Unknown'}`, 'text', { primary: true }),
      outputField('range', '区间', `${Math.floor(code / 100)}xx`),
    ],
    'HTTP 状态查询完成',
  );
}

function runUa(request: ToolRunRequest): ToolRunResult {
  return okFields([outputField('ua', 'User-Agent 解析', new UAParser(request.input).getResult(), 'json', { primary: true })], 'User-Agent 解析完成');
}

function runCidr(request: ToolRunRequest): ToolRunResult {
  const [addr, prefix] = ipaddr.parseCIDR(request.input.trim());
  if (addr.kind() !== 'ipv4') return okFields([outputField('cidr', 'IPv6 CIDR', { address: addr.toString(), prefix, kind: addr.kind() }, 'json', { primary: true })], 'IPv6 CIDR 解析完成');
  const value = ipv4ToNumber(addr.toString());
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = value & mask;
  const broadcast = network | (~mask >>> 0);
  return okFields(
    [
      outputField('network', '网络地址', numberToIpv4(network), 'text', { primary: true }),
      outputField('broadcast', '广播地址', numberToIpv4(broadcast)),
      outputField('detail', '详情', { address: addr.toString(), prefix, size: 2 ** (32 - prefix) }, 'json'),
    ],
    'CIDR 计算完成',
  );
}

async function runDns(request: ToolRunRequest): Promise<ToolRunResult> {
  const name = request.input.trim();
  const type = textValue(request.options, 'dnsType', 'A');
  // DNS/IP 类工具必须发真实请求；离线或跨域失败时由 runner 抛错，不返回 mock 数据。
  const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
    headers: { accept: 'application/dns-json' },
  });
  if (!response.ok) throw new Error(`DNS 查询失败: HTTP ${response.status}`);
  return okFields([outputField('dns', 'DNS 响应', await response.json(), 'json', { primary: true })], 'DNS 查询完成');
}

async function runIpInfo(request: ToolRunRequest): Promise<ToolRunResult> {
  const endpoint = textValue(request.options, 'apiEndpoint') || `https://ipapi.co/${encodeURIComponent(request.input.trim())}/json/`;
  // Endpoint 可由用户替换，默认公网 API 不可用时保持真实失败提示。
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`IP 信息查询失败: HTTP ${response.status}`);
  return okFields([outputField('ipinfo', 'IP 信息', await response.json(), 'json', { primary: true })], 'IP 信息查询完成');
}

async function runCurl(request: ToolRunRequest): Promise<ToolRunResult> {
  const { toJava, toJavaScript, toNodeAxios } = await import('curlconverter');
  const target = textValue(request.options, 'target', 'Fetch');
  if (target === 'Axios') return okFields([outputField('axios', 'Axios 代码', toNodeAxios(request.input), 'code', { primary: true })], 'cURL 转 Axios 完成');
  if (target === 'Java') return okFields([outputField('java', 'Java 代码', toJava(request.input), 'code', { primary: true })], 'cURL 转 Java 完成');
  return okFields([outputField('fetch', 'Fetch 代码', toJavaScript(request.input), 'code', { primary: true })], 'cURL 转 Fetch 完成');
}

function ipv4ToNumber(value: string): number {
  return value.split('.').reduce((acc, part) => ((acc << 8) + Number(part)) >>> 0, 0);
}

function numberToIpv4(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.');
}
