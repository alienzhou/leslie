import fs from 'node:fs/promises';
import path from 'node:path';
import { LeslieError } from '../errors/cli-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';
import { nowIso } from '../utils/time.js';
import { ensureDir, pathExists, readJsonFile, writeJsonFile } from '../utils/json.js';
import { emptyThreadRelations, type ThreadRelationsFile } from '../types/relations.js';
import { threadRelationsSchema } from '../types/schema.js';
import { createBackup, recoverFromBackup } from './backup-recovery.js';
import { withFileLock } from './file-lock.js';

export interface RelationsStoreInput {
  relationsFilePath: string;
}

export class RelationsStore {
  private readonly filePath: string;

  public constructor(input: RelationsStoreInput) {
    this.filePath = input.relationsFilePath;
  }

  public async initIfMissing(): Promise<void> {
    if (await pathExists(this.filePath)) {
      return;
    }
    await ensureDir(path.dirname(this.filePath));
    await writeJsonFile(this.filePath, emptyThreadRelations());
  }

  public async read(): Promise<ThreadRelationsFile> {
    await this.initIfMissing();
    return this.readWithRecovery();
  }

  public async mutate(
    updater: (data: ThreadRelationsFile) => void,
  ): Promise<ThreadRelationsFile> {
    await this.initIfMissing();
    return withFileLock(this.filePath, async () => {
      await createBackup(this.filePath);
      const current = await this.readWithRecovery();
      updater(current);
      current.metadata.last_updated = nowIso();
      current.metadata.thread_count = Object.keys(current.threads).length;
      threadRelationsSchema.parse(current);
      await writeJsonFile(this.filePath, current);
      return current;
    });
  }

  private async readWithRecovery(): Promise<ThreadRelationsFile> {
    try {
      const parsed = await readJsonFile<ThreadRelationsFile>(this.filePath);
      return threadRelationsSchema.parse(parsed);
    } catch (error) {
      const recovered = await recoverFromBackup(this.filePath);
      if (recovered) {
        const parsed = await readJsonFile<ThreadRelationsFile>(this.filePath);
        return threadRelationsSchema.parse(parsed);
      }
      throw new LeslieError(ERROR_CODES.JSON_PARSE_FAILED, 'JSON parse error', {
        filePath: this.filePath,
        cause: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public async ensureFileExists(): Promise<void> {
    await this.initIfMissing();
    if (!(await pathExists(this.filePath))) {
      await fs.writeFile(this.filePath, `${JSON.stringify(emptyThreadRelations(), null, 2)}\n`, 'utf-8');
    }
  }
}
