import fs from 'node:fs/promises';
import path from 'node:path';
import { LeslieError } from '../errors/cli-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';
import { WARNING_CODES } from '../errors/error-codes.js';
import { warning } from '../errors/warning.js';
import type { Warning } from '../types/cli-response.js';
import type { SpawnInput, SpawnResult, ThreadInfo, ThreadStatus } from '../types/thread.js';
import { AssetManager } from '../assets/asset-manager.js';
import { ObjectiveManager } from '../objective/objective-manager.js';
import { RelationsStore } from '../storage/relations-store.js';
import { generateId } from '../utils/id.js';
import { nowIso } from '../utils/time.js';
import { nextThreadStatus } from './state-machine.js';
import { ReferenceManager } from './reference-manager.js';

export interface LifecycleResult {
  threadId: string;
  status: string;
}

export interface InjectResult {
  threadId: string;
  injectedAt: string;
}

export class ThreadManager {
  public constructor(
    private readonly relationsStore: RelationsStore,
    private readonly objectiveManager: ObjectiveManager,
    private readonly assetManager: AssetManager,
    private readonly referenceManager: ReferenceManager,
  ) {}

  public async spawn(
    input: SpawnInput,
    operator: 'user' | 'system' | 'agent' = 'user',
  ): Promise<{ result: SpawnResult; warnings: Warning[] }> {
    await this.assetManager.ensureBaseDirs();
    await this.objectiveManager.get(input.objective);

    const threadId = generateId('thread');
    const now = nowIso();
    const parentId = input.parentId ?? null;
    const warnings: Warning[] = [];

    const storagePath = path.posix.join('.leslie', 'threads', threadId);
    const threadInfo: ThreadInfo = {
      id: threadId,
      title: input.intent,
      objective: input.objective,
      created_at: now,
      status: 'active',
      tags: input.tags,
      parent_id: parentId,
      storage_path: storagePath,
      executor: input.executor ?? 'agent',
      updated_at: now,
    };

    await this.relationsStore.mutate((data) => {
      if (parentId && !data.threads[parentId]) {
        throw new LeslieError(ERROR_CODES.THREAD_NOT_FOUND, `Thread '${parentId}' not found`, {
          threadId: parentId,
        });
      }
      data.threads[threadId] = threadInfo;
      data.relations[threadId] = {
        children: [],
        references_to: [],
        referenced_by: [],
        depends_on: parentId ? [parentId] : [],
      };
      if (parentId) {
        const parentRelation = data.relations[parentId];
        if (!parentRelation) {
          throw new LeslieError(ERROR_CODES.INTERNAL_ERROR, 'Thread relation cache is inconsistent', {
            parentId,
          });
        }
        parentRelation.children.push(threadId);
      }
      data.operations.push({
        id: generateId('op'),
        timestamp: now,
        command: 'spawn',
        operator,
        params: {
          thread_id: threadId,
          parent_id: parentId,
          intent: input.intent,
          objective: input.objective,
          inherit: input.inherit,
          inherit_scope: input.inheritScope ?? [],
        },
      });
    });

    await this.assetManager.initThreadDir(threadId);
    if (parentId) {
      await this.assetManager.applyInheritance(parentId, threadId, input.inherit, input.inheritScope);
    }
    await this.objectiveManager.addThread(input.objective, threadId);

    if (input.refs?.length) {
      for (const refTarget of input.refs) {
        const refResult = await this.referenceManager.createReference({
          fromThreadId: threadId,
          targetThreadId: refTarget,
          binding: 'frozen',
          operator,
        });
        warnings.push(...refResult.warnings);
      }
    }

    return {
      result: {
        thread_id: threadId,
        parent_id: parentId,
        status: 'active',
        objective: input.objective,
      },
      warnings,
    };
  }

  public async getThread(threadId: string): Promise<ThreadInfo> {
    const data = await this.relationsStore.read();
    const thread = data.threads[threadId];
    if (!thread) {
      throw new LeslieError(ERROR_CODES.THREAD_NOT_FOUND, `Thread '${threadId}' not found`, { threadId });
    }
    return thread;
  }

  public async listThreads(status?: string): Promise<ThreadInfo[]> {
    const data = await this.relationsStore.read();
    const values = Object.values(data.threads);
    if (!status) {
      return values.sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
    return values
      .filter((thread) => thread.status === status)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  public async lifecycle(
    threadId: string,
    action: 'done' | 'archive' | 'cancel' | 'suspend' | 'resume',
    reason?: string,
    operator: 'user' | 'system' | 'agent' = 'user',
  ): Promise<LifecycleResult> {
    let nextStatus: ThreadStatus = 'active';
    await this.relationsStore.mutate((data) => {
      const thread = data.threads[threadId];
      if (!thread) {
        throw new LeslieError(ERROR_CODES.THREAD_NOT_FOUND, `Thread '${threadId}' not found`, {
          threadId,
        });
      }
      nextStatus = nextThreadStatus(thread.status, action);
      thread.status = nextStatus;
      thread.updated_at = nowIso();
      data.operations.push({
        id: generateId('op'),
        timestamp: nowIso(),
        command: 'lifecycle',
        operator,
        params: {
          thread_id: threadId,
          action,
          reason: reason ?? null,
        },
      });
    });

    const thread = await this.getThread(threadId);
    await this.objectiveManager.refreshStatus(thread.objective);

    return {
      threadId,
      status: nextStatus,
    };
  }

  public async inject(
    threadId: string,
    type: string,
    content: string,
    operator: 'user' | 'system' | 'agent' = 'user',
  ): Promise<InjectResult> {
    const injectedAt = nowIso();
    await this.relationsStore.mutate((data) => {
      const thread = data.threads[threadId];
      if (!thread) {
        throw new LeslieError(ERROR_CODES.THREAD_NOT_FOUND, `Thread '${threadId}' not found`, {
          threadId,
        });
      }
      data.operations.push({
        id: generateId('op'),
        timestamp: injectedAt,
        command: 'inject',
        operator,
        params: {
          thread_id: threadId,
          type,
          content,
        },
      });
    });

    const injectLogPath = path.join(this.assetManager.threadDir(threadId), '.meta', 'injections.log');
    await fs.mkdir(path.dirname(injectLogPath), { recursive: true });
    await fs.appendFile(injectLogPath, `${injectedAt} type=${type} content=${content}\n`, 'utf-8');

    return {
      threadId,
      injectedAt,
    };
  }

  public async listArtifacts(
    threadId: string,
  ): Promise<{ warnings: Warning[]; assets: Awaited<ReturnType<AssetManager['listAssets']>> }> {
    const data = await this.relationsStore.read();
    if (!data.threads[threadId]) {
      throw new LeslieError(ERROR_CODES.THREAD_NOT_FOUND, `Thread '${threadId}' not found`);
    }
    const warnings: Warning[] = [];
    const refs = data.relations[threadId]?.references_to ?? [];
    for (const refId of refs) {
      if (!data.threads[refId]) {
        warnings.push(
          warning(WARNING_CODES.REFERENCE_TARGET_UNAVAILABLE, `Reference target '${refId}' not found`, {
            target: refId,
          }),
        );
      }
    }
    const assets = await this.assetManager.listAssets(threadId);
    return { warnings, assets };
  }
}
