# Logging and Debugging System

> **Decision ID**: D-LOG  
> **Status**: ✅ Confirmed  
> **Last Updated**: 2026-02-09

## 1. Core Philosophy

> **All logs and debugging information must be preserved for system self-improvement, iteration, and optimization.**

Logging is not just for debugging—it's the foundation for:
- Self-improvement through pattern analysis
- Iterative refinement of Agent behavior
- Optimization based on historical data

## 2. Log Location

**Decision**: User home directory at `~/.leslie/logs/`

**Rationale**: 
- Project directory should not contain large amounts of logs
- User-level storage is standard for CLI tools
- Allows cross-project log aggregation

**Directory Structure**:

| Path | Purpose |
|------|---------|
| `~/.leslie/logs/` | Root log directory |
| `~/.leslie/logs/{objective-id}/` | Per-objective log directory |
| `~/.leslie/logs/{objective-id}/objective.log` | Objective-level events |
| `~/.leslie/logs/{objective-id}/{thread-id}.log` | Thread-specific logs |

## 3. Log Format

**Decision**: Use logfmt format instead of JSON

**Rationale**:
- Human-readable single-line format
- Easy to grep and filter
- Standard format with good tooling support

**Format Structure**:

```
time=<ISO8601> level=<level> threadId=<id> msg="<message>" [key=value...]
```

**Example Log Lines**:

```
time=2026-02-09T16:00:00.000Z level=info threadId=thread-abc msg="Thread spawned successfully" intent="Research Redis"
time=2026-02-09T16:00:02.000Z level=warn threadId=thread-abc msg="Reference target corrupted" target=thread-old
time=2026-02-09T16:00:03.000Z level=error threadId=thread-abc code=T501 msg="File lock failed" attempts=10
```

**Required Fields**:

| Field | Description |
|-------|-------------|
| `time` | ISO 8601 timestamp |
| `level` | Log level: `debug` / `info` / `warn` / `error` |
| `threadId` | Thread identifier |
| `msg` | Human-readable message |

**Note**: `objectiveId` is NOT included in log content because it's already in the directory path.

## 4. Log Levels

| Level | Usage | Default |
|-------|-------|---------|
| `debug` | Detailed internal operations | Disabled |
| `info` | Normal operations (spawn, lifecycle, reference) | ✅ Enabled |
| `warn` | Non-fatal issues (corrupted reference, retrying) | ✅ Enabled |
| `error` | Fatal issues (lock failed, operation aborted) | ✅ Enabled |

## 5. Debug Mode

**Activation Methods**:
- Environment variable: `LESLIE_DEBUG=1`
- CLI flag: `leslie --debug <command>`

**Effects**:
- Log level set to `debug`
- Additional context in error messages
- Stack traces included on errors

## 6. Log Retention

| Aspect | Policy |
|--------|--------|
| Retention | Indefinite (user manages cleanup) |
| Rotation | By Objective (natural separation) |
| Archival | Manual (user discretion) |

**Note**: Since logs are organized by Objective ID, completed Objectives can be manually archived or deleted by the user.

## 7. Output Abstraction for Future UI

**Decision**: Reserve abstraction layer for structured output protocol

**Rationale**: 
- CLI runs in foreground by default
- Future UI clients need standardized protocol
- Leave interface capability, defer implementation

**MVP Implementation**: 
- Direct console output + file logging
- JSON result output for CLI automation

**Future Extension Points**:
- WebSocket stream for live UI
- IPC for desktop client
- Event bus for plugins

## 8. CLI Commands

| Command | MVP Status | Description |
|---------|------------|-------------|
| `leslie logs` | ❌ Not in MVP | View logs for thread/objective |
| `leslie --debug` | ✅ MVP | Enable debug mode |
| `LESLIE_DEBUG=1` | ✅ MVP | Environment variable for debug |

## 9. Implementation Notes

**Logging Library**: pino (high-performance, logfmt-compatible)

**Key Behaviors**:
- Create log directory if not exists
- One log file per thread
- Append mode (don't overwrite)
- Flush on each write for reliability

## 10. Related Documents

- [Error Handling](./02-error-handling.md)
- [Overview](./00-overview.md)
