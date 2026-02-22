import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { LeslieError } from '../errors/cli-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';
import { AssetManager } from '../assets/asset-manager.js';
import { RelationsStore } from '../storage/relations-store.js';
import { generateId } from '../utils/id.js';
import { nowIso } from '../utils/time.js';

export type ConflictStrategy = 'interactive' | 'agent-first' | 'human' | 'strict';

export interface MergeInput {
  sources: string[];
  target: string;
  artifactScope?: string[];
  conflictStrategy?: ConflictStrategy;
  operator?: 'user' | 'system' | 'agent';
}

export interface MergeResult {
  mergedFiles: string[];
  conflicts: string[];
}

async function hashFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

async function collectFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export class MergeManager {
  public constructor(
    private readonly relationsStore: RelationsStore,
    private readonly assetManager: AssetManager,
  ) {}

  public async merge(input: MergeInput): Promise<MergeResult> {
    const strategy = input.conflictStrategy ?? 'interactive';
    const relations = await this.relationsStore.read();
    const target = relations.threads[input.target];
    if (!target) {
      throw new LeslieError(ERROR_CODES.THREAD_NOT_FOUND, `Thread '${input.target}' not found`);
    }

    const targetDir = this.assetManager.threadDir(input.target);
    const mergedFiles: string[] = [];
    const conflicts: string[] = [];
    const seenRelative = new Map<string, string>();

    for (const sourceId of input.sources) {
      const sourceThread = relations.threads[sourceId];
      if (!sourceThread) {
        throw new LeslieError(ERROR_CODES.THREAD_NOT_FOUND, `Thread '${sourceId}' not found`);
      }
      const sourceDir = this.assetManager.threadDir(sourceId);
      const files = await collectFiles(sourceDir);
      for (const file of files) {
        const relative = path.relative(sourceDir, file);
        if (relative.startsWith('.meta')) {
          continue;
        }
        if (input.artifactScope && input.artifactScope.length > 0) {
          const matched = input.artifactScope.some((scope) => relative.startsWith(scope));
          if (!matched) {
            continue;
          }
        }

        const targetFile = path.join(targetDir, relative);
        if (seenRelative.has(relative)) {
          const previousFile = seenRelative.get(relative) as string;
          const [prevHash, nextHash] = await Promise.all([hashFile(previousFile), hashFile(file)]);
          if (prevHash !== nextHash) {
            conflicts.push(relative);
            if (strategy === 'strict') {
              throw new LeslieError(
                ERROR_CODES.MERGE_CONFLICT_UNRESOLVED,
                `Merge conflict detected: ${relative}`,
                { file: relative },
              );
            }
          }
        } else {
          seenRelative.set(relative, file);
        }

        await fs.mkdir(path.dirname(targetFile), { recursive: true });
        await fs.copyFile(file, targetFile);
        mergedFiles.push(path.posix.join('.leslie', 'threads', input.target, relative));
      }
    }

    await this.relationsStore.mutate((data) => {
      data.operations.push({
        id: generateId('op'),
        timestamp: nowIso(),
        command: 'merge',
        operator: input.operator ?? 'user',
        params: {
          sources: input.sources,
          target: input.target,
          conflict_strategy: strategy,
          conflicts,
        },
      });
    });

    return {
      mergedFiles,
      conflicts,
    };
  }
}
