export type ThreadStatus =
  | 'active'
  | 'suspended'
  | 'completed'
  | 'cancelled'
  | 'archived'
  | 'frozen'
  | 'waiting_human';

export type ThreadExecutor = 'human' | 'agent' | 'system';

export type InheritMode = 'full' | 'partial' | 'none';

export type ReferenceBinding = 'frozen' | 'live';

export type LifecycleAction = 'done' | 'archive' | 'cancel' | 'suspend' | 'resume';

export interface ThreadInfo {
  id: string;
  title: string;
  objective: string;
  created_at: string;
  status: ThreadStatus;
  tags?: string[];
  parent_id: string | null;
  storage_path: string;
  executor: ThreadExecutor;
  updated_at: string;
}

export interface SpawnInput {
  intent: string;
  objective: string;
  parentId?: string;
  inherit: InheritMode;
  inheritScope?: string[];
  refs?: string[];
  executor?: ThreadExecutor;
  tags?: string[];
}

export interface SpawnResult {
  thread_id: string;
  parent_id: string | null;
  status: ThreadStatus;
  objective: string;
}
