import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import type { AgentRunOptions, AgentRunResult, AgentMessage } from './types.js';

/**
 * 封装 Claude Agent SDK query()，管理 Agent 进程生命周期。
 *
 * 职责：
 * - 调用 SDK query() 启动 Claude Code 子进程
 * - 解析 SDKMessage 流，转为 AgentMessage 输出
 * - 提取 session_id 用于后续 resume
 * - 透传 canUseTool 回调实现权限审批
 */
export class AgentRunner {
  /**
   * 启动 Agent 执行任务
   */
  public async run(options: AgentRunOptions): Promise<AgentRunResult> {
    const {
      prompt,
      cwd,
      permissionMode = 'default',
      canUseTool: canUseToolFn,
      onMessage,
      resumeSessionId,
      abortController = new AbortController(),
      maxBudgetUsd,
      env,
    } = options;

    let sessionId = '';
    let success = false;
    let resultText: string | undefined;
    let errors: string[] | undefined;
    let durationMs = 0;
    let costUsd = 0;
    let numTurns = 0;

    const q = query({
      prompt,
      options: {
        cwd,
        permissionMode,
        settingSources: ['project'],
        systemPrompt: { type: 'preset', preset: 'claude_code' },
        abortController,
        resume: resumeSessionId,
        maxBudgetUsd,
        env: env ?? process.env,
        canUseTool: canUseToolFn
          ? async (toolName, input) => {
              const result = await canUseToolFn(toolName, input as Record<string, unknown>);
              if (result.behavior === 'allow') {
                return { behavior: 'allow' as const, updatedInput: result.updatedInput };
              }
              return { behavior: 'deny' as const, message: result.message };
            }
          : undefined,
      },
    });

    try {
      for await (const msg of q) {
        if (!sessionId) {
          sessionId = extractSessionId(msg);
        }

        const agentMsg = toAgentMessage(msg);
        if (agentMsg && onMessage) {
          onMessage(agentMsg);
        }

        if (msg.type === 'result') {
          durationMs = msg.duration_ms;
          costUsd = msg.total_cost_usd;
          numTurns = msg.num_turns;
          if (msg.subtype === 'success') {
            success = true;
            resultText = msg.result;
          } else {
            success = false;
            errors = 'errors' in msg ? msg.errors : [msg.subtype];
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      success = false;
      errors = [errorMsg];
      onMessage?.({ type: 'error', message: errorMsg });
    }

    return {
      sessionId,
      success,
      result: resultText,
      errors,
      durationMs,
      costUsd,
      numTurns,
    };
  }
}

function extractSessionId(msg: SDKMessage): string {
  if ('session_id' in msg && typeof msg.session_id === 'string') {
    return msg.session_id;
  }
  return '';
}

/**
 * 将 SDK 原始消息转为简化的 AgentMessage
 */
function toAgentMessage(msg: SDKMessage): AgentMessage | null {
  switch (msg.type) {
    case 'system': {
      if (msg.subtype === 'init') {
        return {
          type: 'system',
          sessionId: msg.session_id,
          model: msg.model,
        };
      }
      return null;
    }

    case 'assistant': {
      const textParts: string[] = [];
      const toolUses: { toolName: string; input: Record<string, unknown> }[] = [];

      for (const block of msg.message.content) {
        if (block.type === 'text') {
          textParts.push(block.text);
        } else if (block.type === 'tool_use') {
          toolUses.push({
            toolName: block.name,
            input: (block.input ?? {}) as Record<string, unknown>,
          });
        }
      }

      // 优先返回文本内容；tool_use 作为独立消息通过后续处理
      if (textParts.length > 0) {
        return { type: 'assistant', text: textParts.join('\n') };
      }
      if (toolUses.length > 0) {
        return {
          type: 'tool_use',
          toolName: toolUses[0]!.toolName,
          input: toolUses[0]!.input,
        };
      }
      return null;
    }

    case 'result': {
      if (msg.subtype === 'success') {
        return {
          type: 'result',
          subtype: 'success',
          result: msg.result,
          durationMs: msg.duration_ms,
          costUsd: msg.total_cost_usd,
          numTurns: msg.num_turns,
        };
      }
      return {
        type: 'result',
        subtype: 'error',
        errors: 'errors' in msg ? msg.errors : [msg.subtype],
        durationMs: msg.duration_ms,
        costUsd: msg.total_cost_usd,
      };
    }

    default:
      return null;
  }
}
