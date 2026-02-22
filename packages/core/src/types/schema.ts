import { z } from 'zod';

export const threadStatusSchema = z.enum([
  'active',
  'suspended',
  'completed',
  'cancelled',
  'archived',
  'frozen',
  'waiting_human',
]);

export const threadInfoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  objective: z.string().min(1),
  created_at: z.string().datetime(),
  status: threadStatusSchema,
  tags: z.array(z.string()).optional(),
  parent_id: z.string().nullable(),
  storage_path: z.string().min(1),
  executor: z.enum(['human', 'agent', 'system']),
  updated_at: z.string().datetime(),
});

export const relationInfoSchema = z.object({
  children: z.array(z.string()),
  references_to: z.array(z.string()),
  referenced_by: z.array(z.string()),
  depends_on: z.array(z.string()),
});

export const relationOperationSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime(),
  command: z.string().min(1),
  operator: z.enum(['user', 'system', 'agent']),
  params: z.record(z.unknown()),
});

export const threadRelationsSchema = z.object({
  version: z.string().min(1),
  metadata: z.object({
    last_updated: z.string().datetime(),
    thread_count: z.number().int().nonnegative(),
  }),
  threads: z.record(threadInfoSchema),
  operations: z.array(relationOperationSchema),
  relations: z.record(relationInfoSchema),
});

export const objectiveInfoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  status: z.enum(['active', 'completed']),
  thread_ids: z.array(z.string()),
});

export const objectivesFileSchema = z.object({
  version: z.string().min(1),
  objectives: z.record(objectiveInfoSchema),
  metadata: z.object({
    last_updated: z.string().datetime(),
    objective_count: z.number().int().nonnegative(),
  }),
});
