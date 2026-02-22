import { LeslieError } from '../errors/cli-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';
import type { ObjectiveInfo } from '../types/objective.js';
import { generateId } from '../utils/id.js';
import { nowIso } from '../utils/time.js';
import { ObjectivesStore } from '../storage/objectives-store.js';
import { RelationsStore } from '../storage/relations-store.js';

const TERMINATED_THREAD_STATUS = new Set(['completed', 'cancelled', 'archived']);

export class ObjectiveManager {
  public constructor(
    private readonly objectivesStore: ObjectivesStore,
    private readonly relationsStore: RelationsStore,
  ) {}

  public async create(title: string): Promise<ObjectiveInfo> {
    const id = generateId('obj');
    const now = nowIso();
    let objective: ObjectiveInfo | undefined;

    await this.objectivesStore.mutate((data) => {
      objective = {
        id,
        title,
        created_at: now,
        updated_at: now,
        status: 'active',
        thread_ids: [],
      };
      data.objectives[id] = objective;
    });

    return objective as ObjectiveInfo;
  }

  public async get(id: string): Promise<ObjectiveInfo> {
    const file = await this.objectivesStore.read();
    const objective = file.objectives[id];
    if (!objective) {
      throw new LeslieError(ERROR_CODES.OBJECTIVE_NOT_FOUND, `Objective '${id}' not found`, {
        objectiveId: id,
      });
    }
    return objective;
  }

  public async list(): Promise<ObjectiveInfo[]> {
    const file = await this.objectivesStore.read();
    return Object.values(file.objectives).sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  public async addThread(objectiveId: string, threadId: string): Promise<void> {
    await this.objectivesStore.mutate((data) => {
      const objective = data.objectives[objectiveId];
      if (!objective) {
        throw new LeslieError(ERROR_CODES.OBJECTIVE_NOT_FOUND, `Objective '${objectiveId}' not found`, {
          objectiveId,
        });
      }
      if (!objective.thread_ids.includes(threadId)) {
        objective.thread_ids.push(threadId);
      }
      objective.updated_at = nowIso();
    });
    await this.refreshStatus(objectiveId);
  }

  public async refreshStatus(objectiveId: string): Promise<ObjectiveInfo> {
    const relations = await this.relationsStore.read();
    let updatedObjective: ObjectiveInfo | undefined;

    await this.objectivesStore.mutate((file) => {
      const objective = file.objectives[objectiveId];
      if (!objective) {
        throw new LeslieError(ERROR_CODES.OBJECTIVE_NOT_FOUND, `Objective '${objectiveId}' not found`, {
          objectiveId,
        });
      }

      const allTerminated =
        objective.thread_ids.length > 0 &&
        objective.thread_ids.every((threadId) => {
          const thread = relations.threads[threadId];
          return thread ? TERMINATED_THREAD_STATUS.has(thread.status) : true;
        });

      objective.status = allTerminated ? 'completed' : 'active';
      objective.updated_at = nowIso();
      updatedObjective = objective;
    });

    return updatedObjective as ObjectiveInfo;
  }
}
