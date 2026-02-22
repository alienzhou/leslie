import type { TranscriptEntry } from '../assets/transcript-writer.js';

export interface AcpSession {
  sessionId: string;
  cwd: string;
  threadId: string;
}

export interface AcpPromptResult {
  stopReason: string;
  entries: TranscriptEntry[];
}

export interface AcpClient {
  newSession(input: { threadId: string; cwd: string }): Promise<AcpSession>;
  loadSession(input: { sessionId: string; cwd: string }): Promise<AcpSession>;
  prompt(input: { sessionId: string; text: string }): Promise<AcpPromptResult>;
  cancelSession(input: { sessionId: string }): Promise<void>;
}
