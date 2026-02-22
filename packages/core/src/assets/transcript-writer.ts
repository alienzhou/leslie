import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureDir } from '../utils/json.js';
import { toCompactTimestamp } from '../utils/time.js';

export interface TranscriptEntry {
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'error';
  name?: string;
  content: string;
}

export interface TranscriptPayload {
  threadId: string;
  chatId: string;
  startTime: string;
  endTime: string;
  agentMode: string;
  stopReason: string;
  entries: TranscriptEntry[];
}

function sanitizeQuery(query: string): string {
  const normalized = query
    .replaceAll(/[^0-9a-zA-Z\u4e00-\u9fff_-]+/gu, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
  if (!normalized) {
    return 'task';
  }
  return normalized.slice(0, 50);
}

function truncate(input: string, max: number): string {
  if (input.length <= max) {
    return input;
  }
  return `${input.slice(0, max - 3)}...`;
}

function formatEntry(entry: TranscriptEntry): string {
  if (entry.role === 'user') {
    return `user:\n<user_query>\n${entry.content}\n</user_query>\n`;
  }
  if (entry.role === 'assistant') {
    return `assistant:\n${entry.content}\n`;
  }
  if (entry.role === 'tool_call') {
    return `[Tool call] ${entry.name ?? 'unknown'}\n${truncate(entry.content, 200)}\n`;
  }
  if (entry.role === 'tool_result') {
    return `[Tool result] ${entry.name ?? 'unknown'}\n${truncate(entry.content, 200)}\n`;
  }
  return `[Error]\n${truncate(entry.content, 200)}\n`;
}

function timestampFilePrefix(startTime: string): string {
  const date = new Date(startTime);
  return toCompactTimestamp(date);
}

export class TranscriptWriter {
  public constructor(private readonly threadDirResolver: (threadId: string) => string) {}

  public async write(payload: TranscriptPayload): Promise<string> {
    const transcriptDir = path.join(this.threadDirResolver(payload.threadId), '.meta', 'transcripts');
    await ensureDir(transcriptDir);

    const firstUserMessage = payload.entries.find((entry) => entry.role === 'user')?.content ?? 'task';
    const fileName = `${timestampFilePrefix(payload.startTime)}-${sanitizeQuery(firstUserMessage)}.txt`;
    const filePath = path.join(transcriptDir, fileName);

    const toolCalls = payload.entries.filter((entry) => entry.role === 'tool_call').length;
    const body = payload.entries.map((entry) => formatEntry(entry)).join('\n');
    const header = [
      `Thread ID: ${payload.threadId}`,
      `Chat ID: ${payload.chatId}`,
      `Time Range: ${payload.startTime} ~ ${payload.endTime}`,
      `Agent Mode: ${payload.agentMode}`,
      `Stop Reason: ${payload.stopReason}`,
      `Tool Calls: ${toolCalls}`,
      '---',
      '',
    ].join('\n');
    const content = truncate(`${header}${body}`, 20 * 1024);
    await fs.writeFile(filePath, content, 'utf-8');

    await this.cleanupOldFiles(transcriptDir, 50);
    return filePath;
  }

  private async cleanupOldFiles(dirPath: string, maxFiles: number): Promise<void> {
    const names = await fs.readdir(dirPath);
    const sorted = names
      .filter((name) => name.endsWith('.txt'))
      .sort((a, b) => a.localeCompare(b, 'en'));
    if (sorted.length <= maxFiles) {
      return;
    }
    const removeCount = sorted.length - maxFiles;
    for (const fileName of sorted.slice(0, removeCount)) {
      await fs.rm(path.join(dirPath, fileName));
    }
  }
}

export const transcriptUtils = {
  sanitizeQuery,
  truncate,
};
