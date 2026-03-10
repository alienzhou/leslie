import type { PermissionMode } from '@anthropic-ai/claude-agent-sdk';

/**
 * canUseTool 回调的返回类型，与 SDK PermissionResult 对齐
 */
export type PermissionResult =
  | { behavior: 'allow'; updatedInput: Record<string, unknown> }
  | { behavior: 'deny'; message: string };

/**
 * canUseTool 回调签名，由 CLI 层实现交互逻辑
 */
export type CanUseToolFn = (
  toolName: string,
  input: Record<string, unknown>,
) => Promise<PermissionResult>;

/**
 * SDKMessage 的输出回调，由 CLI 层实现渲染逻辑
 */
export type OnMessageFn = (message: AgentMessage) => void;

/**
 * 简化后的 Agent 消息类型，用于 CLI 渲染
 */
export type AgentMessage =
  | { type: 'system'; sessionId: string; model: string }
  | { type: 'assistant'; text: string }
  | { type: 'tool_use'; toolName: string; input: Record<string, unknown> }
  | { type: 'tool_result'; toolName: string; output: string }
  | { type: 'result'; subtype: 'success'; result: string; durationMs: number; costUsd: number; numTurns: number }
  | { type: 'result'; subtype: 'error'; errors: string[]; durationMs: number; costUsd: number }
  | { type: 'error'; message: string };

/**
 * AgentRunner.run() 的输入参数
 */
export interface AgentRunOptions {
  /** Thread 的 intent，作为 prompt 传给 SDK */
  prompt: string;
  /** 工作目录 */
  cwd: string;
  /** 权限模式，默认 "default" */
  permissionMode?: PermissionMode;
  /** 自定义权限审批回调 */
  canUseTool?: CanUseToolFn;
  /** 消息输出回调 */
  onMessage?: OnMessageFn;
  /** 原始 SDKMessage 回调，用于调试/日志记录（如 LESLIE_LOG_SDK=1 时写入文件） */
  onSdkMessage?: (msg: unknown) => void | Promise<void>;
  /** 恢复已有 session */
  resumeSessionId?: string;
  /** 用于取消的 AbortController */
  abortController?: AbortController;
  /** 最大预算（USD） */
  maxBudgetUsd?: number;
  /** 传给 Claude Code 子进程的环境变量，默认用 process.env */
  env?: Record<string, string | undefined>;
}

/**
 * AgentRunner.run() 的返回结果
 */
export interface AgentRunResult {
  /** 从 SDK 获取的 session ID */
  sessionId: string;
  /** 是否成功 */
  success: boolean;
  /** 成功时的结果文本 */
  result?: string;
  /** 失败时的错误信息 */
  errors?: string[];
  /** 总耗时（ms） */
  durationMs: number;
  /** 总花费（USD） */
  costUsd: number;
  /** 对话轮次 */
  numTurns: number;
}
