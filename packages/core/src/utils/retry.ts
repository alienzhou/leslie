import { LeslieError } from '../errors/cli-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  multiplier?: number;
  retryableCodes?: string[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 10;
  const initialDelayMs = options.initialDelayMs ?? 100;
  const maxDelayMs = options.maxDelayMs ?? 5000;
  const multiplier = options.multiplier ?? 2;
  const retryableCodes = new Set(options.retryableCodes ?? [ERROR_CODES.FILE_LOCK_FAILED]);

  let delay = initialDelayMs;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      return await operation();
    } catch (error) {
      const code = error instanceof LeslieError ? error.code : undefined;
      if (!code || !retryableCodes.has(code) || attempt >= maxAttempts) {
        if (error instanceof LeslieError) {
          throw new LeslieError(error.code, error.message, {
            ...(error.details ?? {}),
            attempts: attempt,
          });
        }

        throw error;
      }
      await sleep(delay);
      delay = Math.min(delay * multiplier, maxDelayMs);
    }
  }

  throw new LeslieError(ERROR_CODES.UNKNOWN_ERROR, 'Retry exhausted unexpectedly');
}
