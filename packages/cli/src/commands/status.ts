import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { requiredString } from '../utils.js';

export async function runStatus(core: LeslieCore, flags: Record<string, unknown>) {
  const threadId = requiredString(flags.thread, 'thread');
  const thread = await core.getThread(threadId);
  const context = await core.buildThreadContext(threadId);
  return {
    success: true,
    data: {
      ...thread,
      thread_context: context.xml,
    },
    warnings: context.warnings,
  };
}
