export function nowIso(): string {
  return new Date().toISOString();
}

export function toCompactTimestamp(date: Date = new Date()): string {
  const yyyy = date.getUTCFullYear().toString();
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = date.getUTCDate().toString().padStart(2, '0');
  const hh = date.getUTCHours().toString().padStart(2, '0');
  const min = date.getUTCMinutes().toString().padStart(2, '0');
  return `${yyyy}${mm}${dd}-${hh}${min}`;
}
