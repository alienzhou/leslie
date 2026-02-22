import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { splitComma, requiredString } from '../utils.js';

export async function runSpawn(core: LeslieCore, flags: Record<string, unknown>) {
  const intent = requiredString(flags.intent, 'intent');
  const objective = requiredString(flags.objective, 'objective');
  const inherit = (flags.inherit as 'full' | 'partial' | 'none' | undefined) ?? 'none';

  const output = await core.spawnThread({
    intent,
    objective,
    parentId: typeof flags.parent === 'string' ? flags.parent : undefined,
    inherit,
    inheritScope: splitComma(flags.scope),
    refs: splitComma(flags.ref),
    executor:
      flags.executor === 'human' || flags.executor === 'agent' || flags.executor === 'system'
        ? flags.executor
        : undefined,
    tags: splitComma(flags.tags),
  });

  return {
    success: true,
    data: output.result,
    warnings: output.warnings,
  };
}
