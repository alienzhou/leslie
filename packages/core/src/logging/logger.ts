import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { nowIso } from '../utils/time.js';
import { ensureDir } from '../utils/json.js';
import { toLogfmt } from './logfmt.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface Logger {
  debug(msg: string, context?: Record<string, unknown>): Promise<void>;
  info(msg: string, context?: Record<string, unknown>): Promise<void>;
  warn(msg: string, context?: Record<string, unknown>): Promise<void>;
  error(msg: string, context?: Record<string, unknown>): Promise<void>;
}

export interface LoggerFactoryInput {
  objectiveId: string;
  threadId?: string;
  debugMode?: boolean;
}

class FileLogger implements Logger {
  private readonly minLevel: LogLevel;

  public constructor(
    private readonly filePath: string,
    minLevel: LogLevel,
    private readonly commonContext: Record<string, unknown>,
  ) {
    this.minLevel = minLevel;
  }

  public async debug(msg: string, context?: Record<string, unknown>): Promise<void> {
    await this.write('debug', msg, context);
  }

  public async info(msg: string, context?: Record<string, unknown>): Promise<void> {
    await this.write('info', msg, context);
  }

  public async warn(msg: string, context?: Record<string, unknown>): Promise<void> {
    await this.write('warn', msg, context);
  }

  public async error(msg: string, context?: Record<string, unknown>): Promise<void> {
    await this.write('error', msg, context);
  }

  private async write(
    level: LogLevel,
    msg: string,
    context: Record<string, unknown> = {},
  ): Promise<void> {
    if (levelWeight[level] < levelWeight[this.minLevel]) {
      return;
    }

    const line = toLogfmt({
      time: nowIso(),
      level,
      msg,
      ...this.commonContext,
      ...context,
    });
    await fs.appendFile(this.filePath, `${line}\n`, 'utf-8');
  }
}

export async function createLogger(input: LoggerFactoryInput): Promise<Logger> {
  const objectiveLogDir = path.join(os.homedir(), '.leslie', 'logs', input.objectiveId);
  await ensureDir(objectiveLogDir);

  const fileName = input.threadId ? `${input.threadId}.log` : 'objective.log';
  const filePath = path.join(objectiveLogDir, fileName);
  const minLevel = input.debugMode || process.env.LESLIE_DEBUG === '1' ? 'debug' : 'info';

  return new FileLogger(filePath, minLevel, {
    objectiveId: input.objectiveId,
    threadId: input.threadId ?? 'objective',
  });
}
