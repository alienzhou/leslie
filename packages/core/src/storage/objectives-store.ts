import path from 'node:path';
import { LeslieError } from '../errors/cli-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';
import type { ObjectivesFile } from '../types/objective.js';
import { objectivesFileSchema } from '../types/schema.js';
import { ensureDir, pathExists, readJsonFile, writeJsonFile } from '../utils/json.js';
import { nowIso } from '../utils/time.js';
import { createBackup, recoverFromBackup } from './backup-recovery.js';
import { withFileLock } from './file-lock.js';

function emptyObjectivesFile(): ObjectivesFile {
  const now = nowIso();
  return {
    version: '1.0',
    objectives: {},
    metadata: {
      last_updated: now,
      objective_count: 0,
    },
  };
}

export class ObjectivesStore {
  public constructor(private readonly filePath: string) {}

  public async initIfMissing(): Promise<void> {
    if (await pathExists(this.filePath)) {
      return;
    }
    await ensureDir(path.dirname(this.filePath));
    await writeJsonFile(this.filePath, emptyObjectivesFile());
  }

  public async read(): Promise<ObjectivesFile> {
    await this.initIfMissing();
    return this.readWithRecovery();
  }

  public async mutate(updater: (data: ObjectivesFile) => void): Promise<ObjectivesFile> {
    await this.initIfMissing();
    return withFileLock(this.filePath, async () => {
      await createBackup(this.filePath);
      const data = await this.readWithRecovery();
      updater(data);
      data.metadata.last_updated = nowIso();
      data.metadata.objective_count = Object.keys(data.objectives).length;
      objectivesFileSchema.parse(data);
      await writeJsonFile(this.filePath, data);
      return data;
    });
  }

  private async readWithRecovery(): Promise<ObjectivesFile> {
    try {
      const parsed = await readJsonFile<ObjectivesFile>(this.filePath);
      return objectivesFileSchema.parse(parsed);
    } catch (error) {
      const recovered = await recoverFromBackup(this.filePath);
      if (recovered) {
        const parsed = await readJsonFile<ObjectivesFile>(this.filePath);
        return objectivesFileSchema.parse(parsed);
      }
      throw new LeslieError(ERROR_CODES.JSON_PARSE_FAILED, 'JSON parse error', {
        filePath: this.filePath,
        cause: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
