import CronExpressionParser from 'cron-parser';
import { ulid } from 'ulid';

import { okFields, outputField, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';
import { textValue } from './shared';

export const timeRunners: Record<string, ToolRunner> = {
  timestamp: runTimestamp,
  uuid: runUuid,
  ulid: runUlid,
  snowflake: runSnowflake,
  cron: runCron,
  timezone: runTimezone,
  datecalc: runDateCalc,
};

function runTimestamp(request: ToolRunRequest): ToolRunResult {
  const raw = request.input.trim();
  const date = raw ? new Date(raw.length === 10 ? Number(raw) * 1000 : Number(raw)) : new Date();
  return okFields(
    [
      outputField('milliseconds', '毫秒时间戳', String(date.getTime()), 'number', { primary: true }),
      outputField('seconds', '秒时间戳', String(Math.floor(date.getTime() / 1000)), 'number'),
      outputField('iso', 'ISO 时间', date.toISOString()),
      outputField('local', '本地时间', date.toLocaleString()),
    ],
    '时间戳转换完成',
  );
}

function runUuid(request: ToolRunRequest): ToolRunResult {
  const count = Number(textValue(request.options, 'count', '5')) || 5;
  if (request.tab === '解析' || request.tab === '校验') {
    return okFields(
      [outputField('valid', '校验结果', String(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.input.trim())), 'boolean', { primary: true })],
      'UUID 校验完成',
    );
  }
  return okFields([outputField('uuid', 'UUID 列表', Array.from({ length: count }, () => crypto.randomUUID()).join('\n'), 'text', { primary: true })], 'UUID 生成完成');
}

function runUlid(request: ToolRunRequest): ToolRunResult {
  const count = Number(textValue(request.options, 'count', '5')) || 5;
  return okFields([outputField('ulid', 'ULID 列表', Array.from({ length: count }, () => ulid()).join('\n'), 'text', { primary: true })], 'ULID 生成完成');
}

function runSnowflake(_request: ToolRunRequest): ToolRunResult {
  const epoch = 1577836800000n;
  const now = BigInt(Date.now()) - epoch;
  const machine = 1n;
  const sequence = BigInt(Math.floor(Math.random() * 4096));
  return okFields([outputField('snowflake', 'Snowflake ID', ((now << 22n) | (machine << 12n) | sequence).toString(), 'text', { primary: true })], 'Snowflake ID 生成完成');
}

function runCron(request: ToolRunRequest): ToolRunResult {
  const expression = request.input.trim() || '*/5 * * * *';
  const interval = CronExpressionParser.parse(expression, { currentDate: new Date() });
  const next = Array.from({ length: Number(textValue(request.options, 'count', '5')) || 5 }, () => interval.next().toDate().toISOString());
  return okFields([outputField('next', '后续触发时间', next.join('\n'), 'text', { primary: true }), outputField('detail', '详情', { expression, next }, 'json')], 'Cron 解析完成');
}

function runTimezone(request: ToolRunRequest): ToolRunResult {
  const timezone = textValue(request.options, 'timezone', 'Asia/Shanghai');
  const date = request.input.trim() ? new Date(request.input.trim()) : new Date();
  return okFields(
    [
      outputField('value', '目标时间', date.toLocaleString('zh-CN', { timeZone: timezone === '本地' ? undefined : timezone }), 'text', { primary: true }),
      outputField('source', '源 ISO', date.toISOString()),
      outputField('timezone', '目标时区', timezone),
    ],
    '时区转换完成',
  );
}

function runDateCalc(request: ToolRunRequest): ToolRunResult {
  const payload = request.input.trim() ? JSON.parse(request.input) : { start: new Date().toISOString(), days: 1 };
  const start = new Date(payload.start);
  const end = payload.end ? new Date(payload.end) : new Date(start.getTime() + Number(payload.days ?? 0) * 86400000);
  return okFields(
    [
      outputField('diffDays', '相差天数', String(Math.round((end.getTime() - start.getTime()) / 86400000)), 'number', { primary: true }),
      outputField('start', '开始时间', start.toISOString()),
      outputField('end', '结束时间', end.toISOString()),
    ],
    '日期计算完成',
  );
}
