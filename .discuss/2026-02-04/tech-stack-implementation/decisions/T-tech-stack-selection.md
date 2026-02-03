# T-tech-stack-selection: Leslie Tech Stack Selection

> Decision ID: T-tech-stack-selection
> Date: 2026-02-04
> Status: ✅ Confirmed
> Participants: alienzhou

## Background

Leslie is a Multi-thread Agent Orchestration framework that needs a defined tech stack to support MVP development.

## Decision Content

### 1. Language & Runtime

| Choice | Version | Rationale |
|--------|---------|-----------|
| TypeScript | 5.x | Type safety, mature ecosystem |
| Node.js | 22.x LTS | Latest LTS, performance optimizations |
| pnpm | 9.x | Monorepo workspace support |

### 2. Project Structure

**Monorepo Multi-package Architecture:**

| Package | Responsibility | Phase |
|---------|----------------|-------|
| `@vibe-x-ai/leslie-core` | Core logic (Objective, Thread, Storage, ACP Client) | MVP |
| `@vibe-x-ai/leslie-cli` | CLI commands, depends on core | MVP |
| `@vibe-x-ai/leslie-web` | Web UI | Future |

### 3. Core Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| oclif | 4.x | CLI framework, Salesforce open source, powerful plugin system |
| better-sqlite3 | 11.x | SQLite driver, sync API, excellent performance |
| zod | 3.x | Runtime type validation |
| pino | 9.x | High-performance logging library |

### 4. Storage Solution

| Layer | Technology | Purpose |
|-------|------------|---------|
| Structured storage | SQLite | Objective, Thread state, metadata |
| File storage | File system | Artifacts, context snapshot, extended configs |

### 5. Agent Integration

| Choice | Rationale |
|--------|-----------|
| Claude Code via ACP | Don't build custom Agent, focus on Thread orchestration |
| ACP Client only | Don't need ACP Server, Thread is runtime instruction |

## Rejected Options

| Option | Rejection Reason |
|--------|-----------------|
| Custom Agent kernel | Not for MVP, validate Thread orchestration value first |
| ACP Server mode | Thread primitives don't need to be exposed as service |
| sqlite3 (async) | Sync API is cleaner for CLI scenarios |

## Project Structure

> See [Architecture Discussion](../../multi-thread-agent-orchestration/outline.md) for detailed diagrams.

```
leslie/
├── packages/
│   ├── core/       # @vibe-x-ai/leslie-core
│   ├── cli/        # @vibe-x-ai/leslie-cli
│   └── web/        # @vibe-x-ai/leslie-web (future)
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── README.md
```

## Related Decisions

- [D01-acp-protocol-selection](../../multi-thread-agent-orchestration/decisions/D01-acp-protocol-selection.md) - ACP protocol selection
- [D12-15-cli-design](../../multi-thread-agent-orchestration/decisions/D12-15-cli-design.md) - CLI design specification
- [D23-D26](../../multi-thread-agent-orchestration/outline.md) - Objective/Thread model
