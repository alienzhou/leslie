import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { config } from 'dotenv';

/** 全局配置路径：~/.leslie/env */
export function getGlobalConfigPath(): string {
  return path.join(os.homedir(), '.leslie', 'env');
}

/**
 * Load .env format config file and merge into process.env.
 * Config values override existing env vars.
 * @throws if file not found or parse error (when required=true)
 */
export function loadEnvConfig(configPath: string, required = true): boolean {
  const resolved = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath);

  if (!required && !fs.existsSync(resolved)) {
    return false;
  }

  const result = config({ path: resolved, override: true });
  if (result.error) {
    throw new Error(`Failed to load config: ${resolved}\n${result.error.message}`);
  }
  return true;
}
