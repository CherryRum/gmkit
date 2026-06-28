import { faker } from '@faker-js/faker';
import Ajv from 'ajv';
import { JSONPath } from 'jsonpath-plus';
import { jsonrepair } from 'jsonrepair';
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml';
import YAML from 'yaml';

import { ok, okFields, outputField, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';
import { pretty, randomBase64, randomHex, textValue } from './shared';

export const dataRunners: Record<string, ToolRunner> = {
  json: runJsonFallback,
  yaml: runYaml,
  toml: runToml,
  jsonpath: runJsonPath,
  jsonschema: runJsonSchema,
  jsontots: runJsonToTs,
  random: runRandom,
  mock: runMock,
};

function runJsonFallback(request: ToolRunRequest): ToolRunResult {
  const indent = Number(textValue(request.options, 'indent', '2')) || 2;
  if (request.tab === '修复') return ok(JSON.stringify(JSON.parse(jsonrepair(request.input)), null, indent), 'JSON 修复完成');
  if (request.tab === '压缩') return ok(JSON.stringify(JSON.parse(request.input)), 'JSON 压缩完成');
  return ok(JSON.stringify(JSON.parse(request.input), null, indent), 'JSON 格式化完成');
}

function runYaml(request: ToolRunRequest): ToolRunResult {
  if (request.tab === '转换' || request.tab === '生成') {
    try {
      const json = JSON.parse(request.input);
      return ok(YAML.stringify(json), 'JSON 转 YAML 完成');
    } catch {
      return ok(JSON.stringify(YAML.parse(request.input), null, 2), 'YAML 转 JSON 完成');
    }
  }
  return ok(YAML.parse(request.input), 'YAML 解析完成');
}

function runToml(request: ToolRunRequest): ToolRunResult {
  try {
    const json = JSON.parse(request.input);
    return ok(stringifyToml(json as any), 'JSON 转 TOML 完成');
  } catch {
    return ok(JSON.stringify(parseToml(request.input), null, 2), 'TOML 转 JSON 完成');
  }
}

function runJsonPath(request: ToolRunRequest): ToolRunResult {
  const json = JSON.parse(request.input);
  const path = textValue(request.options, 'query', '$');
  const result = JSONPath({ path, json });
  return okFields([outputField('result', '查询结果', result, 'json', { primary: true })], `JSONPath 查询完成: ${path}`);
}

function runJsonSchema(request: ToolRunRequest): ToolRunResult {
  const payload = JSON.parse(request.input);
  const schema = JSON.parse(textValue(request.options, 'query', '{}'));
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  const valid = validate(payload);
  return okFields(
    [outputField('valid', '校验结果', String(valid), 'boolean', { primary: true }), outputField('errors', '错误列表', validate.errors ?? [], 'json')],
    valid ? 'Schema 校验通过' : 'Schema 校验未通过',
  );
}

function runJsonToTs(request: ToolRunRequest): ToolRunResult {
  const value = JSON.parse(request.input);
  return okFields([outputField('types', 'TypeScript 类型', toInterface('Root', value), 'code', { primary: true })], 'TypeScript 接口生成完成');
}

function runRandom(request: ToolRunRequest): ToolRunResult {
  const count = Number(textValue(request.options, 'count', '5')) || 5;
  const length = Number(textValue(request.options, 'length', '16')) || 16;
  const values = Array.from({ length: count }, () => ({
    hex: randomHex(length),
    base64: randomBase64(length),
    uuid: crypto.randomUUID(),
  }));
  return okFields(
    [
      outputField('hex', 'Hex 列表', values.map((value) => value.hex).join('\n'), 'hex', { primary: true }),
      outputField('base64', 'Base64 列表', values.map((value) => value.base64).join('\n'), 'base64'),
      outputField('uuid', 'UUID 列表', values.map((value) => value.uuid).join('\n'), 'text'),
      outputField('json', 'JSON 详情', values, 'json'),
    ],
    '随机数据生成完成',
  );
}

function runMock(request: ToolRunRequest): ToolRunResult {
  const count = Number(textValue(request.options, 'count', '5')) || 5;
  const rows = Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    company: faker.company.name(),
    createdAt: faker.date.recent().toISOString(),
  }));
  return okFields([outputField('json', 'Mock JSON', rows, 'json', { primary: true })], 'Mock 数据生成完成');
}

function toInterface(name: string, value: unknown): string {
  if (!value || typeof value !== 'object') return `type ${name} = ${inferType(value)};`;
  const source = Array.isArray(value) ? value[0] ?? {} : value;
  const fields = Object.entries(source as Record<string, unknown>)
    .map(([key, item]) => `  ${safeKey(key)}: ${inferType(item)};`)
    .join('\n');
  return `export interface ${name} {\n${fields}\n}`;
}

function inferType(value: unknown): string {
  if (Array.isArray(value)) return `${inferType(value[0]) || 'unknown'}[]`;
  if (value === null) return 'null';
  if (typeof value === 'object') return 'Record<string, unknown>';
  return typeof value;
}

function safeKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

export function summarizeData(value: unknown): string {
  return pretty(value);
}
