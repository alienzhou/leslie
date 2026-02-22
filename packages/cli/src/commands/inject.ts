import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { requiredString } from '../utils.js';

export async function runInject(core: LeslieCore, flags: Record<string, unknown>) {
  const threadId = requiredString(flags.thread, 'thread');
  const type = requiredString(flags.type, 'type');
  const content = requiredString(flags.content, 'content');
  const output = await core.inject(threadId, type, content);
  return {
    success: true,
    data: output,
  };
}
