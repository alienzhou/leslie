import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import path from 'node:path';
import { createInteractivePermissionHandler } from '../agent/permission-prompt.js';
import { createOutputRenderer } from '../agent/output-renderer.js';
import { splitComma, requiredString } from '../utils.js';
import { LESLIE_RUNTIME_DIR_ENV, startThreadWorker } from '../runtime/agent-runtime.js';

export async function runSpawn(core: LeslieCore, flags: Record<string, unknown>) {
  const intent = requiredString(flags.intent, 'intent');
  const objective = requiredString(flags.objective, 'objective');
  const inherit = (flags.inherit as 'full' | 'partial' | 'none' | undefined) ?? 'none';

  const output = await core.spawnThread({
    intent,
    objective,
    parentId: typeof flags.parent === 'string' ? flags.parent : undefined,
    inherit,
    inheritScope: splitComma(flags.scope),
    refs: splitComma(flags.ref),
    executor:
      flags.executor === 'human' || flags.executor === 'agent' || flags.executor === 'system'
        ? flags.executor
        : undefined,
    tags: splitComma(flags.tags),
  });

  const threadId = output.result.thread_id;

  // --no-run (minimist parses as run=false) 或 executor=human 时不启动 Agent
  const noRun = flags.run === false;
  const executor = flags.executor ?? 'agent';
  if (noRun || executor === 'human') {
    return {
      success: true,
      data: output.result,
      warnings: output.warnings,
    };
  }

  // 默认后台非阻塞。可用 --foreground 强制前台模式。
  const forceForeground = flags.foreground === true;
  if (!forceForeground) {
    const runtimeDir = process.env[LESLIE_RUNTIME_DIR_ENV];
    if (typeof runtimeDir === 'string' && runtimeDir.length > 0) {
      await startThreadWorker({
        threadId,
        runtimeDir,
        source: 'spawn',
      });
    } else {
      await startThreadWorker({
        threadId,
        source: 'spawn',
      });
    }
    const workerLogPath = path.join(core.workspaceRoot, '.leslie', 'logs', 'workers', `${threadId}.ndjson`);
    process.stderr.write(`\nThread ${threadId} started in background.\n`);
    process.stderr.write(`Worker log: ${workerLogPath}\n`);
    return {
      success: true,
      data: {
        ...output.result,
        run_mode: 'background',
        worker_log_path: workerLogPath,
      },
      warnings: output.warnings,
    };
  }

  // 前台模式：启动 Agent 并实时展示输出
  process.stderr.write(`\nStarting agent for thread ${threadId} (foreground)...\n\n`);

  const agentResult = await core.runAgent(threadId, {
    canUseTool: createInteractivePermissionHandler(core.workspaceRoot),
    onMessage: createOutputRenderer(),
    env: process.env as Record<string, string | undefined>,
  });

  return {
    success: agentResult.success,
    data: {
      ...output.result,
      session_id: agentResult.sessionId,
      agent_result: {
        success: agentResult.success,
        result: agentResult.result,
        errors: agentResult.errors,
        duration_ms: agentResult.durationMs,
        cost_usd: agentResult.costUsd,
        num_turns: agentResult.numTurns,
      },
    },
    warnings: output.warnings,
  };
}
