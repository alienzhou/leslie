import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { requiredString } from '../../utils.js';

export async function runObjectiveStatus(core: LeslieCore, flags: Record<string, unknown>) {
  const objectiveId = requiredString(flags.id, 'id');
  const objective = await core.getObjective(objectiveId);
  return {
    success: true,
    data: objective,
  };
}
