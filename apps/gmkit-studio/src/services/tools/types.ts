import type { StudioTool } from '@/data/studio-tools';

export type ToolValue = string | boolean;
export type ToolValues = Record<string, ToolValue>;
export type ToolStatus = 'success' | 'error' | 'info';

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
}

export type ToolRunner = (request: ToolRunRequest) => Promise<ToolRunResult> | ToolRunResult;

export function ok(output: unknown, detail = '执行完成', options?: ToolValues): ToolRunResult {
  return {
    status: 'success',
    output: typeof output === 'string' ? output : JSON.stringify(output, null, 2),
    detail,
    options,
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
