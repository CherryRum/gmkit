import { camelCase, kebabCase, pascalCase, snakeCase } from 'change-case';
import { diffChars, diffLines, diffWords } from 'diff';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import slugify from 'slugify';

import { okFields, outputField, type ToolRunner, type ToolRunRequest, type ToolRunResult } from './types';
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
  const mode = textValue(request.options, 'mode', '行');
  const parts = mode === '词' ? diffWords(left, right) : mode === '字符' ? diffChars(left, right) : diffLines(left, right);
  const patch = parts.map((part) => `${part.added ? '+ ' : part.removed ? '- ' : '  '}${part.value}`).join('');
  return okFields(
    [
      outputField('diff', `${mode}级 Diff`, patch, 'text', { primary: true }),
      outputField('summary', '统计', { added: parts.filter((part) => part.added).length, removed: parts.filter((part) => part.removed).length }, 'json'),
    ],
    '文本 Diff 完成',
  );
}

function runRegex(request: ToolRunRequest): ToolRunResult {
  const pattern = textValue(request.options, 'query', '\\w+');
  const flags = textValue(request.options, 'flags', 'gmi').replace(/[^dgimsuvy]/g, '') || 'g';
  const regex = new RegExp(pattern, flags);
  const matches = Array.from(request.input.matchAll(regex)).map((match) => ({ match: match[0], index: match.index, groups: match.groups ?? [] }));
  return okFields([outputField('matches', '匹配结果', matches, 'json', { primary: true })], '正则匹配完成');
}

function runCase(request: ToolRunRequest): ToolRunResult {
  const value = request.input.trim();
  return okFields(
    [
      outputField('camelCase', 'camelCase', camelCase(value), 'text', { primary: true }),
      outputField('pascalCase', 'PascalCase', pascalCase(value), 'text'),
      outputField('snakeCase', 'snake_case', snakeCase(value), 'text'),
      outputField('kebabCase', 'kebab-case', kebabCase(value), 'text'),
    ],
    '大小写转换完成',
  );
}

function runSlug(request: ToolRunRequest): ToolRunResult {
  return okFields([outputField('slug', 'Slug', slugify(request.input, { lower: true, strict: true, trim: true }), 'text', { primary: true })], 'Slug 生成完成');
}

async function runMarkdown(request: ToolRunRequest): Promise<ToolRunResult> {
  const html = await marked.parse(request.input);
  return okFields([outputField('html', 'HTML', DOMPurify.sanitize(html), 'code', { primary: true })], 'Markdown 转 HTML 完成');
}

function runTextStat(request: ToolRunRequest): ToolRunResult {
  const lines = request.input.split(/\r?\n/);
  const words = request.input.trim() ? request.input.trim().split(/\s+/) : [];
  return okFields([outputField('stats', '统计', { chars: request.input.length, charsNoSpace: request.input.replace(/\s/g, '').length, words: words.length, lines: lines.length }, 'json', { primary: true })], '文本统计完成');
}

function runDedupe(request: ToolRunRequest): ToolRunResult {
  const lines = request.input.split(/\r?\n/).filter((line) => line.length > 0);
  const unique = Array.from(new Set(lines)).sort((a, b) => a.localeCompare(b));
  return okFields([outputField('lines', '去重结果', unique.join('\n'), 'text', { primary: true })], '去重排序完成');
}
