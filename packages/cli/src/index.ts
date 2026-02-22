import minimist from 'minimist';
import { LeslieCore, isLeslieError } from '@vibe-x-ai/leslie-core';
import { formatJson } from './formatters/json.js';
import { formatTable } from './formatters/table.js';
import { formatYaml } from './formatters/yaml.js';
import { normalizeFormat } from './flags/format.js';
import { runArtifacts } from './commands/artifacts.js';
import { runInit } from './commands/init.js';
import { runInject } from './commands/inject.js';
import { runLifecycle } from './commands/lifecycle.js';
import { runList } from './commands/list.js';
import { runMerge } from './commands/merge.js';
import { runReference } from './commands/reference.js';
import { runSpawn } from './commands/spawn.js';
import { runStatus } from './commands/status.js';
import { runTransfer } from './commands/transfer.js';
import { runTranscript } from './commands/transcript.js';
import { runObjectiveCreate } from './commands/objective/create.js';
import { runObjectiveList } from './commands/objective/list.js';
import { runObjectiveStatus } from './commands/objective/status.js';

function printOutput(value: unknown, format: 'json' | 'table' | 'yaml'): void {
  if (format === 'table') {
    process.stdout.write(`${formatTable(value)}\n`);
    return;
  }
  if (format === 'yaml') {
    process.stdout.write(`${formatYaml(value)}\n`);
    return;
  }
  process.stdout.write(`${formatJson(value)}\n`);
}

function showHelp(): void {
  const lines = [
    'Leslie CLI',
    '',
    'Commands:',
    '  init',
    '  objective create --title <title>',
    '  objective list',
    '  objective status --id <objective-id>',
    '  spawn --intent <intent> --objective <objective-id> [--parent <thread-id>]',
    '  reference --from <thread-id> --target <thread-id> [--binding frozen|live]',
    '  lifecycle --thread <thread-id> --action done|cancel|suspend|resume|archive',
    '  list [--status <status>]',
    '  status --thread <thread-id>',
    '  artifacts --thread <thread-id>',
    '  transfer --thread <thread-id> --direction request_approval|delegate|handoff --scope a,b',
    '  inject --thread <thread-id> --type <type> --content <content>',
    '  merge --sources <thread-a,thread-b> --target <thread-id>',
    '  transcript --thread <thread-id> --chat <chat-id> --query <text> --assistant <text>',
    '',
    'Global flags:',
    '  --format json|table|yaml (default json)',
    '  --debug',
    '  --help',
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
}

function parseCommand(argv: string[]): { command: string; subcommand?: string; flags: minimist.ParsedArgs } {
  const flags = minimist(argv);
  const command = String(flags._[0] ?? '');
  const subcommand = typeof flags._[1] === 'string' ? String(flags._[1]) : undefined;
  return { command, subcommand, flags };
}

export async function runCli(argv: string[]): Promise<void> {
  const { command, subcommand, flags } = parseCommand(argv);
  if (flags.help || command === 'help' || command === '') {
    showHelp();
    return;
  }

  const format = normalizeFormat(flags.format);
  const core = new LeslieCore({
    workspaceRoot: process.cwd(),
    debugMode: Boolean(flags.debug),
  });

  try {
    await core.initProject();

    let response: unknown;
    if (command === 'init') {
      response = await runInit(core, flags);
    } else if (command === 'spawn') {
      response = await runSpawn(core, flags);
    } else if (command === 'reference') {
      response = await runReference(core, flags);
    } else if (command === 'lifecycle') {
      response = await runLifecycle(core, flags);
    } else if (command === 'list') {
      response = await runList(core, flags);
    } else if (command === 'status') {
      response = await runStatus(core, flags);
    } else if (command === 'artifacts') {
      response = await runArtifacts(core, flags);
    } else if (command === 'transfer') {
      response = await runTransfer(core, flags);
    } else if (command === 'inject') {
      response = await runInject(core, flags);
    } else if (command === 'merge') {
      response = await runMerge(core, flags);
    } else if (command === 'transcript') {
      response = await runTranscript(core, flags);
    } else if (command === 'objective' && subcommand === 'create') {
      response = await runObjectiveCreate(core, flags);
    } else if (command === 'objective' && subcommand === 'list') {
      response = await runObjectiveList(core);
    } else if (command === 'objective' && subcommand === 'status') {
      response = await runObjectiveStatus(core, flags);
    } else {
      throw new Error(`Unknown command: ${command}${subcommand ? ` ${subcommand}` : ''}`);
    }

    printOutput(response, format);
  } catch (error) {
    const payload = toCliError(error);
    printOutput(payload, format);
    process.exitCode = 1;
  }
}

function toCliError(error: unknown) {
  if (isLeslieError(error)) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: 'T902',
        message: error.message,
      },
    };
  }
  return {
    success: false,
    error: {
      code: 'T902',
      message: String(error),
    },
  };
}
