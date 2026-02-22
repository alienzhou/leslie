import fs from 'node:fs/promises';
import { pathExists } from '../utils/json.js';

export function backupPathFor(filePath: string): string {
  return `${filePath}.bak`;
}

export async function createBackup(filePath: string): Promise<void> {
  const backupPath = backupPathFor(filePath);
  if (!(await pathExists(filePath))) {
    return;
  }
  await fs.copyFile(filePath, backupPath);
}

export async function recoverFromBackup(filePath: string): Promise<boolean> {
  const backupPath = backupPathFor(filePath);
  if (!(await pathExists(backupPath))) {
    return false;
  }
  await fs.copyFile(backupPath, filePath);
  return true;
}
