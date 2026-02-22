import type { ErrorCode } from './error-codes.js';

export class LeslieError extends Error {
  public readonly code: ErrorCode;

  public readonly details?: Record<string, unknown>;

  public constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'LeslieError';
    this.code = code;
    this.details = details;
  }
}

export function isLeslieError(error: unknown): error is LeslieError {
  return error instanceof LeslieError;
}
