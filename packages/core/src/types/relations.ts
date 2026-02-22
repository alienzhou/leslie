import type { ThreadInfo } from "./thread.js";

export interface RelationInfo {
  children: string[];
  references_to: string[];
  referenced_by: string[];
  depends_on: string[];
}

export interface RelationOperation {
  id: string;
  timestamp: string;
  command: string;
  operator: 'user' | 'system' | 'agent';
  params: Record<string, unknown>;
}

export interface ThreadRelationsFile {
  version: string;
  metadata: {
    last_updated: string;
    thread_count: number;
  };
  threads: Record<string, ThreadInfo>;
  operations: RelationOperation[];
  relations: Record<string, RelationInfo>;
}

export function emptyThreadRelations(): ThreadRelationsFile {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    metadata: {
      last_updated: now,
      thread_count: 0,
    },
    threads: {},
    operations: [],
    relations: {},
  };
}
