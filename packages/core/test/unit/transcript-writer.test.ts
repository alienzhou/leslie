import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { TranscriptWriter, transcriptUtils } from '../../src/assets/transcript-writer.js';

describe('transcript-writer', () => {
  it('sanitizes query and truncates tool content', () => {
    const sanitized = transcriptUtils.sanitizeQuery(
      "fix bug: TypeError: Cannot read property 'name' of undefined!!!",
    );
    expect(sanitized).toBe('fix-bug-TypeError-Cannot-read-property-name-of-und');
    expect(transcriptUtils.truncate('123456', 4)).toBe('1...');
  });

  it('writes transcript and keeps latest 50 files', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'leslie-transcript-'));
    const writer = new TranscriptWriter((threadId) => path.join(root, threadId));
    const threadId = 'thread-1';

    for (let i = 0; i < 55; i += 1) {
      await writer.write({
        threadId,
        chatId: `chat-${i}`,
        startTime: new Date(Date.UTC(2026, 1, 22, 15, i % 60)).toISOString(),
        endTime: new Date(Date.UTC(2026, 1, 22, 15, (i + 1) % 60)).toISOString(),
        agentMode: 'agent',
        stopReason: 'end_turn',
        entries: [
          { role: 'user', content: `task-${i}` },
          { role: 'tool_call', name: 'tool', content: 'x'.repeat(400) },
          { role: 'tool_result', name: 'tool', content: 'y'.repeat(400) },
          { role: 'assistant', content: 'done' },
        ],
      });
    }

    const transcriptDir = path.join(root, threadId, '.meta', 'transcripts');
    const files = (await fs.readdir(transcriptDir)).filter((name) => name.endsWith('.txt'));
    expect(files.length).toBe(50);
  });
});
