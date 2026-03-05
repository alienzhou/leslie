import readline from 'node:readline';
import type { CanUseToolFn, PermissionResult } from '@vibe-x-ai/leslie-core';
import { decideToolPermission, loadPermissionPolicy } from './permission-policy.js';

const TOOL_LABELS: Record<string, string> = {
  Bash: 'Execute command',
  Write: 'Write file',
  Edit: 'Edit file',
  Read: 'Read file',
  Glob: 'Find files',
  Grep: 'Search content',
  MultiEdit: 'Multi-file edit',
};

function formatToolSummary(toolName: string, input: Record<string, unknown>): string {
  const label = TOOL_LABELS[toolName] ?? toolName;
  if (toolName === 'Bash' && typeof input.command === 'string') {
    return `${label}: ${input.command}`;
  }
  if ((toolName === 'Write' || toolName === 'Edit') && typeof input.file_path === 'string') {
    return `${label}: ${input.file_path}`;
  }
  if (toolName === 'Read' && typeof input.file_path === 'string') {
    return `${label}: ${input.file_path}`;
  }
  return `${label}: ${JSON.stringify(input).slice(0, 120)}`;
}

function askUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

/**
 * 创建交互式权限审批回调。
 * 默认按策略自动放行/拒绝，仅在 confirm 规则命中时提示用户 y/n。
 */
export function createInteractivePermissionHandler(workspaceRoot: string): CanUseToolFn {
  const policy = loadPermissionPolicy(workspaceRoot);
  return async (toolName: string, input: Record<string, unknown>): Promise<PermissionResult> => {
    const decision = decideToolPermission(policy, toolName, input);
    if (decision.action === 'allow') {
      return { behavior: 'allow', updatedInput: input };
    }
    if (decision.action === 'deny') {
      return { behavior: 'deny', message: decision.reason ?? `Denied by policy for ${toolName}` };
    }

    const summary = formatToolSummary(toolName, input);
    process.stderr.write(`\n\x1b[33m[tool]\x1b[0m ${summary}\n`);

    const answer = await askUser('  Allow? (y/n) ');

    if (answer === 'y' || answer === 'yes') {
      return { behavior: 'allow', updatedInput: input };
    }
    return { behavior: 'deny', message: `User denied tool: ${toolName}` };
  };
}
