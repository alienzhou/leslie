import type { AgentMessage, OnMessageFn } from '@vibe-x-ai/leslie-core';

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
} as const;

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m${remainingSeconds}s`;
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

/**
 * 创建前台输出渲染回调。
 * 按 D30.6 规范将 AgentMessage 输出到 stderr（避免干扰 stdout JSON）。
 */
export function createOutputRenderer(): OnMessageFn {
  return (msg: AgentMessage) => {
    switch (msg.type) {
      case 'system':
        process.stderr.write(
          `${COLORS.dim}[session] ${msg.sessionId} | model: ${msg.model}${COLORS.reset}\n`,
        );
        break;

      case 'assistant':
        process.stderr.write(`${msg.text}\n`);
        break;

      case 'tool_use':
        // tool_use 由 permission-prompt 处理显示，这里不重复
        break;

      case 'tool_result':
        process.stderr.write(
          `${COLORS.dim}  [result] ${msg.toolName}: ${msg.output.slice(0, 200)}${COLORS.reset}\n`,
        );
        break;

      case 'result':
        if (msg.subtype === 'success') {
          process.stderr.write(
            `\n${COLORS.green}[done]${COLORS.reset} ${formatDuration(msg.durationMs)} | ${formatCost(msg.costUsd)} | ${msg.numTurns} turns\n`,
          );
        } else {
          process.stderr.write(
            `\n${COLORS.red}[error]${COLORS.reset} ${msg.errors.join(', ')} | ${formatDuration(msg.durationMs)} | ${formatCost(msg.costUsd)}\n`,
          );
        }
        break;

      case 'error':
        process.stderr.write(`${COLORS.red}[error]${COLORS.reset} ${msg.message}\n`);
        break;
    }
  };
}
