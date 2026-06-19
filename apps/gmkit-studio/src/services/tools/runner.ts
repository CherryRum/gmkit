import { fail, type ToolRunRequest, type ToolRunResult, type ToolRunner } from './types';

const runners: Record<string, ToolRunner> = {};

export function registerToolRunner(toolId: string, runner: ToolRunner): void {
  runners[toolId] = runner;
}

export async function runStudioTool(request: ToolRunRequest): Promise<ToolRunResult> {
  const runner = runners[request.tool.id];
  if (!runner) {
    return fail(`${request.tool.name} runner 尚未接入真实实现。`);
  }

  try {
    return await runner(request);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

export type { ToolRunRequest, ToolRunResult, ToolRunner, ToolValues } from './types';
