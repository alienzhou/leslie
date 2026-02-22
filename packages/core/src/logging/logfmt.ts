function encodeValue(value: unknown): string {
  if (typeof value === 'string') {
    if (/[\s=]/.test(value)) {
      return `"${value.replaceAll('"', '\\"')}"`;
    }
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value === null || value === undefined) {
    return 'null';
  }

  return `"${JSON.stringify(value).replaceAll('"', '\\"')}"`;
}

export function toLogfmt(fields: Record<string, unknown>): string {
  const keys = Object.keys(fields).sort();
  return keys.map((key) => `${key}=${encodeValue(fields[key])}`).join(' ');
}
