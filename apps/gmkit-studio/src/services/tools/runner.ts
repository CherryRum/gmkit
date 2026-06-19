import { fail, type ToolRunRequest, type ToolRunResult, type ToolRunner } from './types';
import { cryptoRunners } from './crypto-runners';
import { dataRunners } from './data-runners';
import { encodingRunners } from './encoding-runners';
import { keycertRunners } from './keycert-runners';
import { networkRunners } from './network-runners';
import { textRunners } from './text-runners';
import { timeRunners } from './time-runners';

const runners: Record<string, ToolRunner> = {
  ...cryptoRunners,
  ...dataRunners,
  ...encodingRunners,
  ...keycertRunners,
  ...networkRunners,
  ...textRunners,
  ...timeRunners,
};

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
