import fs from 'node:fs/promises';
import path from 'node:path';
import semver from 'semver';
import { ensureDir, pathExists } from '../utils/json.js';

export interface GuideUpdateOptions {
  agentsFilePath: string;
  blockContent: string;
  nextVersion: string;
  confirmMajorUpdate?: (fromVersion: string, toVersion: string) => Promise<boolean>;
}

export type GuideUpdateStatus = 'created' | 'appended' | 'updated' | 'skipped';

export interface GuideUpdateResult {
  status: GuideUpdateStatus;
  previousVersion?: string;
  nextVersion: string;
}

const OPENING_TAG = '<leslie_system_guide';
const CLOSING_TAG = '</leslie_system_guide>';

function extractVersion(block: string): string | null {
  const match = block.match(/version="([^"]+)"/u);
  return match?.[1] ?? null;
}

function findGuideBlock(content: string): { start: number; end: number; block: string } | null {
  const start = content.indexOf(OPENING_TAG);
  if (start < 0) {
    return null;
  }
  const endTagIndex = content.indexOf(CLOSING_TAG, start);
  if (endTagIndex < 0) {
    return null;
  }
  const end = endTagIndex + CLOSING_TAG.length;
  return {
    start,
    end,
    block: content.slice(start, end),
  };
}

export class AgentsGuideManager {
  public async upsert(options: GuideUpdateOptions): Promise<GuideUpdateResult> {
    await ensureDir(path.dirname(options.agentsFilePath));
    if (!(await pathExists(options.agentsFilePath))) {
      await fs.writeFile(options.agentsFilePath, `${options.blockContent}\n`, 'utf-8');
      return {
        status: 'created',
        nextVersion: options.nextVersion,
      };
    }

    const content = await fs.readFile(options.agentsFilePath, 'utf-8');
    const found = findGuideBlock(content);
    if (!found) {
      const suffix = content.endsWith('\n') ? '' : '\n';
      const nextContent = `${content}${suffix}\n${options.blockContent}\n`;
      await fs.writeFile(options.agentsFilePath, nextContent, 'utf-8');
      return {
        status: 'appended',
        nextVersion: options.nextVersion,
      };
    }

    const previousVersion = extractVersion(found.block) ?? '0.0.0';
    const diffType = semver.diff(previousVersion, options.nextVersion);

    if (diffType === 'major' && options.confirmMajorUpdate) {
      const confirmed = await options.confirmMajorUpdate(previousVersion, options.nextVersion);
      if (!confirmed) {
        return {
          status: 'skipped',
          previousVersion,
          nextVersion: options.nextVersion,
        };
      }
    }

    const nextContent = `${content.slice(0, found.start)}${options.blockContent}${content.slice(found.end)}`;
    await fs.writeFile(options.agentsFilePath, nextContent, 'utf-8');
    return {
      status: 'updated',
      previousVersion,
      nextVersion: options.nextVersion,
    };
  }
}
