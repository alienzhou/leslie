# AGENTS.md

> Project specifications and context guidance for AI Agents (Claude Code, CodeFlicker, etc.)

## Project Overview

**Leslie** is a multi-thread Agent orchestration framework, with **Human-Agent Parity** as its core philosophy.

- **Repository**: https://github.com/vibe-x-ai/leslie
- **Package**: `@vibe-x-ai/leslie`
- **Command**: `leslie`

## Core Concepts

### 1. Objective
Top-level task unit. All Threads must belong to an Objective. An Objective is complete when all its Threads are terminated.

### 2. Thread
Execution unit, corresponding to a Claude Code process (via `@anthropic-ai/claude-agent-sdk`).

### 3. Human-Agent Parity
Humans and Agents are equal:
- Both can initiate tasks
- Both can ask each other for help
- Humans can intervene in Agent work at any time

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 22.x LTS | Runtime |
| TypeScript | 5.x | Language |
| pnpm | 9.x | Package manager |
| oclif | 4.x | CLI framework |
| better-sqlite3 | 11.x | SQLite driver |
| @anthropic-ai/claude-agent-sdk | 0.2.x | Claude Code subprocess management |
| zod | 3.x | Runtime validation |
| pino | 9.x | Logging |

## Project Structure

```
leslie/
├── packages/
│   ├── core/                # @vibe-x-ai/leslie-core - Core logic
│   │   ├── src/
│   │   │   ├── objective/   # Objective management
│   │   │   ├── thread/      # Thread lifecycle
│   │   │   ├── storage/     # SQLite + File system
│   │   │   └── acp/         # Agent Runner (SDK-based)
│   │   └── package.json
│   │
│   ├── cli/                 # @vibe-x-ai/leslie-cli - CLI commands
│   │   ├── src/commands/    # oclif commands
│   │   ├── bin/leslie       # Entry point
│   │   └── package.json
│   │
│   └── web/                 # @vibe-x-ai/leslie-web - Web UI (future)
│
├── .discuss/                # Design discussion documents
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## Design Decision Reference

Important design decisions are documented in the `.discuss/` directory:

### Architecture Design (D01-D26)
- `.discuss/2026-02-04/multi-thread-agent-orchestration/outline.md`

Key decisions:
| ID | Decision | Document |
|----|----------|----------|
| D01 | ~~ACP~~ → D29 Claude Agent SDK | decisions/D01-acp-protocol-selection.md |
| D29 | Claude Agent SDK replaces ACP | .discuss/2026-02-24/sdk-replaces-acp/decisions/D29-sdk-replaces-acp.md |
| D30 | SDK usage conventions | .discuss/2026-02-24/sdk-replaces-acp/decisions/D30-sdk-usage-conventions.md |
| D12-15 | CLI design specification | decisions/D12-15-cli-design.md |
| D22 | 🔴 Human-Agent Parity | decisions/D22-human-agent-parity.md |
| D23-26 | Objective/Thread model | outline.md |

### Tech Stack Selection (T01-T18)
- `.discuss/2026-02-04/tech-stack-implementation/outline.md`

## Code Conventions

### File Naming
- TypeScript files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### Directory Conventions
- One directory per feature module
- Entry file is `index.ts`
- Type definitions in `types.ts` or separate `types/` directory

### CLI Command Specification
Reference D12-15 decisions:
- Command format: `leslie <command> [options]`
- Output format: JSON (default)
- Error code prefix: T1xx (Thread), T2xx (Reference)...

## Common Tasks

### Initialize Project
```bash
pnpm install
pnpm build
```

### Development Mode
```bash
pnpm dev
```

### Run Tests
```bash
pnpm test
```

### Build
```bash
pnpm build
```

## Agent Work Guidelines

### Language Requirements
- **Code & Documentation**: Must be written in English
- **Agent Conversation Output**: Follow the user's language (respond in the same language the user uses)

### Before Modifying Code
1. Read relevant design decision documents (`.discuss/` directory)
2. Understand the Objective → Thread → Artifact hierarchy
3. Follow Human-Agent Parity principle: CLI doesn't distinguish whether caller is human or Agent

### Adding New Features
1. CLI commands go in `packages/cli/src/commands/`
2. Core logic goes in the appropriate module under `packages/core/src/`
3. Follow existing code style and patterns

### Storage Related
- Structured data → SQLite (`packages/core/src/storage/`)
- File artifacts → File system
- Use `better-sqlite3` synchronous API

### Claude Code Integration (D29 + D30)
- Leslie uses `@anthropic-ai/claude-agent-sdk` to spawn and manage Claude Code processes
- Each Thread corresponds to one `query()` call, single-turn mode
- `permissionMode: "default"` — all tool calls require user approval via `canUseTool`
- `settingSources: ["project"]` — load project settings (CLAUDE.md/AGENTS.md)
- `systemPrompt: { type: "preset", preset: "claude_code" }`
- Session resume via `options.resume` with `session_id` stored in ThreadInfo
- Streaming output via `AsyncGenerator<SDKMessage>`, transcript persisted to file

## Key Constraints

1. **Thread must belong to Objective**: No orphan Threads allowed
2. **Objective completion condition**: All Threads terminated
3. **Session recovery**: Implemented via context snapshot + replay
4. **Unified entry**: All Thread operations through CLI, Agent operates via CLI calls or Skills

## Troubleshooting

- **`Claude Code process exited with code 1` + "Not logged in · Please run /login"**: The SDK-spawned Claude Code subprocess requires the environment to be logged in (e.g. Cursor/Claude auth). Log in via the IDE (e.g. run `/login` in Cursor) or configure the auth method required by the SDK before running `leslie spawn`.

## External References

- [Claude Agent SDK (TypeScript)](https://github.com/anthropics/claude-agent-sdk-typescript)
- [oclif Documentation](https://oclif.io/)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

<leslie_system_guide version="2.0.0" description="Leslie Multi-Thread Agent Orchestration System Usage Guide">
<!-- ⚠️ This section is managed by Leslie. Do not edit manually. -->
<!-- To add custom agent guidelines, write OUTSIDE this block. -->

## Leslie Thread System

Leslie is a multi-thread Agent orchestration framework. Each Thread belongs to an Objective.
You are running inside a Leslie Thread. Your prompt starts with `<thread_context>` — parse it to understand your identity and available resources.

### Context You Receive

```xml
<thread_context thread="<thread-id>" objective="<objective-id>" relations_file=".leslie/thread_relations.json">
  <asset type="plan" path=".leslie/threads/<thread-id>/plan.md" />
  <ref thread="<referenced-thread-id>">
    <asset type="design" path=".leslie/threads/<referenced-thread-id>/design/" />
  </ref>
