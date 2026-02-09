# D-LOG: Logging and Debugging System

> Status: ✅ Confirmed
> Decision Date: 2026-02-09

## Core Philosophy

> **All logs and debugging information must be preserved for system self-improvement, iteration, and optimization.**

Logging is not just for debugging—it's the foundation for:
- Self-improvement through pattern analysis
- Iterative refinement of Agent behavior
- Optimization based on historical data

---

## Design Decisions

### LOG-01: Log Location

**Decision**: User home directory at `~/.leslie/logs/`

**Rationale**: 
- Project directory should not contain large amounts of logs
- User-level storage is standard for CLI tools
- Allows cross-project log aggregation

**Structure**:
```
~/.leslie/
└── logs/
    └── [objective-id]/           # One directory per Objective
        ├── objective.log         # Objective-level events
        ├── thread-abc.log        # Thread-specific logs
        ├── thread-def.log
        └── ...
```

---

### LOG-02: Log Format

**Decision**: Use logfmt format instead of JSON

**Rationale**:
- Human-readable single-line format
- Easy to grep and filter
- Standard format with good tooling support

**Format Example**:
```
time=2026-02-09T16:00:00.000Z level=info threadId=thread-abc msg="Thread spawned successfully" intent="Research Redis"
time=2026-02-09T16:00:01.000Z level=debug threadId=thread-abc msg="Reference created" target=thread-xyz binding=frozen
time=2026-02-09T16:00:02.000Z level=warn threadId=thread-abc msg="Reference target corrupted" target=thread-old reason="file not found"
time=2026-02-09T16:00:03.000Z level=error threadId=thread-abc code=T501 msg="File lock failed after max retries" attempts=10
```

**Fields**:
| Field | Required | Description |
|-------|----------|-------------|
| `time` | ✅ | ISO 8601 timestamp |
| `level` | ✅ | `debug` / `info` / `warn` / `error` |
| `threadId` | ✅ | Thread identifier |
| `msg` | ✅ | Human-readable message |
| `*` | Optional | Additional context fields |

**Note**: `objectiveId` is NOT included in log content because it's already in the directory path.

---

### LOG-03: Log Levels

| Level | Usage |
|-------|-------|
| `debug` | Detailed internal operations (disabled by default) |
| `info` | Normal operations (spawn, lifecycle, reference, etc.) |
| `warn` | Non-fatal issues (corrupted reference, retrying) |
| `error` | Fatal issues (lock failed, operation aborted) |

**Default Level**: 
- Normal mode: `info`
- Debug mode: `debug`

---

### LOG-04: Debug Mode

**Activation**:
```bash
LESLIE_DEBUG=1 leslie spawn ...
# or
leslie --debug spawn ...
```

**Effect**:
- Log level set to `debug`
- Additional context in error messages
- Stack traces included on errors

---

### LOG-05: Log Retention

| Aspect | Policy |
|--------|--------|
| Retention | Indefinite (user manages cleanup) |
| Rotation | By Objective (natural separation) |
| Archival | Manual (user discretion) |

**Note**: Since logs are organized by Objective ID, completed Objectives can be manually archived or deleted by the user.

---

### LOG-06: Output Abstraction for Future UI

**Decision**: Reserve abstraction layer for structured output protocol

**Rationale**: 
- CLI runs in foreground by default, outputting structured content
- Future UI clients (terminal, web, desktop) need standardized protocol
- Leave interface capability, defer implementation

**Abstraction Interface** (not implemented in MVP):
```typescript
interface OutputChannel {
  // Log events (goes to both console and file)
  log(level: Level, msg: string, context?: Record<string, unknown>): void;
  
  // Progress events (for UI rendering)
  progress(event: ProgressEvent): void;
  
  // Structured result (for machine consumption)
  result(data: unknown): void;
}

interface ProgressEvent {
  type: 'thread_spawned' | 'thread_completed' | 'artifact_created' | ...;
  threadId: string;
  data: unknown;
}
```

**MVP Implementation**: 
- Direct console output + file logging
- JSON result output for CLI automation

**Future Extension Points**:
- WebSocket stream for live UI
- IPC for desktop client
- Event bus for plugins

---

### LOG-07: CLI Commands (MVP Scope)

| Command | MVP Status | Description |
|---------|------------|-------------|
| `leslie logs` | ❌ Not in MVP | View logs for thread/objective |
| `leslie --debug` | ✅ MVP | Enable debug mode |
| `LESLIE_DEBUG=1` | ✅ MVP | Environment variable for debug |

---

## Implementation Notes

### Logging Library

Use `pino` with custom logfmt formatter:

```typescript
import pino from 'pino';

const logger = pino({
  formatters: {
    log: (obj) => {
      // Convert to logfmt style
      return obj;
    }
  },
  transport: {
    targets: [
      { target: 'pino-pretty', level: 'info' },  // Console
      { target: './logfmt-file', level: 'debug' } // File
    ]
  }
});
```

### Thread Logger Factory

```typescript
function createThreadLogger(objectiveId: string, threadId: string) {
  const logDir = path.join(os.homedir(), '.leslie', 'logs', objectiveId);
  const logFile = path.join(logDir, `${threadId}.log`);
  
  return pino({
    level: process.env.LESLIE_DEBUG ? 'debug' : 'info'
  }, pino.destination(logFile));
}
```

---

## Related Decisions

- [D-ERROR: Error Handling](./D-error-handling.md) - Error codes and retry mechanisms
- [T05: JSON Storage](../outline.md) - Storage layer decisions

---
← [Back to outline](../outline.md)
