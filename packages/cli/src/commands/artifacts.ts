import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { requiredString } from '../utils.js';

export async function runArtifacts(core: LeslieCore, flags: Record<string, unknown>) {
  const threadId = requiredString(flags.thread, 'thread');
  const output = await core.listArtifacts(threadId);
  return {
    success: true,
    data: output.assets,
    warnings: output.warnings,
  };
}
