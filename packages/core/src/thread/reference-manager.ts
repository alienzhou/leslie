import { LeslieError } from '../errors/cli-error.js';
import { ERROR_CODES, WARNING_CODES } from '../errors/error-codes.js';
import { warning } from '../errors/warning.js';
import { RelationsStore } from '../storage/relations-store.js';
import type { Warning } from '../types/cli-response.js';
import type { ReferenceBinding } from '../types/thread.js';
import { generateId } from '../utils/id.js';
import { nowIso } from '../utils/time.js';
import { AssetManager } from '../assets/asset-manager.js';

export interface CreateReferenceInput {
  fromThreadId: string;
  targetThreadId: string;
  scope?: string[];
  binding?: ReferenceBinding;
  operator?: 'user' | 'system' | 'agent';
}

export interface CreateReferenceResult {
  refId: string;
  snapshotVersion?: string;
  copiedPaths?: string[];
  warnings: Warning[];
}

function hasReferencePath(
  relations: Record<string, { references_to: string[] }>,
  from: string,
  target: string,
  visited: Set<string> = new Set(),
): boolean {
  if (from === target) {
    return true;
  }
  if (visited.has(from)) {
    return false;
  }
  visited.add(from);
  const next = relations[from]?.references_to ?? [];
  return next.some((node) => hasReferencePath(relations, node, target, visited));
}

export class ReferenceManager {
  public constructor(
    private readonly relationsStore: RelationsStore,
    private readonly assetManager: AssetManager,
  ) {}

  public async createReference(input: CreateReferenceInput): Promise<CreateReferenceResult> {
    const refId = generateId('ref');
    const binding = input.binding ?? 'frozen';
    const warnings: Warning[] = [];
    const now = nowIso();
    const operator = input.operator ?? 'user';

    let copiedPaths: string[] = [];
    let snapshotVersion: string | undefined;

    await this.relationsStore.mutate((data) => {
      const from = data.threads[input.fromThreadId];
      if (!from) {
        throw new LeslieError(
          ERROR_CODES.THREAD_NOT_FOUND,
          `Thread '${input.fromThreadId}' not found`,
          { threadId: input.fromThreadId },
        );
      }

      const target = data.threads[input.targetThreadId];
      if (!target) {
        warnings.push(
          warning(
            WARNING_CODES.REFERENCE_TARGET_UNAVAILABLE,
            `Reference target '${input.targetThreadId}' not found`,
            {
              target: input.targetThreadId,
            },
          ),
        );
      } else {
        if (hasReferencePath(data.relations, input.targetThreadId, input.fromThreadId)) {
          throw new LeslieError(
            ERROR_CODES.CIRCULAR_REFERENCE,
            `Circular reference detected (${input.fromThreadId} -> ${input.targetThreadId} -> ${input.fromThreadId})`,
            {
              from: input.fromThreadId,
              target: input.targetThreadId,
            },
          );
        }

        const fromRelation = data.relations[input.fromThreadId];
        const targetRelation = data.relations[input.targetThreadId];
        if (!fromRelation || !targetRelation) {
          throw new LeslieError(
            ERROR_CODES.INTERNAL_ERROR,
            'Thread relation cache is inconsistent',
            {
              from: input.fromThreadId,
              target: input.targetThreadId,
            },
          );
        }

        if (!fromRelation.references_to.includes(input.targetThreadId)) {
          fromRelation.references_to.push(input.targetThreadId);
        }
        if (!targetRelation.referenced_by.includes(input.fromThreadId)) {
          targetRelation.referenced_by.push(input.fromThreadId);
        }
      }

      data.operations.push({
        id: generateId('op'),
        timestamp: now,
        command: 'reference',
        operator,
        params: {
          ref_id: refId,
          from_id: input.fromThreadId,
          to_id: input.targetThreadId,
          scope: input.scope ?? ['all'],
          binding,
        },
      });
    });

    const relations = await this.relationsStore.read();
    if (relations.threads[input.targetThreadId] && binding === 'frozen') {
      copiedPaths = await this.assetManager.copyFrozenReference(
        input.targetThreadId,
        input.fromThreadId,
        input.scope,
      );
      snapshotVersion = now;
    }

    return {
      refId,
      snapshotVersion,
      copiedPaths: copiedPaths.length > 0 ? copiedPaths : undefined,
      warnings,
    };
  }
}
