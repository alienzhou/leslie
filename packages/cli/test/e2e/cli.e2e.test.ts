import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

interface ParsedOutput {
  success: boolean;
  data?: unknown;
  error?: { code: string; message: string };
}

function runCli(cwd: string, args: string[]) {
  const cliEntry = path.resolve(__dirname, '../../bin/run.js');
  const result = spawnSync('node', [cliEntry, ...args, '--format', 'json'], {
    cwd,
    encoding: 'utf-8',
  });
  const stdout = result.stdout.trim();
  const stderr = result.stderr.trim();
  let parsed: ParsedOutput | null = null;
  if (stdout) {
    parsed = JSON.parse(stdout) as ParsedOutput;
  }
  return {
    code: result.status ?? 1,
    stdout,
    stderr,
    parsed,
  };
}

function dataValue(parsed: ParsedOutput | null, key: string): unknown {
  if (!parsed?.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
    throw new Error(`Missing data in CLI response for key ${key}`);
  }
  return (parsed.data as Record<string, unknown>)[key];
}

describe('cli e2e', () => {
  it('runs init -> objective -> spawn -> status -> lifecycle flow', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'leslie-cli-e2e-'));
    const init = runCli(workspace, ['init', '--yes']);
    expect(init.code).toBe(0);
    const agentsPath = path.join(workspace, 'AGENTS.md');
    const agentsContent = await fs.readFile(agentsPath, 'utf-8');
    expect(agentsContent).toContain('<leslie_system_guide');

    const createObjective = runCli(workspace, ['objective', 'create', '--title', 'Build API']);
    expect(createObjective.code).toBe(0);
    const objectiveId = dataValue(createObjective.parsed, 'objectiveId') as string;

    const spawn = runCli(workspace, [
      'spawn',
      '--intent',
      'Design API',
      '--objective',
      objectiveId,
      '--no-run',
    ]);
    expect(spawn.code).toBe(0);
    const threadId = dataValue(spawn.parsed, 'thread_id') as string;

    const status = runCli(workspace, ['status', '--thread', threadId]);
    expect(status.code).toBe(0);
    expect(dataValue(status.parsed, 'thread_context')).toContain('<thread_context');

    const lifecycle = runCli(workspace, ['lifecycle', '--thread', threadId, '--action', 'done']);
    expect(lifecycle.code).toBe(0);

    const transcript = runCli(workspace, [
      'transcript',
      '--thread',
      threadId,
      '--chat',
      'chat-1',
      '--query',
      'Implement API',
      '--assistant',
      'Done',
    ]);
    expect(transcript.code).toBe(0);
    const transcriptPath = dataValue(transcript.parsed, 'transcript_path') as string;
    const transcriptExists = await fs
      .access(transcriptPath)
      .then(() => true)
      .catch(() => false);
    expect(transcriptExists).toBe(true);

    const objectiveStatus = runCli(workspace, ['objective', 'status', '--id', objectiveId]);
    expect(objectiveStatus.code).toBe(0);
    expect(dataValue(objectiveStatus.parsed, 'status')).toBe('completed');
  });

  it('shows error on circular reference', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'leslie-cli-e2e-'));
    runCli(workspace, ['init', '--yes']);
    const objective = runCli(workspace, ['objective', 'create', '--title', 'Obj']);
    const objectiveId = dataValue(objective.parsed, 'objectiveId') as string;
    const a = runCli(workspace, ['spawn', '--intent', 'A', '--objective', objectiveId, '--no-run']);
    const b = runCli(workspace, ['spawn', '--intent', 'B', '--objective', objectiveId, '--no-run']);
    const aId = dataValue(a.parsed, 'thread_id') as string;
    const bId = dataValue(b.parsed, 'thread_id') as string;
    runCli(workspace, ['reference', '--from', aId, '--target', bId]);
    const circular = runCli(workspace, ['reference', '--from', bId, '--target', aId]);
    expect(circular.code).toBe(1);
    expect(circular.parsed?.error?.code).toBe('T201');
  });

  it('keeps thread graph consistent after rapid child spawns', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'leslie-cli-e2e-'));
    const init = runCli(workspace, ['init', '--yes']);
    expect(init.code).toBe(0);

    const objective = runCli(workspace, ['objective', 'create', '--title', 'Graph consistency']);
    expect(objective.code).toBe(0);
    const objectiveId = dataValue(objective.parsed, 'objectiveId') as string;

    const root = runCli(workspace, [
      'spawn',
      '--intent',
      'Root planner',
      '--objective',
      objectiveId,
      '--no-run',
    ]);
    expect(root.code).toBe(0);
    const rootId = dataValue(root.parsed, 'thread_id') as string;

    const childIntents = ['Child A', 'Child B', 'Child C', 'Child D'];
    const childIds: string[] = [];

    for (const intent of childIntents) {
      const spawned = runCli(workspace, [
        'spawn',
        '--intent',
        intent,
        '--objective',
        objectiveId,
        '--parent',
        rootId,
        '--no-run',
      ]);
      expect(spawned.code).toBe(0);
      const childId = dataValue(spawned.parsed, 'thread_id') as string;
      childIds.push(childId);

      const ref = runCli(workspace, ['reference', '--from', childId, '--target', rootId]);
      expect(ref.code).toBe(0);
    }

    const listed = runCli(workspace, ['list']);
    expect(listed.code).toBe(0);
    expect(Array.isArray(listed.parsed?.data)).toBe(true);

    const objectiveThreads = (listed.parsed?.data as Array<Record<string, unknown>>).filter(
      (thread) => thread.objective === objectiveId,
    );
    expect(objectiveThreads).toHaveLength(5);

    const relationsPath = path.join(workspace, '.leslie', 'thread_relations.json');
    const relationsRaw = await fs.readFile(relationsPath, 'utf-8');
    const relations = JSON.parse(relationsRaw) as {
      metadata: { thread_count: number };
      threads: Record<string, { parent_id: string | null; objective: string }>;
      relations: Record<string, { children: string[]; references_to: string[] }>;
    };

    expect(relations.metadata.thread_count).toBe(5);
    expect(relations.relations[rootId]?.children.slice().sort()).toEqual(childIds.slice().sort());

    for (const childId of childIds) {
      expect(relations.threads[childId]?.parent_id).toBe(rootId);
      expect(relations.threads[childId]?.objective).toBe(objectiveId);
      expect(relations.relations[childId]?.references_to).toContain(rootId);
    }
  });
});
