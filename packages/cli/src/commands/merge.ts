import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { requiredString, splitComma } from '../utils.js';

export async function runMerge(core: LeslieCore, flags: Record<string, unknown>) {
  const sources = splitComma(flags.sources);
  if (sources.length === 0) {
    throw new Error('Missing required flag --sources');
  }
  const target = requiredString(flags.target, 'target');

  const output = await core.merge({
    sources,
    target,
    artifactScope: splitComma(flags.scope),
    conflictStrategy:
      flags.conflict_strategy === 'agent-first' ||
      flags.conflict_strategy === 'human' ||
      flags.conflict_strategy === 'strict' ||
      flags.conflict_strategy === 'interactive'
        ? flags.conflict_strategy
        : undefined,
  });

  return {
    success: true,
    data: output,
  };
}
