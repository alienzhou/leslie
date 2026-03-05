import fs from 'node:fs';
import path from 'node:path';

export type PolicyAction = 'allow' | 'confirm' | 'deny';

interface RawPermissionConfig {
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
    } catch {
      // Ignore invalid regex patterns from user config
    }
  }
  return compiled;
}

function readConfigFile(filePath: string): RawPermissionConfig | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content) as RawPermissionConfig;
    return parsed;
  } catch {
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
  if (toolName !== 'Bash') {
    return { action: policy.defaultAction };
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
