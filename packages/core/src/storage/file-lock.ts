import lockfile from 'proper-lockfile';
import { LeslieError } from '../errors/cli-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

export async function withFileLock<T>(filePath: string, run: () => Promise<T>): Promise<T> {
  let release: (() => Promise<void>) | undefined;
  try {
    release = await lockfile.lock(filePath, {
      stale: 10_000,
      retries: {
        retries: 5,
        factor: 2,
        minTimeout: 100,
        maxTimeout: 1000,
      },
      realpath: false,
    });
  } catch (error) {
    throw new LeslieError(ERROR_CODES.FILE_LOCK_FAILED, 'File lock failed', {
      filePath,
      cause: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    return await run();
  } finally {
    await release();
  }
}
