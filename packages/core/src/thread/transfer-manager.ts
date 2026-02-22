import { LeslieError } from '../errors/cli-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';
import { RelationsStore } from '../storage/relations-store.js';
import { generateId } from '../utils/id.js';
import { nowIso } from '../utils/time.js';

export type TransferDirection = 'request_approval' | 'delegate' | 'handoff';

export interface TransferInput {
  threadId: string;
  direction: TransferDirection;
  scope: string[];
  reason?: string;
  targetExecutor?: 'human' | 'agent' | 'system';
  operator?: 'user' | 'system' | 'agent';
}

export interface TransferResult {
  threadId: string;
  status: string;
  executor: string;
}

export class TransferManager {
  public constructor(private readonly relationsStore: RelationsStore) {}

  public async transfer(input: TransferInput): Promise<TransferResult> {
    let result: TransferResult | undefined;
    await this.relationsStore.mutate((data) => {
      const thread = data.threads[input.threadId];
      if (!thread) {
        throw new LeslieError(ERROR_CODES.THREAD_NOT_FOUND, `Thread '${input.threadId}' not found`);
      }

      if (input.direction === 'request_approval') {
        thread.status = 'waiting_human';
      }

      if (input.direction === 'delegate' || input.direction === 'handoff') {
        if (input.targetExecutor) {
          thread.executor = input.targetExecutor;
        }
        if (thread.status === 'waiting_human') {
          thread.status = 'active';
        }
      }
      thread.updated_at = nowIso();

      data.operations.push({
        id: generateId('op'),
        timestamp: nowIso(),
        command: 'transfer',
        operator: input.operator ?? 'user',
        params: {
          thread_id: input.threadId,
          direction: input.direction,
          scope: input.scope,
          reason: input.reason ?? null,
          target_executor: input.targetExecutor ?? null,
        },
      });

      result = {
        threadId: input.threadId,
        status: thread.status,
        executor: thread.executor,
      };
    });

    return result as TransferResult;
  }
}
