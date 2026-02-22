import type { WarningCode } from './error-codes.js';
import type { Warning } from '../types/cli-response.js';

export function warning(
  code: WarningCode,
  message: string,
  context?: Record<string, unknown>,
): Warning {
  return {
    code,
    message,
    context,
  };
}
