import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { requiredString, splitComma } from '../utils.js';

export async function runTransfer(core: LeslieCore, flags: Record<string, unknown>) {
  const threadId = requiredString(flags.thread, 'thread');
  const direction = requiredString(flags.direction, 'direction') as
    | 'request_approval'
    | 'delegate'
    | 'handoff';
  const scope = splitComma(flags.scope);
  if (scope.length === 0) {
    throw new Error('Missing required flag --scope');
  }
  const targetExecutor =
    flags.target === 'human' || flags.target === 'agent' || flags.target === 'system'
      ? flags.target
      : undefined;

  const output = await core.transfer({
    threadId,
    direction,
    scope,
    reason: typeof flags.reason === 'string' ? flags.reason : undefined,
    targetExecutor,
  });
  return {
    success: true,
    data: output,
  };
}
