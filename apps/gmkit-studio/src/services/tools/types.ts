import type { StudioTool } from '@/data/studio-tools';

export type ToolValue = string | boolean;
export type ToolValues = Record<string, ToolValue>;
export type ToolStatus = 'success' | 'error' | 'info';
export type ToolOutputKind = 'text' | 'secret' | 'hex' | 'base64' | 'pem' | 'json' | 'code' | 'boolean' | 'number';

export interface ToolRunRequest {
  tool: StudioTool;
  tab: string;
  input: string;
  output: string;
  options: ToolValues;
}

export interface ToolRunResult {
  status: ToolStatus;
  output: string;
  detail: string;
  options?: ToolValues;
  fields?: ToolOutputField[];
}

export type ToolRunner = (request: ToolRunRequest) => Promise<ToolRunResult> | ToolRunResult;

export interface ToolOutputField {
  key: string;
  label: string;
  value: string;
  kind: ToolOutputKind;
  copyable: boolean;
  secret?: boolean;
  primary?: boolean;
  note?: string;
}

export function ok(output: unknown, detail = '执行完成', options?: ToolValues): ToolRunResult {
  return {
    status: 'success',
    output: typeof output === 'string' ? output : JSON.stringify(output, null, 2),
    detail,
    options,
  };
}

// 多输出工具统一走字段协议，避免公钥/私钥/Hex/Base64 被塞进一段 JSON 后难以复制。
export function okFields(fields: ToolOutputField[], detail = '执行完成', options?: ToolValues): ToolRunResult {
  const primary = fields.find((field) => field.primary) ?? fields[0];
  return {
    status: 'success',
    output: primary?.value ?? '',
    detail,
    options,
    fields,
  };
}

export function info(detail: string, output = '', options?: ToolValues): ToolRunResult {
  return {
    status: 'info',
    output,
    detail,
    options,
  };
}

export function fail(message: string): ToolRunResult {
  return {
    status: 'error',
    output: '',
    detail: message,
  };
}

export function optionString(options: ToolValues, key: string, fallback = ''): string {
  const value = options[key];
  return typeof value === 'string' ? value : fallback;
}

export function optionBool(options: ToolValues, key: string, fallback = false): boolean {
  const value = options[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function outputField(
  key: string,
  label: string,
  value: unknown,
  kind: ToolOutputKind = 'text',
  extra: Partial<Omit<ToolOutputField, 'key' | 'label' | 'value' | 'kind' | 'copyable'>> = {},
): ToolOutputField {
  return {
    key,
    label,
    value: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
    kind,
    copyable: true,
    ...extra,
  };
}
