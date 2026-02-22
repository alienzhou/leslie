function cell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function formatTable(input: unknown): string {
  if (!Array.isArray(input)) {
    if (typeof input === 'object' && input !== null) {
      const entries = Object.entries(input as Record<string, unknown>);
      const max = Math.max(...entries.map(([k]) => k.length), 8);
      return entries.map(([k, v]) => `${k.padEnd(max)} : ${cell(v)}`).join('\n');
    }
    return cell(input);
  }

  if (input.length === 0) {
    return '';
  }
  const rows = input as Record<string, unknown>[];
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const width = headers.map((header) =>
    Math.max(header.length, ...rows.map((row) => cell(row[header]).length)),
  );
  const headerLine = headers.map((header, i) => header.padEnd(width[i] ?? header.length)).join(' | ');
  const splitLine = headers
    .map((header, i) => '-'.repeat(width[i] ?? header.length))
    .join('-|-');
  const body = rows
    .map((row) =>
      headers
        .map((header, i) => cell(row[header]).padEnd(width[i] ?? header.length))
        .join(' | '),
    )
    .join('\n');
  return `${headerLine}\n${splitLine}\n${body}`;
}
