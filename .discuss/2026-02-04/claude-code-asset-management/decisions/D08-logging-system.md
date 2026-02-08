# D08: Logging System Design

**Status**: ✅ Confirmed  
**Decision Date**: 2026-02-08  
**Source**: Claude Code Asset Management Discussion

## Decision

Implement comprehensive multi-level logging system for debugging, troubleshooting, and operational monitoring.

## Scope Definition

### In Scope
✓ **System logs** for debugging and troubleshooting  
✓ **Multi-level logging** (ERROR/WARN/INFO/DEBUG/TRACE)  
✓ **Layered categories** by functional area  
✓ **File and console output**  

### Out of Scope
✗ **Audit logs** tracking who modified what (Git provides this)  
✗ **Complex audit trails** (over-engineering for MVP)  

## Logging Levels

| Level | Purpose | Examples |
|-------|---------|----------|
| **ERROR** | Critical failures | - ACP connection failed<br>- SQLite corruption<br>- Asset generation crash |
| **WARN** | Non-blocking issues | - Referenced Thread not found<br>- File size exceeds recommendation |
| **INFO** | High-level events | - Thread spawned<br>- Asset generated<br>- Command executed |
| **DEBUG** | Detailed trace | - Parsing XML<br>- Loading config<br>- Query execution timing |
| **TRACE** | Extremely verbose | - Function entry/exit<br>- Variable values |

**Default Levels**:
- Production: INFO
- Development: DEBUG
- Testing: WARN

## Log Categories (Tags)

Organize by functional area:

```
[CLI] User executed command: leslie spawn
[ACP] Connected to session: sess_abc123
[Storage] Writing to SQLite: INSERT INTO threads...
[Context] Injecting thread_context for thread-123
[Asset] Generating transcript file
[Config] Loaded configuration
```

**Categories**:
- `[CLI]` - Command-line operations
- `[ACP]` - Protocol communication
- `[Storage]` - Database operations
- `[Context]` - Context management
- `[Asset]` - Asset generation
- `[Config]` - Configuration
- `[Thread]` - Thread lifecycle
- `[Objective]` - Objective management

## Log Output Destinations

### Console (stdout/stderr)

**Format**: Human-readable with colors

```
✓ Thread spawned: thread-abc123
⚠ Warning: Referenced thread not found
✗ Error: Failed to connect to ACP
```

**Colors**:
- ✓ Green: Success (INFO)
- ⚠ Yellow: Warning (WARN)
- ✗ Red: Error (ERROR)

### File Logs

**Location**: `.leslie/logs/`

**Files**:
```
.leslie/logs/
├── leslie.log              # Current log (rotated daily)
├── leslie-20260208.log     # Archived logs
└── error.log               # ERROR level only (permanent)
```

**Rotation**:
- Daily rotation
- Keep last 30 days
- Error log never auto-deleted

**Format**: Structured for parsing
```
2026-02-08T14:30:00.123+08:00 INFO [CLI] Command: leslie spawn
2026-02-08T14:30:02.012+08:00 ERROR [ACP] Connection failed
```

**Format Spec**: `{ISO_TIMESTAMP} {LEVEL} [{CATEGORY}] {MESSAGE}`

### Structured Logs (Optional)

**Format**: JSON Lines (.jsonl) in `.leslie/logs/structured/`

**Rationale**: Optional for MVP, future-ready for log aggregation tools

## Logging Best Practices

### What to Log

**DO Log**:
- Command executions
- Thread lifecycle events
- ACP connection events
- Asset operations
- Configuration changes
- Errors with stack traces
- Performance metrics

**DON'T Log**:
- Sensitive data (API keys, credentials)
- Full file contents (use checksums)
- Personal information

### Error Messages

Include:
1. What failed
2. Why it failed
3. How to fix
4. Stack trace (in DEBUG mode)

### Performance Logging

Log duration for key operations:

```
[CLI] Command 'leslie spawn' completed in 1.2s
[ACP] Session creation took 450ms
```

**Units**:
- < 1000ms: milliseconds (`450ms`)
- ≥ 1000ms: seconds (`1.2s`)
- ≥ 60s: minutes + seconds (`2m 15s`)

## Configuration

### Config File

```yaml
# .leslie/config.yml
logging:
  level: INFO              # ERROR | WARN | INFO | DEBUG | TRACE
  console: true
  file: true
  rotation_days: 30
  structured: false        # JSON logs (optional)
  categories:              # Per-category override
    ACP: DEBUG
    Storage: WARN
```

### Environment Variables

```bash
LESLIE_LOG_LEVEL=DEBUG leslie spawn
LESLIE_LOG_FILE=false leslie spawn
```

## Related Decisions

| Decision | Relationship |
|----------|-------------|
| D01 Asset Management | Logs track asset operations |
| D02 AGENTS.md Init | Log init process for debugging |

---
← [Back to outline](../outline.md)
