import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { fileURLToPath } from 'node:url';

async function readTemplateContent(): Promise<string> {
  const current = fileURLToPath(import.meta.url);
  const candidates = [
    path.resolve(path.dirname(current), '..', 'templates', 'leslie-system-guide.md'),
    path.resolve(path.dirname(current), '..', '..', '..', 'src', 'templates', 'leslie-system-guide.md'),
  ];

  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate, 'utf-8');
    } catch {
      continue;
    }
  }

  throw new Error('Template file not found: leslie-system-guide.md');
}

function templateVersion(content: string): string {
  const match = content.match(/version="([^"]+)"/u);
  const version = match?.[1];
  if (!version) {
    throw new Error('Invalid template: missing version attribute');
  }
  return version;
}

async function askMajorUpdate(fromVersion: string, toVersion: string): Promise<boolean> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(
      `Major guide update detected (${fromVersion} -> ${toVersion}). Continue? [y/N] `,
    );
    return ['y', 'yes'].includes(answer.trim().toLowerCase());
  } finally {
    rl.close();
  }
}

export async function runInit(core: LeslieCore, flags: Record<string, unknown>) {
  await core.initProject();
  const content = await readTemplateContent();
  const version = templateVersion(content);

  const result = await core.upsertAgentsGuide(
    path.join(process.cwd(), 'AGENTS.md'),
    content,
    version,
    flags.yes ? async () => true : askMajorUpdate,
  );

  return {
    success: true,
    data: {
      status: result.status,
      previous_version: result.previousVersion ?? null,
      next_version: result.nextVersion,
    },
  };
}
