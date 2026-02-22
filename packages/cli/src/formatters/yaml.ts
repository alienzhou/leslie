import YAML from 'yaml';

export function formatYaml(value: unknown): string {
  return YAML.stringify(value);
}
