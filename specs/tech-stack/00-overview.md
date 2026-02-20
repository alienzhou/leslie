# Leslie Tech Stack & Implementation

> **Version**: 1.0  
> **Status**: Design Complete  
> **Last Updated**: 2026-02-09

## 1. Background and Objectives

### 1.1 Background

Leslie is a Multi-thread Agent Orchestration framework that needs a well-defined tech stack to support MVP development. The focus is on rapid validation of the Thread orchestration concept.

### 1.2 Core Objectives

1. **Rapid Development**: Use mature, familiar technologies
2. **Easy Distribution**: Publish as npm package for easy installation
3. **Agent Integration**: Seamless connection with Claude Code via ACP
4. **Extensibility**: Support future expansion to web/desktop

## 2. Technology Selection

### 2.1 Language & Runtime

| Choice | Version | Rationale |
|--------|---------|-----------|
| TypeScript | 5.x | Type safety, mature ecosystem |
| Node.js | 22.x LTS | Latest LTS, performance optimizations |
| pnpm | 9.x | Monorepo workspace support |

### 2.2 Project Structure

**Monorepo Multi-package Architecture:**

| Package | Responsibility | Phase |
|---------|----------------|-------|
| `@vibe-x-ai/leslie-core` | Core logic (Objective, Thread, Storage, ACP Client) | MVP |
| `@vibe-x-ai/leslie-cli` | CLI commands, depends on core | MVP |
| `@vibe-x-ai/leslie-web` | Web UI | Future |

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

### 2.3 Core Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| oclif | 4.x | CLI framework, Salesforce open source |
| zod | 3.x | Runtime type validation |
| pino | 9.x | High-performance logging library |
| proper-lockfile | latest | File locking for JSON storage |

### 2.4 Storage Layer

| Layer | Technology | Purpose |
|-------|------------|---------|
| Metadata storage | JSON file | Thread relations, lightweight state |
| File storage | File system | Artifacts, context snapshots |

**Note**: SQLite was considered but deemed over-engineering for MVP. JSON file is sufficient for up to 100 threads.

### 2.5 Agent Integration

| Choice | Rationale |
|--------|-----------|
| Claude Code via ACP | Don't build custom Agent, focus on Thread orchestration |
| ACP Client only | Don't need ACP Server, Thread is runtime instruction |

## 3. CLI Design

### 3.1 Command Style

```bash
leslie <command> [options]
```

Examples:
- `leslie spawn --intent "Research caching"`
- `leslie list --status active`
- `leslie lifecycle thread-abc done`

### 3.2 Output Format

- Default: JSON (machine-readable for Agent)
- Optional: `--format table` for human-readable
- Errors: JSON with error code and message

## 4. Error Handling Strategy

### 4.1 Error Response Structure

```typescript
interface CLIError {
  code: string;              // e.g., "T101"
  message: string;           // Natural language explanation
  details?: {
    threadId?: string;
    operation?: string;
    attempts?: number;
    [key: string]: unknown;
  };
}
```

### 4.2 Error Code Prefixes

| Prefix | Module | Examples |
|--------|--------|----------|
| `T1xx` | Thread Lifecycle | T101: Thread not found |
| `T2xx` | Reference | T201: Circular reference |
| `T3xx` | Merge | T301: Conflict unresolved |
| `T4xx` | Transfer | T401: Approval timeout |
| `T5xx` | Storage | T501: File lock failed |
| `T6xx` | Objective | T601: Objective not found |
| `T9xx` | System | T901: Internal error |

### 4.3 Retry Mechanism

**Exponential backoff** for transient failures:

| Parameter | Value |
|-----------|-------|
| Max attempts | 10 |
| Initial interval | 100ms |
| Backoff multiplier | 2x |
| Max interval | 5000ms |

## 5. Logging System

### 5.1 Log Location

User home directory: `~/.leslie/logs/`

```
~/.leslie/
└── logs/
    └── [objective-id]/
        ├── objective.log
        ├── thread-abc.log
        └── thread-def.log
```

### 5.2 Log Format

**logfmt** format (human-readable, grep-friendly):

```
time=2026-02-09T16:00:00.000Z level=info threadId=thread-abc msg="Thread spawned"
time=2026-02-09T16:00:01.000Z level=error threadId=thread-abc code=T501 msg="File lock failed"
```

### 5.3 Log Levels

| Level | Usage |
|-------|-------|
| `debug` | Detailed internal operations (disabled by default) |
| `info` | Normal operations |
| `warn` | Non-fatal issues |
| `error` | Fatal issues |

### 5.4 Debug Mode

```bash
LESLIE_DEBUG=1 leslie spawn ...
# or
leslie --debug spawn ...
```

## 6. Scope

### In Scope (MVP)
- Monorepo setup with pnpm workspace
- Core package with Thread management
- CLI package with oclif
- JSON file storage
- ACP Client integration
- Logging with pino
- Error handling with retry

### Out of Scope (Future)
- Custom Agent kernel
- SQLite storage
- Web UI
- Desktop application
- ACP Server mode

## 7. Related Documents

- [Logging System](./01-logging-system.md)
- [Error Handling](./02-error-handling.md)
- [Dependency Selection](./03-dependencies.md)
