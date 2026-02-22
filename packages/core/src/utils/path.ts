import path from 'node:path';

export interface LesliePaths {
  workspaceRoot: string;
  leslieRoot: string;
  threadsRoot: string;
  relationsFile: string;
  objectivesFile: string;
}

export function buildPaths(workspaceRoot: string): LesliePaths {
  const leslieRoot = path.join(workspaceRoot, '.leslie');
  return {
    workspaceRoot,
    leslieRoot,
    threadsRoot: path.join(leslieRoot, 'threads'),
    relationsFile: path.join(leslieRoot, 'thread_relations.json'),
    objectivesFile: path.join(leslieRoot, 'objectives.json'),
  };
}
