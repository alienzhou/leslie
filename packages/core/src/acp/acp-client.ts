import { LeslieError } from '../errors/cli-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';
import type { AcpClient, AcpPromptResult, AcpSession } from './acp-types.js';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params: Record<string, unknown>;
}

interface JsonRpcResponse<T> {
  result?: T;
  error?: { code: number; message: string };
}

export class HttpAcpClient implements AcpClient {
  public constructor(
    private readonly baseUrl: string = process.env.ANTHROPIC_BASE_URL ?? '',
    private readonly token: string = process.env.ANTHROPIC_AUTH_TOKEN ?? '',
  ) {}

  public async newSession(input: { threadId: string; cwd: string }): Promise<AcpSession> {
    const result = await this.call<{ sessionId: string }>('session/new', {
      cwd: input.cwd,
      threadId: input.threadId,
    });
    return {
      sessionId: result.sessionId,
      cwd: input.cwd,
      threadId: input.threadId,
    };
  }

  public async loadSession(input: { sessionId: string; cwd: string }): Promise<AcpSession> {
    await this.call('session/load', {
      sessionId: input.sessionId,
      cwd: input.cwd,
    });
    return {
      sessionId: input.sessionId,
      cwd: input.cwd,
      threadId: 'unknown-thread',
    };
  }

  public async prompt(input: { sessionId: string; text: string }): Promise<AcpPromptResult> {
    const result = await this.call<{ stopReason?: string; text?: string }>('session/prompt', {
      sessionId: input.sessionId,
      prompt: {
        type: 'text',
        text: input.text,
      },
    });
    return {
      stopReason: result.stopReason ?? 'end_turn',
      entries: [
        { role: 'user', content: input.text },
        { role: 'assistant', content: result.text ?? '' },
      ],
    };
  }

  public async cancelSession(input: { sessionId: string }): Promise<void> {
    await this.call('session/cancel', {
      sessionId: input.sessionId,
    });
  }

  private async call<T = Record<string, unknown>>(
    method: string,
    params: Record<string, unknown>,
  ): Promise<T> {
    if (!this.baseUrl || !this.token) {
      throw new LeslieError(
        ERROR_CODES.INTERNAL_ERROR,
        'ACP is not configured. Please set ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN.',
      );
    }
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: `${Date.now()}`,
      method,
      params,
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new LeslieError(ERROR_CODES.INTERNAL_ERROR, `ACP request failed with ${response.status}`);
    }
    const body = (await response.json()) as JsonRpcResponse<T>;
    if (body.error) {
      throw new LeslieError(ERROR_CODES.INTERNAL_ERROR, `ACP error: ${body.error.message}`, {
        method,
      });
    }
    if (!body.result) {
      throw new LeslieError(ERROR_CODES.INTERNAL_ERROR, 'ACP returned empty result', { method });
    }
    return body.result;
  }
}
