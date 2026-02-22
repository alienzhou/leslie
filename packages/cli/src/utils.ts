export function splitComma(input: unknown): string[] {
  if (typeof input !== 'string' || input.trim() === '') {
    return [];
  }
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function requiredString(input: unknown, flagName: string): string {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error(`Missing required flag --${flagName}`);
  }
  return input;
}
