import Ajv from 'ajv';
import { applyEdits, format, parse, ParseError, printParseErrorCode } from 'jsonc-parser';
import { JSONPath } from 'jsonpath-plus';
import { jsonrepair } from 'jsonrepair';

interface JsonWorkerRequest {
  id: number;
  action: string;
  input: string;
  options: {
    indent: string;
    sortKeys: boolean;
    escapeUnicode: boolean;
    query: string;
  };
}

interface JsonWorkerResponse {
  id: number;
  status: 'success' | 'error' | 'info';
  output: string;
  detail: string;
}

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<JsonWorkerRequest>) => void) | null;
  postMessage: (message: JsonWorkerResponse) => void;
};

ctx.onmessage = (event: MessageEvent<JsonWorkerRequest>) => {
  const request = event.data;
  try {
    ctx.postMessage({ id: request.id, ...runJsonAction(request) } satisfies JsonWorkerResponse);
  } catch (error) {
    ctx.postMessage({
      id: request.id,
      status: 'error',
      output: '',
      detail: describeJsonError(request.input, error),
    } satisfies JsonWorkerResponse);
  }
};

function runJsonAction(request: JsonWorkerRequest): Omit<JsonWorkerResponse, 'id'> {
  const { action, input, options } = request;
  const indent = normalizeIndent(options.indent);

  if (action === '修复') {
    const repaired = jsonrepair(input);
    return {
      status: 'success',
      output: formatJson(JSON.parse(repaired), indent, options),
      detail: 'JSON 修复完成',
    };
  }

  if (action === '校验') {
    const value = parseStrict(input);
    return {
      status: 'success',
      output: JSON.stringify(stats(value), null, 2),
      detail: 'JSON 校验通过',
    };
  }

  if (action === '压缩') {
    return {
      status: 'success',
      output: JSON.stringify(parseStrict(input)),
      detail: 'JSON 压缩完成',
    };
  }

  if (action === '查询') {
    const value = parseLoose(input);
    const result = JSONPath({ path: options.query || '$', json: value as any });
    return {
      status: 'success',
      output: JSON.stringify(result, null, indent),
      detail: `JSONPath 查询完成: ${options.query || '$'}`,
    };
  }

  if (action === 'Schema') {
    const parsed = parseLoose(input);
    const schema = parseLoose(options.query || '{}');
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema as object);
    const valid = validate(parsed);
    return {
      status: valid ? 'success' : 'error',
      output: JSON.stringify({ valid, errors: validate.errors ?? [] }, null, 2),
      detail: valid ? 'Schema 校验通过' : 'Schema 校验未通过',
    };
  }

  if (action === '树') {
    const value = parseLoose(input);
    return {
      status: 'success',
      output: renderTree(value),
      detail: 'JSON 树视图生成完成',
    };
  }

  const parsed = parseStrict(input);
  return {
    status: 'success',
    output: formatJson(parsed, indent, options),
    detail: 'JSON 格式化完成',
  };
}

function parseStrict(input: string): unknown {
  return JSON.parse(input);
}

function parseLoose(input: string): unknown {
  const errors: ParseError[] = [];
  const value = parse(input, errors, { allowTrailingComma: true, disallowComments: false });
  if (errors.length) {
    const error = errors[0];
    throw new Error(`${printParseErrorCode(error.error)} at offset ${error.offset}`);
  }
  return value;
}

function formatJson(value: unknown, indent: number | string, options: JsonWorkerRequest['options']): string {
  const normalized = options.sortKeys ? sortKeys(value) : value;
  let output = JSON.stringify(normalized, null, indent);
  if (options.escapeUnicode) output = output.replace(/[^\x00-\x7F]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return output;
}

function normalizeIndent(value: string): number | string {
  if (value === 'Tab') return '\t';
  const indent = Number(value);
  return Number.isFinite(indent) ? indent : 2;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortKeys(item)]),
    );
  }
  return value;
}

function stats(value: unknown): Record<string, number> {
  const result = { objects: 0, arrays: 0, keys: 0, strings: 0, numbers: 0, booleans: 0, nulls: 0 };
  visit(value);
  return result;

  function visit(item: unknown): void {
    if (Array.isArray(item)) {
      result.arrays += 1;
      item.forEach(visit);
    } else if (item && typeof item === 'object') {
      result.objects += 1;
      const entries = Object.entries(item);
      result.keys += entries.length;
      entries.forEach(([, child]) => visit(child));
    } else if (typeof item === 'string') {
      result.strings += 1;
    } else if (typeof item === 'number') {
      result.numbers += 1;
    } else if (typeof item === 'boolean') {
      result.booleans += 1;
    } else if (item === null) {
      result.nulls += 1;
    }
  }
}

function renderTree(value: unknown, depth = 0): string {
  const pad = '  '.repeat(depth);
  if (Array.isArray(value)) {
    return [`${pad}Array(${value.length})`, ...value.map((item, index) => `${pad}  [${index}]\n${renderTree(item, depth + 2)}`)].join('\n');
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    return [`${pad}Object(${entries.length})`, ...entries.map(([key, item]) => `${pad}  ${key}\n${renderTree(item, depth + 2)}`)].join('\n');
  }
  return `${pad}${JSON.stringify(value)}`;
}

function describeJsonError(input: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const offsetMatch = /position (\d+)|offset (\d+)/i.exec(message);
  const offset = offsetMatch ? Number(offsetMatch[1] ?? offsetMatch[2]) : 0;
  const { line, column } = offsetToLineColumn(input, offset);
  const snippet = input.slice(Math.max(0, offset - 40), offset + 80);
  return `JSON 执行失败: ${message}\nline ${line}, column ${column}\n\n${snippet}`;
}

function offsetToLineColumn(input: string, offset: number): { line: number; column: number } {
  const safeOffset = Math.max(0, Math.min(offset, input.length));
  const head = input.slice(0, safeOffset);
  const lines = head.split(/\r\n|\r|\n/);
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

export function formatJsonTextForTest(input: string, indent = '2'): string {
  const edits = format(input, undefined, { tabSize: Number(indent) || 2, insertSpaces: indent !== 'Tab' });
  return applyEdits(input, edits);
}
