import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { requiredString } from '../../utils.js';

export async function runObjectiveCreate(core: LeslieCore, flags: Record<string, unknown>) {
  const title = requiredString(flags.title, 'title');
  const result = await core.createObjective(title);
  return {
    success: true,
    data: result,
  };
}
