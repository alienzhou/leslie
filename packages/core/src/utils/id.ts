import { randomUUID } from 'node:crypto';

export function generateId(prefix: string): string {
  const id = randomUUID().split('-')[0];
  return `${prefix}-${id}`;
}
