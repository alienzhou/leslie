import fs from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import type { LeslieCore, CanUseToolFn, PermissionResult, AgentMessage } from '@vibe-x-ai/leslie-core';
import { createInteractivePermissionHandler } from '../agent/permission-prompt.js';
import { decideToolPermission, loadPermissionPolicy } from '../agent/permission-policy.js';
import { createOutputRenderer } from '../agent/output-renderer.js';
import { requiredString } from '../utils.js';
import {
  LESLIE_RUNTIME_DIR_ENV,
  appendRuntimeEvent,
  ensureRuntimeDirs,
  getRuntimePaths,
  newApprovalRequestId,
} from '../runtime/agent-runtime.js';

interface ApprovalResponsePayload {
  behavior: 'allow' | 'deny';
  updatedInput?: Record<string, unknown>;
  message?: string;
}

interface WorkerLogEvent {
  event: 'worker_started' | 'worker_finished' | 'worker_failed';
  thread_id: string;
  timestamp: string;
  runtime_dir?: string;
  success?: boolean;
  session_id?: string;
  duration_ms?: number;
  cost_usd?: number;
  num_turns?: number;
  errors?: string[];
}

function getWorkerLogPath(workspaceRoot: string, threadId: string): string {
  return path.join(workspaceRoot, '.leslie', 'logs', 'workers', `${threadId}.ndjson`);
}

async function appendWorkerLog(workspaceRoot: string, threadId: string, payload: WorkerLogEvent): Promise<void> {
  const logPath = getWorkerLogPath(workspaceRoot, threadId);
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, `${JSON.stringify(payload)}\n`, 'utf-8');
}

async function waitForApprovalResponse(
  responseFilePath: string,
  responseDir: string,
  fileName: string,
  timeoutMs: number,
): Promise<ApprovalResponsePayload> {
  const tryRead = async (): Promise<ApprovalResponsePayload | null> => {
    try {
      const raw = await fs.readFile(responseFilePath, 'utf-8');
      return JSON.parse(raw) as ApprovalResponsePayload;
    } catch {
      return null;
    }
  };

  const existing = await tryRead();
  if (existing) {
    return existing;
  }

  return await new Promise<ApprovalResponsePayload>((resolve, reject) => {
    const watcher = watch(responseDir, async (_eventType, changedFile) => {
      if (String(changedFile ?? '') !== fileName) {
        return;
      }
      const parsed = await tryRead();
      if (!parsed) {
        return;
      }
      clearTimeout(timer);
      watcher.close();
      resolve(parsed);
    });

    const timer = setTimeout(() => {
      watcher.close();
      reject(new Error('Approval response timeout'));
    }, timeoutMs);
  });
}

function createRuntimePermissionHandler(threadId: string, runtimeDir: string, workspaceRoot: string): CanUseToolFn {
  const policy = loadPermissionPolicy(workspaceRoot);
  return async (toolName: string, input: Record<string, unknown>): Promise<PermissionResult> => {
    const policyDecision = decideToolPermission(policy, toolName, input);
    if (policyDecision.action === 'allow') {
      return {
        behavior: 'allow',
        updatedInput: input,
      };
    }
    if (policyDecision.action === 'deny') {
      return {
        behavior: 'deny',
        message: policyDecision.reason ?? `Denied by policy for ${toolName}`,
      };
    }

    await ensureRuntimeDirs(runtimeDir);
    const requestId = newApprovalRequestId();
    const paths = getRuntimePaths(runtimeDir);
    const requestPath = path.join(paths.requestsDir, `${requestId}.json`);
    const responseFileName = `${requestId}.json`;
    const responsePath = path.join(paths.responsesDir, responseFileName);
    const now = new Date().toISOString();

    await fs.writeFile(
      requestPath,
      JSON.stringify(
        {
          request_id: requestId,
          thread_id: threadId,
          tool_name: toolName,
          input,
          created_at: now,
        },
        null,
        2,
      ),
      'utf-8',
    );
    await appendRuntimeEvent(runtimeDir, {
      type: 'tool_request',
      threadId,
      requestId,
      toolName,
      timestamp: now,
    });

    const decision = await waitForApprovalResponse(responsePath, paths.responsesDir, responseFileName, 30 * 60 * 1000);
    await appendRuntimeEvent(runtimeDir, {
      type: 'tool_decision',
      threadId,
      requestId,
      decision: decision.behavior,
      timestamp: new Date().toISOString(),
    });

    if (decision.behavior === 'allow') {
      return {
        behavior: 'allow',
        updatedInput: decision.updatedInput ?? input,
      };
    }
    return {
      behavior: 'deny',
      message: decision.message ?? `Denied by run monitor for ${toolName}`,
    };
  };
}

export async function runWorker(core: LeslieCore, flags: Record<string, unknown>) {
  const threadId = requiredString(flags.thread, 'thread');
  const runtimeDir = process.env[LESLIE_RUNTIME_DIR_ENV];
  const workspaceRoot = core.workspaceRoot;

  const canUseTool =
    typeof runtimeDir === 'string' && runtimeDir.length > 0
      ? createRuntimePermissionHandler(threadId, runtimeDir, workspaceRoot)
      : createInteractivePermissionHandler(workspaceRoot);

  const onMessage =
    typeof runtimeDir === 'string' && runtimeDir.length > 0
      ? (message: AgentMessage) => {
          if (message.type === 'assistant' && message.text) {
            void appendRuntimeEvent(runtimeDir, {
              type: 'assistant_text',
              threadId,
              text: message.text,
              timestamp: new Date().toISOString(),
            });
          }
        }
      : createOutputRenderer();

  await appendWorkerLog(workspaceRoot, threadId, {
    event: 'worker_started',
    thread_id: threadId,
    timestamp: new Date().toISOString(),
    runtime_dir: runtimeDir,
  });

  try {
    const agentResult = await core.runAgent(threadId, {
      canUseTool,
      onMessage,
      env: process.env as Record<string, string | undefined>,
    });

    if (runtimeDir) {
      await appendRuntimeEvent(runtimeDir, {
        type: 'worker_exit',
        threadId,
        success: agentResult.success,
        timestamp: new Date().toISOString(),
      });
    }

    await appendWorkerLog(workspaceRoot, threadId, {
      event: 'worker_finished',
      thread_id: threadId,
      timestamp: new Date().toISOString(),
      runtime_dir: runtimeDir,
      success: agentResult.success,
      session_id: agentResult.sessionId,
      duration_ms: agentResult.durationMs,
      cost_usd: agentResult.costUsd,
      num_turns: agentResult.numTurns,
      errors: agentResult.errors,
    });

    return {
      success: agentResult.success,
      data: {
        thread_id: threadId,
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
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (runtimeDir) {
      await appendRuntimeEvent(runtimeDir, {
        type: 'worker_exit',
        threadId,
        success: false,
        timestamp: new Date().toISOString(),
      });
    }

    await appendWorkerLog(workspaceRoot, threadId, {
      event: 'worker_failed',
      thread_id: threadId,
      timestamp: new Date().toISOString(),
      runtime_dir: runtimeDir,
      success: false,
      errors: [errorMsg],
    });

    throw error;
  }
}
