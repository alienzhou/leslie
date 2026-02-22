import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { requiredString } from '../utils.js';

export async function runLifecycle(core: LeslieCore, flags: Record<string, unknown>) {
  const threadId = requiredString(flags.thread, 'thread');
  const action = requiredString(flags.action, 'action') as
    | 'done'
    | 'archive'
    | 'cancel'
    | 'suspend'
    | 'resume';
  const reason = typeof flags.reason === 'string' ? flags.reason : undefined;

  const output = await core.lifecycle(threadId, action, reason);
  return {
    success: true,
    data: output,
  };
}
