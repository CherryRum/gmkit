import DOMPurify from 'dompurify';
import { marked } from 'marked';

import { ok, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';
import { textValue } from './shared';

export const textRunners: Record<string, ToolRunner> = {
  diff: runDiff,
  regex: runRegex,
  case: runCase,
  slug: runSlug,
  markdown: runMarkdown,
  textstat: runTextStat,
  dedupe: runDedupe,
};

function runDiff(request: ToolRunRequest): ToolRunResult {
  const [left = '', right = ''] = request.input.split(/\n---\n/);
  const leftLines = left.split(/\r?\n/);
  const rightLines = right.split(/\r?\n/);
  const max = Math.max(leftLines.length, rightLines.length);
  const rows = Array.from({ length: max }, (_, index) => {
    if (leftLines[index] === rightLines[index]) return `  ${leftLines[index] ?? ''}`;
    return `- ${leftLines[index] ?? ''}\n+ ${rightLines[index] ?? ''}`;
  });
  return ok(rows.join('\n'), '文本 Diff 完成');
}

function runRegex(request: ToolRunRequest): ToolRunResult {
  const pattern = textValue(request.options, 'query', '\\w+');
  const flags = textValue(request.options, 'flags', 'gmi').replace(/[^dgimsuvy]/g, '') || 'g';
  const regex = new RegExp(pattern, flags);
  const matches = Array.from(request.input.matchAll(regex)).map((match) => ({ match: match[0], index: match.index, groups: match.groups ?? [] }));
  return ok(matches, '正则匹配完成');
}

function runCase(request: ToolRunRequest): ToolRunResult {
  const words = request.input.trim().split(/[\s_-]+/).filter(Boolean);
  const camel = words.map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word))).join('');
  return ok({ camelCase: camel, PascalCase: capitalize(camel), snake_case: words.join('_').toLowerCase(), kebabCase: words.join('-').toLowerCase() }, '大小写转换完成');
}

function runSlug(request: ToolRunRequest): ToolRunResult {
  const slug = request.input
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
  return ok(slug, 'Slug 生成完成');
}

async function runMarkdown(request: ToolRunRequest): Promise<ToolRunResult> {
  const html = await marked.parse(request.input);
  return ok(DOMPurify.sanitize(html), 'Markdown 转 HTML 完成');
}

function runTextStat(request: ToolRunRequest): ToolRunResult {
  const lines = request.input.split(/\r?\n/);
  const words = request.input.trim() ? request.input.trim().split(/\s+/) : [];
  return ok({ chars: request.input.length, charsNoSpace: request.input.replace(/\s/g, '').length, words: words.length, lines: lines.length }, '文本统计完成');
}

function runDedupe(request: ToolRunRequest): ToolRunResult {
  const lines = request.input.split(/\r?\n/).filter((line) => line.length > 0);
  const unique = Array.from(new Set(lines)).sort((a, b) => a.localeCompare(b));
  return ok(unique.join('\n'), '去重排序完成');
}

function capitalize(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value;
}
