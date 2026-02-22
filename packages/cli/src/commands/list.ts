import type { LeslieCore } from '@vibe-x-ai/leslie-core';

export async function runList(core: LeslieCore, flags: Record<string, unknown>) {
  const status = typeof flags.status === 'string' ? flags.status : undefined;
  const threads = await core.listThreads(status);
  return {
    success: true,
    data: threads.map((thread: Awaited<ReturnType<typeof core.listThreads>>[number]) => ({
      id: thread.id,
      title: thread.title,
      objective: thread.objective,
      status: thread.status,
      parent_id: thread.parent_id,
      executor: thread.executor,
      created_at: thread.created_at,
    })),
  };
}
