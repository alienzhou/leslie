import { generateId } from '../utils/id.js';
import type { AcpClient, AcpPromptResult, AcpSession } from './acp-types.js';

export class MockAcpClient implements AcpClient {
  private readonly sessions = new Map<string, AcpSession>();

  private readonly cancelled = new Set<string>();

  public async newSession(input: { threadId: string; cwd: string }): Promise<AcpSession> {
    const session: AcpSession = {
      sessionId: generateId('sess'),
      cwd: input.cwd,
      threadId: input.threadId,
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  public async loadSession(input: { sessionId: string; cwd: string }): Promise<AcpSession> {
    const existing = this.sessions.get(input.sessionId);
    if (!existing) {
      const rebuilt: AcpSession = {
        sessionId: input.sessionId,
        cwd: input.cwd,
        threadId: 'unknown-thread',
      };
      this.sessions.set(input.sessionId, rebuilt);
      return rebuilt;
    }
    return existing;
  }

  public async prompt(input: { sessionId: string; text: string }): Promise<AcpPromptResult> {
    if (this.cancelled.has(input.sessionId)) {
      return {
        stopReason: 'cancelled',
        entries: [
          {
            role: 'error',
            content: 'Session cancelled',
          },
        ],
      };
    }
    return {
      stopReason: 'end_turn',
      entries: [
        {
          role: 'user',
          content: input.text,
        },
        {
          role: 'assistant',
          content: 'Mock ACP response',
        },
      ],
    };
  }

  public async cancelSession(input: { sessionId: string }): Promise<void> {
    this.cancelled.add(input.sessionId);
  }
}
