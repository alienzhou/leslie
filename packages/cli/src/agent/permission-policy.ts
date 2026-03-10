import fs from 'node:fs';
import path from 'node:path';

export type PolicyAction = 'allow' | 'confirm' | 'deny';

/** 外置配置：default 仅作用于 Bash 未命中 deny/confirm 的命令；非 Bash 工具一律放行 */
interface RawPermissionConfig {
  /** 仅对 Bash 未命中规则时生效，可选 allow | confirm | deny */
  default?: PolicyAction;
  bash?: {
    deny?: string[];
    confirm?: string[];
  };
}

interface CompiledPermissionPolicy {
  defaultAction: PolicyAction;
  bashDeny: RegExp[];
  bashConfirm: RegExp[];
}

const PROTECTED_CONTROL_FILES = new Set([
  path.posix.normalize('.leslie/thread_relations.json'),
  path.posix.normalize('.leslie/objectives.json'),
]);

const DEFAULT_BASH_DENY_PATTERNS = [
  String.raw`\brm\s+-rf\b`,
  String.raw`\bmkfs\b`,
  String.raw`\bfdisk\b|\bparted\b`,
  String.raw`\bdd\b\s+.*\bof=/dev/`,
  String.raw`\bchmod\b\s+-R\s+777\s+/`,
  String.raw`\bchown\b\s+-R\b.*\s+/`,
  String.raw`\bshutdown\b|\breboot\b|\bhalt\b|\bpoweroff\b`,
  String.raw`>\s*/dev/(sd|disk)`,
];

const DEFAULT_BASH_CONFIRM_PATTERNS = [
  String.raw`\bcurl\b.+\|\s*(sh|bash)\b`,
  String.raw`\bwget\b.+\|\s*(sh|bash)\b`,
  String.raw`\bgit\s+push\s+.*--force\b`,
  String.raw`\bdocker\s+system\s+prune\b`,
];

function compilePatterns(patterns: string[]): RegExp[] {
  const compiled: RegExp[] = [];
  for (const pattern of patterns) {
    try {
      compiled.push(new RegExp(pattern));
    } catch (err) {
      process.stderr.write(
        `[leslie] Warning: Invalid regex in permission config: ${pattern} - ${err instanceof Error ? err.message : String(err)}\n`,
      );
    }
  }
  return compiled;
}

function readConfigFile(filePath: string): RawPermissionConfig | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content) as RawPermissionConfig;
    return parsed;
  } catch (err) {
    process.stderr.write(
      `[leslie] Warning: Failed to load permission config from ${filePath}: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return null;
  }
}

function mergeConfig(base: RawPermissionConfig, extra: RawPermissionConfig | null): RawPermissionConfig {
  if (!extra) {
    return base;
  }
  return {
    default: extra.default ?? base.default,
    bash: {
      deny: [...(base.bash?.deny ?? []), ...(extra.bash?.deny ?? [])],
      confirm: [...(base.bash?.confirm ?? []), ...(extra.bash?.confirm ?? [])],
    },
  };
}

function normalizeCandidatePath(rawPath: string): string {
  const normalized = rawPath.replace(/\\/g, '/').trim();
  const noPrefix = normalized.startsWith('./') ? normalized.slice(2) : normalized;
  return path.posix.normalize(noPrefix);
}

function collectPathLikeStrings(input: unknown, acc: string[]): void {
  if (typeof input === 'string') {
    if (input.includes('/') || input.includes('\\') || input.includes('.leslie')) {
      acc.push(input);
    }
    return;
  }
  if (Array.isArray(input)) {
    for (const item of input) {
      collectPathLikeStrings(item, acc);
    }
    return;
  }
  if (typeof input === 'object' && input !== null) {
    for (const value of Object.values(input as Record<string, unknown>)) {
      collectPathLikeStrings(value, acc);
    }
  }
}

function shouldBlockProtectedFileWrite(toolName: string, input: Record<string, unknown>): boolean {
  const lowerToolName = toolName.toLowerCase();
  const maybeWriteTool =
    lowerToolName.includes('write') ||
    lowerToolName.includes('edit') ||
    lowerToolName.includes('replace') ||
    lowerToolName.includes('delete') ||
    lowerToolName.includes('remove') ||
    lowerToolName.includes('rename') ||
    lowerToolName.includes('move');

  if (!maybeWriteTool) {
    return false;
  }

  const candidates: string[] = [];
  collectPathLikeStrings(input, candidates);
  return candidates.some((raw) => PROTECTED_CONTROL_FILES.has(normalizeCandidatePath(raw)));
}

export function loadPermissionPolicy(workspaceRoot: string): CompiledPermissionPolicy {
  const repoConfigPath = path.join(workspaceRoot, 'leslie.permissions.json');
  const localConfigPath = path.join(workspaceRoot, '.leslie', 'permissions.json');

  const base: RawPermissionConfig = {
    default: 'allow',
    bash: {
      deny: [...DEFAULT_BASH_DENY_PATTERNS],
      confirm: [...DEFAULT_BASH_CONFIRM_PATTERNS],
    },
  };

  const repoConfig = readConfigFile(repoConfigPath);
  const localConfig = readConfigFile(localConfigPath);
  const merged = mergeConfig(mergeConfig(base, repoConfig), localConfig);

  const defaultAction: PolicyAction =
    merged.default === 'allow' || merged.default === 'confirm' || merged.default === 'deny' ? merged.default : 'allow';

  return {
    defaultAction,
    bashDeny: compilePatterns(merged.bash?.deny ?? []),
    bashConfirm: compilePatterns(merged.bash?.confirm ?? []),
  };
}

export function decideToolPermission(
  policy: CompiledPermissionPolicy,
  toolName: string,
  input: Record<string, unknown>,
): { action: PolicyAction; reason?: string } {
  if (shouldBlockProtectedFileWrite(toolName, input)) {
    return {
      action: 'deny',
      reason: `Protected Leslie control file can only be modified via Leslie CLI: ${Array.from(PROTECTED_CONTROL_FILES).join(', ')}`,
    };
  }

  // 仅 Bash 走 deny/confirm 规则；Read/Write/Edit 等一律放行
  if (toolName !== 'Bash') {
    return { action: 'allow' };
  }

  const command = typeof input.command === 'string' ? input.command : '';
  for (const re of policy.bashDeny) {
    if (re.test(command)) {
      return { action: 'deny', reason: `Command denied by policy: ${command}` };
    }
  }
  for (const re of policy.bashConfirm) {
    if (re.test(command)) {
      return { action: 'confirm' };
    }
  }
  return { action: policy.defaultAction };
}
