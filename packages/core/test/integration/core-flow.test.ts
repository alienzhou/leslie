import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { LeslieCore, LeslieError } from '../../src/index.js';

describe('core integration flow', () => {
  async function createCore() {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'leslie-core-it-'));
    const core = new LeslieCore({ workspaceRoot });
    await core.initProject();
    return { core, workspaceRoot };
  }

  it('runs objective + thread + lifecycle flow', async () => {
    const { core } = await createCore();
    const objective = await core.createObjective('Build API');
    const parent = await core.spawnThread({
      intent: 'Design API',
      objective: objective.objectiveId,
      inherit: 'none',
      executor: 'agent',
    });
    const child = await core.spawnThread({
      intent: 'Write tests',
      objective: objective.objectiveId,
      parentId: parent.result.thread_id,
      inherit: 'none',
      executor: 'agent',
    });

    expect(parent.result.thread_id).toBeDefined();
    expect(child.result.parent_id).toBe(parent.result.thread_id);

    await core.lifecycle(parent.result.thread_id, 'done', 'finished');
    await core.lifecycle(child.result.thread_id, 'done', 'finished');

    const status = await core.getObjective(objective.objectiveId);
    expect(status.status).toBe('completed');
  });

  it('returns warning for missing reference target', async () => {
    const { core } = await createCore();
    const objective = await core.createObjective('Build API');
    const thread = await core.spawnThread({
      intent: 'Design API',
      objective: objective.objectiveId,
      inherit: 'none',
    });
    const result = await core.createReference({
      fromThreadId: thread.result.thread_id,
      targetThreadId: 'thread-missing',
    });
    expect(result.warnings.length).toBe(1);
  });

  it('detects circular references', async () => {
    const { core } = await createCore();
    const objective = await core.createObjective('Build API');
    const a = await core.spawnThread({
      intent: 'A',
      objective: objective.objectiveId,
      inherit: 'none',
    });
    const b = await core.spawnThread({
      intent: 'B',
      objective: objective.objectiveId,
      inherit: 'none',
    });

    await core.createReference({
      fromThreadId: a.result.thread_id,
      targetThreadId: b.result.thread_id,
    });
    await expect(
      core.createReference({
        fromThreadId: b.result.thread_id,
        targetThreadId: a.result.thread_id,
      }),
    ).rejects.toBeInstanceOf(LeslieError);
  });

  it('does not auto-complete suspended thread after successful agent run', async () => {
    const { core } = await createCore();
    const objective = await core.createObjective('Build API');
    const spawned = await core.spawnThread({
      intent: 'Parent task',
      objective: objective.objectiveId,
      inherit: 'none',
    });
    const threadId = spawned.result.thread_id;

    const runnerMock = vi.fn(async () => {
      await core.lifecycle(threadId, 'suspend', 'Waiting children');
      return {
        sessionId: 'session-test',
        success: true,
        result: 'ok',
        errors: undefined,
        durationMs: 10,
        costUsd: 0,
        numTurns: 1,
      };
    });

    (
      core as unknown as {
        agentRunner: { run: typeof runnerMock };
      }
    ).agentRunner.run = runnerMock;

    await core.runAgent(threadId, {});

    const thread = await core.getThread(threadId);
    expect(thread.status).toBe('suspended');
    expect(thread.session_id).toBe('session-test');
  });

  it('auto-suspends active parent when successful run leaves children active', async () => {
    const { core } = await createCore();
    const objective = await core.createObjective('Build API');
    const parent = await core.spawnThread({
      intent: 'Parent task',
      objective: objective.objectiveId,
      inherit: 'none',
    });
    await core.spawnThread({
      intent: 'Child task',
      objective: objective.objectiveId,
      parentId: parent.result.thread_id,
      inherit: 'none',
    });

    const runnerMock = vi.fn(async () => ({
      sessionId: 'session-parent',
      success: true,
      result: 'ok',
      errors: undefined,
      durationMs: 12,
      costUsd: 0,
      numTurns: 1,
    }));

    (
      core as unknown as {
        agentRunner: { run: typeof runnerMock };
      }
    ).agentRunner.run = runnerMock;

    await core.runAgent(parent.result.thread_id, {});

    const parentThread = await core.getThread(parent.result.thread_id);
    expect(parentThread.status).toBe('suspended');
    const objectiveStatus = await core.getObjective(objective.objectiveId);
    expect(objectiveStatus.status).toBe('active');
  });

  it('keeps objective active when out-of-band child thread is still active', async () => {
    const { core, workspaceRoot } = await createCore();
    const objective = await core.createObjective('Build API');
    const parent = await core.spawnThread({
      intent: 'Parent task',
      objective: objective.objectiveId,
      inherit: 'none',
    });

    const relationsPath = path.join(workspaceRoot, '.leslie', 'thread_relations.json');
    const relationsRaw = await fs.readFile(relationsPath, 'utf-8');
    const relationsData = JSON.parse(relationsRaw) as {
      threads: Record<string, Record<string, unknown>>;
      relations: Record<string, { children: string[]; references_to: string[]; referenced_by: string[]; depends_on: string[] }>;
      metadata: { thread_count?: number };
    };

    const childId = `${parent.result.thread_id}-manual-child`;
    const now = new Date().toISOString();
    relationsData.threads[childId] = {
      id: childId,
      title: 'Manual child',
      objective: objective.objectiveId,
      created_at: now,
      status: 'active',
      parent_id: parent.result.thread_id,
      storage_path: `.leslie/threads/${childId}`,
      executor: 'agent',
      updated_at: now,
    };
    relationsData.relations[childId] = {
      children: [],
      references_to: [],
      referenced_by: [],
      depends_on: [parent.result.thread_id],
    };
    relationsData.relations[parent.result.thread_id]?.children.push(childId);
    relationsData.metadata.thread_count = Object.keys(relationsData.threads).length;
    await fs.writeFile(relationsPath, `${JSON.stringify(relationsData, null, 2)}\n`, 'utf-8');

    await core.lifecycle(parent.result.thread_id, 'done', 'parent done');
    const statusWhileChildActive = await core.getObjective(objective.objectiveId);
    expect(statusWhileChildActive.status).toBe('active');

    await core.lifecycle(childId, 'done', 'child done');
    const statusAfterChildDone = await core.getObjective(objective.objectiveId);
    expect(statusAfterChildDone.status).toBe('completed');
  });
});
