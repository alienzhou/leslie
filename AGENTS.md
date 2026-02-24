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

## External References

- [Claude Agent SDK (TypeScript)](https://github.com/anthropics/claude-agent-sdk-typescript)
- [oclif Documentation](https://oclif.io/)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
