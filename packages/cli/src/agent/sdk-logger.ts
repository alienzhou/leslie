import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * 当 LESLIE_LOG_SDK=1 时，创建将原始 SDKMessage 追加到 NDJSON 文件的回调。
 * 用于调试 Claude Code 运行时的详细消息流。
 *
 * 输出路径: .leslie/logs/sdk/{threadId}.ndjson
 */
export function createSdkMessageLogger(
  workspaceRoot: string,
  threadId: string,
): ((msg: unknown) => Promise<void>) | undefined {
  if (process.env.LESLIE_LOG_SDK !== '1') {
    return undefined;
  }

  const logDir = path.join(workspaceRoot, '.leslie', 'logs', 'sdk');
  const logPath = path.join(logDir, `${threadId}.ndjson`);

  return async (msg: unknown): Promise<void> => {
    try {
      await fs.mkdir(logDir, { recursive: true });
      const line = JSON.stringify(msg);
      await fs.appendFile(logPath, `${line}\n`, 'utf-8');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[leslie] sdk log write failed: ${errMsg}\n`);
    }
  };
}
