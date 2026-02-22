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
});
