import fs from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stderr } from 'node:process';
import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { requiredString } from '../utils.js';
import { buildRuntimeDir, ensureRuntimeDirs, getRuntimePaths, LESLIE_RUNTIME_DIR_ENV, startThreadWorker } from '../runtime/agent-runtime.js';
import { createRunTui, type RunTui } from '../runtime/run-tui.js';

const TERMINATED_STATUS = new Set(['completed', 'cancelled', 'archived']);

function isTerminated(status: string): boolean {
  return TERMINATED_STATUS.has(status);
}

async function askApproval(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: stdin, output: stderr });
  try {
    const answer = await rl.question(question);
    const normalized = answer.trim().toLowerCase();
    return normalized === 'y' || normalized === 'yes';
  } finally {
    rl.close();
  }
}

function truncate(text: string, max = 160): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}...`;
}

export async function runRun(core: LeslieCore, flags: Record<string, unknown>) {
  const title = requiredString(flags.title, 'title');
  const enableTui = flags.tui !== false && process.stdout.isTTY;
  const shouldPrintEventLogs = !enableTui;

  const objective = await core.createObjective(title);
  const runtimeDir = buildRuntimeDir(core.workspaceRoot, objective.objectiveId);
  await ensureRuntimeDirs(runtimeDir);
  process.env[LESLIE_RUNTIME_DIR_ENV] = runtimeDir;

  const spawned = await core.spawnThread({
    intent: title,
    objective: objective.objectiveId,
    inherit: 'none',
  });
  const rootThreadId = spawned.result.thread_id;

  await startThreadWorker({
    threadId: rootThreadId,
    runtimeDir,
    source: 'run',
  });
  stderr.write(`[run] objective ${objective.objectiveId} started\n`);
  stderr.write(`[run] root thread ${rootThreadId} started in background\n`);
  stderr.write(`[run] logs directory ${objective.logDir}\n`);

  const runtimePaths = getRuntimePaths(runtimeDir);
  const ui: RunTui | null = enableTui ? createRunTui(title, objective.objectiveId) : null;
  const handledApprovalRequests = new Set<string>();
  const activeWorkers = new Set<string>([rootThreadId]);
  let eventsOffset = 0;
  let ended = false;
  let checking = false;
  let pendingCheck = false;
  let approvalQueueRunning = false;
  let resolveDone: (() => void) | null = null;

  const closeWatchers: Array<() => void> = [];
  const stop = () => {
    if (ended) {
      return;
    }
    ended = true;
    for (const closeWatcher of closeWatchers) {
      closeWatcher();
    }
    if (resolveDone) {
      resolveDone();
      resolveDone = null;
    }
  };

  const processEvents = async () => {
    const content = await fs.readFile(runtimePaths.eventsLogPath, 'utf-8');
    if (eventsOffset >= content.length) {
      return;
    }

    const delta = content.slice(eventsOffset);
    eventsOffset = content.length;
    const lines = delta.split('\n').filter(Boolean);

    for (const line of lines) {
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(line) as Record<string, unknown>;
      } catch {
        continue;
      }
      const eventType = String(event.type ?? '');
      const threadId = String(event.threadId ?? '');
      if (!threadId) {
        continue;
      }
      if (eventType === 'thread_started') {
        activeWorkers.add(threadId);
        if (shouldPrintEventLogs) {
          stderr.write(`[thread:${threadId}] started\n`);
        }
        ui?.updateThread({
          id: threadId,
          status: 'active',
        });
      } else if (eventType === 'assistant_text') {
        if (shouldPrintEventLogs) {
          stderr.write(`[thread:${threadId}] ${truncate(String(event.text ?? ''))}\n`);
        }
        ui?.updateThread({
          id: threadId,
          appendLine: String(event.text ?? ''),
        });
      } else if (eventType === 'worker_exit') {
        activeWorkers.delete(threadId);
        const success = Boolean(event.success);
        if (shouldPrintEventLogs) {
          stderr.write(`[thread:${threadId}] exited (${success ? 'success' : 'error'})\n`);
        }
        if (!success) {
          const thread = await core.getThread(threadId);
          if (!isTerminated(thread.status)) {
            await core.lifecycle(threadId, 'cancel', 'Worker exited with error');
          }
        }
        const thread = await core.getThread(threadId);
        ui?.updateThread({
          id: threadId,
          status: thread.status,
        });
      } else if (eventType === 'tool_request') {
        if (shouldPrintEventLogs) {
          stderr.write(`[thread:${threadId}] tool request ${String(event.toolName ?? '')}\n`);
        }
        ui?.updateThread({
          id: threadId,
          appendLine: `tool request: ${String(event.toolName ?? '')}`,
        });
      }
    }
  };

  const processApprovalRequests = async () => {
    if (approvalQueueRunning || ended) {
      return;
    }
    approvalQueueRunning = true;
    try {
      const files = (await fs.readdir(runtimePaths.requestsDir))
        .filter((file) => file.endsWith('.json'))
        .sort((a, b) => a.localeCompare(b));

      for (const fileName of files) {
        if (handledApprovalRequests.has(fileName)) {
          continue;
        }

        const requestPath = path.join(runtimePaths.requestsDir, fileName);
        const responsePath = path.join(runtimePaths.responsesDir, fileName);

        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(await fs.readFile(requestPath, 'utf-8')) as Record<string, unknown>;
        } catch {
          continue;
        }
        handledApprovalRequests.add(fileName);

        const threadId = String(payload.thread_id ?? '');
        const toolName = String(payload.tool_name ?? '');
        const inputPreview = truncate(JSON.stringify(payload.input ?? {}), 200);
        if (!ui) {
          stderr.write(`\n[approval] thread=${threadId} tool=${toolName}\n`);
          stderr.write(`[approval] input=${inputPreview}\n`);
        }
        const allow = ui
          ? await ui.requestApproval({
              id: fileName.replace('.json', ''),
              threadId,
              toolName,
              inputPreview,
            })
          : await askApproval('Allow? (y/n) ');
        const response = allow
          ? { behavior: 'allow', updatedInput: payload.input ?? {} }
          : { behavior: 'deny', message: `Denied by user for ${toolName}` };
        await fs.writeFile(responsePath, JSON.stringify(response, null, 2), 'utf-8');
      }
    } finally {
      approvalQueueRunning = false;
    }
  };

  const checkAndResumeSuspendedParents = async () => {
    if (checking || ended) {
      pendingCheck = true;
      return;
    }
    checking = true;
    try {
      do {
        pendingCheck = false;

        const threads = (await core.listThreads()).filter((thread) => thread.objective === objective.objectiveId);
        let relationsSnapshot: Record<
          string,
          { children: string[]; references_to: string[]; referenced_by: string[] }
        > = {};
        try {
          const relationFilePath = path.join(core.workspaceRoot, core.relationsFilePath());
          const parsed = JSON.parse(await fs.readFile(relationFilePath, 'utf-8')) as {
            relations?: Record<string, { children?: string[]; references_to?: string[]; referenced_by?: string[] }>;
          };
          relationsSnapshot = Object.fromEntries(
            Object.entries(parsed.relations ?? {}).map(([key, value]) => [
              key,
              {
                children: value.children ?? [],
                references_to: value.references_to ?? [],
                referenced_by: value.referenced_by ?? [],
              },
            ]),
          );
        } catch {
          relationsSnapshot = {};
        }
        ui?.setThreadsSnapshot(
          threads.map((thread) => ({
            id: thread.id,
            status: thread.status,
            parentId: thread.parent_id,
            children: relationsSnapshot[thread.id]?.children ?? [],
            referencesTo: relationsSnapshot[thread.id]?.references_to ?? [],
            referencedBy: relationsSnapshot[thread.id]?.referenced_by ?? [],
          })),
        );
        const suspended = threads.filter((thread) => thread.status === 'suspended');

        for (const thread of suspended) {
          if (activeWorkers.has(thread.id)) {
            continue;
          }

          const children = threads.filter((child) => child.parent_id === thread.id);
          if (children.length === 0) {
            continue;
          }
          const allChildrenDone = children.every((child) => isTerminated(child.status));
          if (!allChildrenDone) {
            continue;
          }

          await core.lifecycle(thread.id, 'resume', 'Children completed');
          await startThreadWorker({
            threadId: thread.id,
            runtimeDir,
            source: 'resume',
          });
          activeWorkers.add(thread.id);
          if (shouldPrintEventLogs) {
            stderr.write(`[resume] thread ${thread.id} resumed\n`);
          }
          ui?.updateThread({
            id: thread.id,
            status: 'active',
            appendLine: 'resumed',
          });
        }

        const refreshedObjective = await core.getObjective(objective.objectiveId);
        if (refreshedObjective.status === 'completed') {
          stop();
          return;
        }
      } while (pendingCheck);
    } finally {
      checking = false;
    }
  };

  const relationFilePath = path.join(core.workspaceRoot, core.relationsFilePath());

  const relationsWatcher = watch(relationFilePath, () => {
    void checkAndResumeSuspendedParents();
  });
  closeWatchers.push(() => relationsWatcher.close());

  const approvalsWatcher = watch(runtimePaths.requestsDir, () => {
    void processApprovalRequests();
  });
  closeWatchers.push(() => approvalsWatcher.close());

  const eventsWatcher = watch(runtimePaths.eventsLogPath, () => {
    void processEvents();
  });
  closeWatchers.push(() => eventsWatcher.close());

  // 启动后先消费一次当前事件和审批，避免错过首批数据
  await processEvents();
  await processApprovalRequests();
  await checkAndResumeSuspendedParents();

  await new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  ui?.close();
  stderr.write(`[run] objective ${objective.objectiveId} completed\n`);
  return {
    success: true,
    data: {
      objective_id: objective.objectiveId,
      title: objective.title,
      status: 'completed',
      runtime_dir: runtimeDir,
      logs_dir: objective.logDir,
    },
  };
}
