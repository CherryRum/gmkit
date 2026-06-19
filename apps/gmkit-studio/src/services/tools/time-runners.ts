import CronExpressionParser from 'cron-parser';
import { ulid } from 'ulid';

import { ok, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';
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
  return ok({ milliseconds: date.getTime(), seconds: Math.floor(date.getTime() / 1000), iso: date.toISOString(), local: date.toLocaleString() }, '时间戳转换完成');
}

function runUuid(request: ToolRunRequest): ToolRunResult {
  const count = Number(textValue(request.options, 'count', '5')) || 5;
  if (request.tab === '解析' || request.tab === '校验') {
    return ok({ valid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.input.trim()) }, 'UUID 校验完成');
  }
  return ok(Array.from({ length: count }, () => crypto.randomUUID()).join('\n'), 'UUID 生成完成');
}

function runUlid(request: ToolRunRequest): ToolRunResult {
  const count = Number(textValue(request.options, 'count', '5')) || 5;
  return ok(Array.from({ length: count }, () => ulid()).join('\n'), 'ULID 生成完成');
}

function runSnowflake(_request: ToolRunRequest): ToolRunResult {
  const epoch = 1577836800000n;
  const now = BigInt(Date.now()) - epoch;
  const machine = 1n;
  const sequence = BigInt(Math.floor(Math.random() * 4096));
  return ok(((now << 22n) | (machine << 12n) | sequence).toString(), 'Snowflake ID 生成完成');
}

function runCron(request: ToolRunRequest): ToolRunResult {
  const expression = request.input.trim() || '*/5 * * * *';
  const interval = CronExpressionParser.parse(expression, { currentDate: new Date() });
  const next = Array.from({ length: Number(textValue(request.options, 'count', '5')) || 5 }, () => interval.next().toDate().toISOString());
  return ok({ expression, next }, 'Cron 解析完成');
}

function runTimezone(request: ToolRunRequest): ToolRunResult {
  const timezone = textValue(request.options, 'timezone', 'Asia/Shanghai');
  const date = request.input.trim() ? new Date(request.input.trim()) : new Date();
  return ok({ source: date.toISOString(), timezone, value: date.toLocaleString('zh-CN', { timeZone: timezone === '本地' ? undefined : timezone }) }, '时区转换完成');
}

function runDateCalc(request: ToolRunRequest): ToolRunResult {
  const payload = request.input.trim() ? JSON.parse(request.input) : { start: new Date().toISOString(), days: 1 };
  const start = new Date(payload.start);
  const end = payload.end ? new Date(payload.end) : new Date(start.getTime() + Number(payload.days ?? 0) * 86400000);
  return ok({ start: start.toISOString(), end: end.toISOString(), diffDays: Math.round((end.getTime() - start.getTime()) / 86400000) }, '日期计算完成');
}
