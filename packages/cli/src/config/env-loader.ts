import path from 'node:path';
import { config } from 'dotenv';

/**
 * Load .env format config file and merge into process.env.
 * Config values override existing env vars.
 */
export function loadEnvConfig(configPath: string): void {
  const resolved = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath);

  const result = config({ path: resolved, override: true });
  if (result.error) {
    throw new Error(`Failed to load config: ${resolved}\n${result.error.message}`);
  }
}
