export type OutputFormat = 'json' | 'table' | 'yaml';

export function normalizeFormat(value: unknown): OutputFormat {
  if (value === 'table') {
    return 'table';
  }
  if (value === 'yaml') {
    return 'yaml';
  }
  return 'json';
}
