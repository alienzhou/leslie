import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

interface ParsedOutput {
  success: boolean;
  data?: Record<string, unknown>;
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
  if (!parsed?.data) {
    throw new Error(`Missing data in CLI response for key ${key}`);
  }
  return parsed.data[key];
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
    const a = runCli(workspace, ['spawn', '--intent', 'A', '--objective', objectiveId]);
    const b = runCli(workspace, ['spawn', '--intent', 'B', '--objective', objectiveId]);
    const aId = dataValue(a.parsed, 'thread_id') as string;
    const bId = dataValue(b.parsed, 'thread_id') as string;
    runCli(workspace, ['reference', '--from', aId, '--target', bId]);
    const circular = runCli(workspace, ['reference', '--from', bId, '--target', aId]);
    expect(circular.code).toBe(1);
    expect(circular.parsed?.error?.code).toBe('T201');
  });
});
