import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { requiredString, splitComma } from '../utils.js';

export async function runReference(core: LeslieCore, flags: Record<string, unknown>) {
  const fromThreadId = requiredString(flags.from, 'from');
  const targetThreadId = requiredString(flags.target, 'target');
  const binding = flags.binding === 'live' ? 'live' : 'frozen';

  const output = await core.createReference({
    fromThreadId,
    targetThreadId,
    binding,
    scope: splitComma(flags.scope),
  });

  return {
    success: true,
    data: {
      ref_id: output.refId,
      snapshot_version: output.snapshotVersion,
      copied_paths: output.copiedPaths ?? [],
      binding,
    },
    warnings: output.warnings,
  };
}
