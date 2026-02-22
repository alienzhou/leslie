import fs from 'node:fs/promises';
import path from 'node:path';
import type { InheritMode } from '../types/thread.js';
import type { LesliePaths } from '../utils/path.js';
import { ensureDir, pathExists } from '../utils/json.js';
import type { AssetDescriptor } from './asset-types.js';

const OWN_ASSET_CANDIDATES = [
  'plan.md',
  'plan',
  'progress.md',
  'design.md',
  'design',
  'learnings',
  'discuss',
  '.meta/transcripts',
] as const;

export class AssetManager {
  public constructor(private readonly paths: LesliePaths) {}

  public threadDir(threadId: string): string {
    return path.join(this.paths.threadsRoot, threadId);
  }

  public async ensureBaseDirs(): Promise<void> {
    await ensureDir(this.paths.leslieRoot);
    await ensureDir(this.paths.threadsRoot);
  }

  public async initThreadDir(threadId: string): Promise<void> {
    const base = this.threadDir(threadId);
    await ensureDir(base);
    await ensureDir(path.join(base, 'context', 'inherited'));
    await ensureDir(path.join(base, 'context', 'live'));
    await ensureDir(path.join(base, '.meta', 'transcripts'));
  }

  public async applyInheritance(
    parentThreadId: string,
    childThreadId: string,
    inheritMode: InheritMode,
    inheritScope?: string[],
  ): Promise<void> {
    if (inheritMode === 'none') {
      return;
    }

    const parentDir = this.threadDir(parentThreadId);
    const childDir = this.threadDir(childThreadId);

    if (!(await pathExists(parentDir))) {
      return;
    }

    if (inheritMode === 'full') {
      for (const candidate of OWN_ASSET_CANDIDATES) {
        const sourcePath = path.join(parentDir, candidate);
        const targetPath = path.join(childDir, candidate);
        if (await pathExists(sourcePath)) {
          await fs.cp(sourcePath, targetPath, { recursive: true });
        }
      }
      return;
    }

    const scope = inheritScope ?? [];
    for (const relativePath of scope) {
      const sourcePath = path.join(parentDir, relativePath);
      const targetPath = path.join(childDir, relativePath);
      if (await pathExists(sourcePath)) {
        await fs.cp(sourcePath, targetPath, { recursive: true });
      }
    }
  }

  public async listAssets(threadId: string): Promise<AssetDescriptor[]> {
    const threadDir = this.threadDir(threadId);
    const results: AssetDescriptor[] = [];
    const relative = (candidate: string) => path.posix.join('.leslie', 'threads', threadId, candidate);

    const pushIfExists = async (candidate: string, type: AssetDescriptor['type']) => {
      const target = path.join(threadDir, candidate);
      if (await pathExists(target)) {
        results.push({
          type,
          path: relative(candidate),
        });
      }
    };

    await pushIfExists('plan.md', 'plan');
    await pushIfExists('plan', 'plan');
    await pushIfExists('progress.md', 'progress');
    await pushIfExists('design.md', 'design');
    await pushIfExists('design', 'design');
    await pushIfExists('learnings', 'learnings');
    await pushIfExists('discuss', 'discuss');
    await pushIfExists('.meta/transcripts', 'transcript');

    return results;
  }

  public async copyFrozenReference(
    sourceThreadId: string,
    targetThreadId: string,
    scope: string[] | undefined,
  ): Promise<string[]> {
    const sourceRoot = this.threadDir(sourceThreadId);
    const targetRoot = path.join(this.threadDir(targetThreadId), 'context', 'inherited', sourceThreadId);
    await ensureDir(targetRoot);

    const copied: string[] = [];
    const selectedPaths = scope && scope.length > 0 ? scope : ['.'];
    for (const relativePath of selectedPaths) {
      const sourcePath = path.join(sourceRoot, relativePath);
      if (!(await pathExists(sourcePath))) {
        continue;
      }
      const normalized = relativePath === '.' ? '' : relativePath;
      const targetPath = path.join(targetRoot, normalized);
      await fs.cp(sourcePath, targetPath, { recursive: true });
      copied.push(path.posix.join('.leslie', 'threads', targetThreadId, 'context', 'inherited', sourceThreadId, normalized));
    }

    return copied;
  }
}
