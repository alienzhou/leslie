import type { LeslieCore } from '@vibe-x-ai/leslie-core';
import { requiredString } from '../utils.js';

export async function runTranscript(core: LeslieCore, flags: Record<string, unknown>) {
  const threadId = requiredString(flags.thread, 'thread');
  const chatId = requiredString(flags.chat, 'chat');
  const userQuery = requiredString(flags.query, 'query');
  const assistantMessage = requiredString(flags.assistant, 'assistant');
  const now = new Date().toISOString();
  const filePath = await core.writeTranscript({
    threadId,
    chatId,
    startTime: typeof flags.start === 'string' ? flags.start : now,
    endTime: typeof flags.end === 'string' ? flags.end : now,
    agentMode: typeof flags.mode === 'string' ? flags.mode : 'agent',
    stopReason: typeof flags.stop_reason === 'string' ? flags.stop_reason : 'end_turn',
    entries: [
      { role: 'user', content: userQuery },
      { role: 'assistant', content: assistantMessage },
    ],
  });

  return {
    success: true,
    data: {
      transcript_path: filePath,
    },
  };
}
