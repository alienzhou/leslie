export type ObjectiveStatus = 'active' | 'completed';

export interface ObjectiveInfo {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  status: ObjectiveStatus;
  thread_ids: string[];
}

export interface ObjectivesFile {
  version: string;
  objectives: Record<string, ObjectiveInfo>;
  metadata: {
    last_updated: string;
    objective_count: number;
  };
}
