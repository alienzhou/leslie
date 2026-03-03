import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export const LESLIE_RUNTIME_DIR_ENV = 'LESLIE_RUNTIME_DIR';

export type RuntimeEvent =
  | {
      type: 'thread_started';
      threadId: string;
      source: 'spawn' | 'run' | 'resume';
      pid?: number;
      timestamp: string;
    }
  | {
      type: 'tool_request';
      threadId: string;
      requestId: string;
      toolName: string;
      timestamp: string;
    }
  | {
      type: 'tool_decision';
      threadId: string;
      requestId: string;
      decision: 'allow' | 'deny';
      timestamp: string;
    }
  | {
      type: 'assistant_text';
      threadId: string;
      text: string;
      timestamp: string;
    }
  | {
      type: 'worker_exit';
      threadId: string;
      success: boolean;
      timestamp: string;
    };

export interface RuntimePaths {
  baseDir: string;
  approvalsDir: string;
  requestsDir: string;
  responsesDir: string;
  eventsLogPath: string;
}

export function getRuntimePaths(runtimeDir: string): RuntimePaths {
  const approvalsDir = path.join(runtimeDir, 'approvals');
  return {
    baseDir: runtimeDir,
    approvalsDir,
    requestsDir: path.join(approvalsDir, 'requests'),
    responsesDir: path.join(approvalsDir, 'responses'),
    eventsLogPath: path.join(runtimeDir, 'events.ndjson'),
  };
}

export async function ensureRuntimeDirs(runtimeDir: string): Promise<RuntimePaths> {
  const paths = getRuntimePaths(runtimeDir);
  await fs.mkdir(paths.requestsDir, { recursive: true });
  await fs.mkdir(paths.responsesDir, { recursive: true });
  try {
    await fs.access(paths.eventsLogPath);
  } catch {
    await fs.writeFile(paths.eventsLogPath, '', 'utf-8');
  }
  return paths;
}

export function buildRuntimeDir(workspaceRoot: string, objectiveId: string): string {
  return path.join(workspaceRoot, '.leslie', 'runtime', `${objectiveId}-${Date.now()}`);
}

export async function appendRuntimeEvent(runtimeDir: string, event: RuntimeEvent): Promise<void> {
  const { eventsLogPath } = getRuntimePaths(runtimeDir);
  await fs.appendFile(eventsLogPath, `${JSON.stringify(event)}\n`, 'utf-8');
}

export interface StartWorkerOptions {
  threadId: string;
  runtimeDir?: string;
  source: 'spawn' | 'run' | 'resume';
}

export async function startThreadWorker(options: StartWorkerOptions): Promise<{ pid?: number }> {
  const env = { ...process.env };
  if (options.runtimeDir) {
    env[LESLIE_RUNTIME_DIR_ENV] = options.runtimeDir;
    await ensureRuntimeDirs(options.runtimeDir);
  } else {
    delete env[LESLIE_RUNTIME_DIR_ENV];
  }

  const child = spawn(
    process.execPath,
    [process.argv[1] ?? 'bin/run.js', '_worker', '--thread', options.threadId, '--format', 'json'],
    {
      env,
      cwd: process.cwd(),
      detached: Boolean(options.runtimeDir),
      stdio: options.runtimeDir ? 'ignore' : 'inherit',
    },
  );

  child.unref();

  if (options.runtimeDir) {
    await appendRuntimeEvent(options.runtimeDir, {
      type: 'thread_started',
      threadId: options.threadId,
      source: options.source,
      pid: child.pid,
      timestamp: new Date().toISOString(),
    });
  }

  return { pid: child.pid };
}

export function newApprovalRequestId(): string {
  return randomUUID();
}