</thread_context>
```

### Asset Types

- **plan**: Task plan (`plan.md` or `plan/`)
- **progress**: Execution status (`progress.md`)
- **design**: Design docs (`design.md` or `design/`)
- **learnings**: Research notes (`learnings/`)
- **discuss**: Discussion docs (`discuss/`)
- **transcript**: Execution trace (`.meta/transcripts/*.txt`, CLI-generated)

### Agent Responsibilities

1. Parse `<thread_context>` to identify your thread ID, objective, and available assets
2. Create plan if missing
3. Update progress after major steps
4. Keep edits scoped to current thread assets
5. Read referenced assets as read-only

### Thread Operations

All operations use the `leslie` CLI. You call them via Bash — the same commands humans use.

#### spawn — Decompose into sub-threads

When your task is complex (multiple independent subtasks, parallel research, etc.), spawn child threads instead of doing everything yourself.

```bash
leslie spawn --intent "Research Redis caching strategies" \
  --objective <objective-id> \
  --parent <your-thread-id> \
  --inherit partial --scope "requirements"
```

When to spawn:
- Task has 2+ independent subtasks that benefit from separate context
- Need parallel exploration of different approaches
- Subtask requires clean context to avoid interference

When NOT to spawn:
- Task is simple and sequential
- Subtask depends heavily on your current context

#### reference — Share context between threads

```bash
leslie reference --from <your-thread-id> --target <other-thread-id> --binding frozen
```

Use when your thread needs to read another thread's assets (design docs, research notes, etc.).

#### lifecycle — Manage thread state

```bash
leslie lifecycle --thread <thread-id> --action done
leslie lifecycle --thread <thread-id> --action suspend --reason "Waiting for dependency"
leslie lifecycle --thread <thread-id> --action cancel --reason "No longer needed"
```

Mark your thread `done` when the task is complete. Leslie will also auto-mark it on successful exit.

#### transfer — Request human intervention

```bash
leslie transfer --thread <your-thread-id> \
  --direction request_approval --scope code_edit \
  --reason "Architecture decision needed: REST vs GraphQL"
```

Use when:
- You encounter a decision that requires human judgment
- You're blocked and need information only a human can provide
- The task exceeds your capability or confidence

#### inject — Receive runtime instructions

You don't call this yourself. Humans or the system use it to send you new constraints or information:

```bash
leslie inject --thread <thread-id> --type constraint --content "Must support TypeScript"
```

Check `.meta/injections.log` in your thread directory for injected instructions.

### Behavior Guidelines

1. **Read before act**: Always read your `<thread_context>` assets (especially plan and referenced designs) before starting work
2. **Plan first**: If no plan exists, create `plan.md` in your thread directory before coding
3. **Decompose proactively**: If the task involves 3+ distinct subtasks, consider spawning child threads
4. **Ask for help**: If uncertain about a decision, use `transfer --direction request_approval` rather than guessing
5. **Update progress**: Write `progress.md` after completing each major step
6. **Stay scoped**: Only modify files relevant to your thread's intent; don't drift into unrelated changes

### Thread Relations

**Storage Location**: `.leslie/thread_relations.json`

**Access**: File path is available in `<thread_context relations_file="...">`.

**Important**: Do NOT modify this file directly. All modifications must go through Leslie CLI.

</leslie_system_guide>

