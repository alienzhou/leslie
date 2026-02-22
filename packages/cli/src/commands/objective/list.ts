import type { LeslieCore } from '@vibe-x-ai/leslie-core';

export async function runObjectiveList(core: LeslieCore) {
  const objectives = await core.listObjectives();
  return {
    success: true,
    data: objectives,
  };
}
