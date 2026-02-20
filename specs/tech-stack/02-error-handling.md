# Error Handling Strategy

> **Decision ID**: D-ERROR  
> **Status**: ✅ Confirmed  
> **Last Updated**: 2026-02-09

## 1. Core Principle

> **Every error must be understandable by both humans AND Agents.**

Error codes are for categorization; natural language messages are for understanding.

## 2. Error Response Structure

**Decision**: All errors return both code and human-readable message

```typescript
interface CLIError {
  code: string;              // e.g., "T101"
  message: string;           // Natural language explanation (Agent-readable)
  details?: {                // Optional context
    threadId?: string;
    operation?: string;
    attempts?: number;
    [key: string]: unknown;
  };
}
```

**CLI Output Example**:
```
error code=T101 msg="Thread 'thread-xyz' not found. It may have been archived or the ID is incorrect." threadId=thread-xyz
```

**JSON Output Example** (for `--format json`):
```json
{
  "error": {
    "code": "T101",
    "message": "Thread 'thread-xyz' not found. It may have been archived or the ID is incorrect.",
    "details": {
      "threadId": "thread-xyz"
    }
  }
}
```

## 3. Error Code System

### 3.1 Error Code Prefixes

| Prefix | Module | Examples |
|--------|--------|----------|
| `T1xx` | Thread Lifecycle | T101: Thread not found, T102: Invalid state transition |
| `T2xx` | Reference | T201: Circular reference, T202: Target corrupted |
| `T3xx` | Merge | T301: Conflict unresolved, T302: Validation failed |
| `T4xx` | Transfer | T401: Approval timeout, T402: Permission denied |
| `T5xx` | Storage | T501: File lock failed, T502: JSON parse error |
| `T6xx` | Objective | T601: Objective not found, T602: All threads not terminated |
| `T9xx` | System | T901: Internal error, T902: Unknown error |

### 3.2 Standard Error Codes

| Code | Message Template | Recovery Hint |
|------|------------------|---------------|
| T101 | Thread '{id}' not found | Check thread ID or create new thread |
| T102 | Invalid state transition from {from} to {to} | Thread is in {current} state |
| T201 | Circular reference detected: {path} | Remove one of the references |
| T202 | Reference target '{id}' is corrupted | Target thread may have been deleted |
| T301 | Merge conflict: {count} conflicts unresolved | Use --conflict-strategy or resolve manually |
| T302 | Merge validation failed: {reason} | Fix the issues and retry |
| T401 | Approval timeout after {duration} | Retry with longer timeout |
| T402 | Permission denied for {operation} | Request approval first |
| T501 | File lock failed after {attempts} attempts | Another process may be writing |
| T502 | JSON parse error: {reason} | File may be corrupted |

## 4. Retry Mechanism

### 4.1 Exponential Backoff Retry

| Parameter | Value |
|-----------|-------|
| Max attempts | 10 |
| Initial interval | 100ms |
| Backoff multiplier | 2x |
| Max interval | 5000ms (5s) |

**Retry Timeline**:
```
Attempt 1: immediate
Attempt 2: after 100ms
Attempt 3: after 200ms
Attempt 4: after 400ms
Attempt 5: after 800ms
Attempt 6: after 1600ms
Attempt 7: after 3200ms
Attempt 8: after 5000ms (capped)
Attempt 9: after 5000ms
Attempt 10: after 5000ms
→ Total max wait: ~21.3 seconds
```

### 4.2 Retryable vs Non-Retryable Errors

**Retryable Errors**:

| Code | Condition |
|------|-----------|
| T501 | File lock contention |
| T502 | JSON parse error (try backup) |
| Network errors | ACP connection issues |

**Non-Retryable Errors**:

| Code | Reason |
|------|--------|
| T101 | Thread not found (won't appear by waiting) |
| T201 | Circular reference (logic error) |
| T402 | Permission denied (needs human action) |

## 5. Warning Handling

**Decision**: Warnings are NOT silent—they are returned in the response

**Rationale**: Agent needs to know about non-fatal issues to make informed decisions

**Warning Response Structure**:
```typescript
interface CLIResponse {
  success: boolean;
  data?: unknown;
  warnings?: Warning[];  // Non-fatal issues
  error?: CLIError;      // Fatal error (if success=false)
}

interface Warning {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}
```

**Warning Code Prefix**: `Wxxx` (same module numbering as errors)

**Example**:
```json
{
  "success": true,
  "data": { "refId": "ref-123" },
  "warnings": [
    {
      "code": "W202",
      "message": "Reference target 'thread-old' could not be resolved.",
      "context": { "target": "thread-old" }
    }
  ]
}
```

## 6. Conflict Resolution

### 6.1 Merge Conflict Strategy

**Flow**:
```
1. Detect conflict
   ↓
2. Ask human: "Allow Agent to attempt auto-resolution?"
   ↓
   ├── Yes → Agent attempts resolution
   │         ├── Success → Complete merge
   │         └── Failure → Escalate to human
   │
   └── No → Return conflict details for human resolution
```

**CLI Strategies**:

| Strategy | Behavior |
|----------|----------|
| `interactive` | Ask human for each conflict (default) |
| `agent-first` | Let Agent try first, escalate on failure |
| `human` | Always require human resolution |
| `strict` | Fail immediately on any conflict |

## 7. File Recovery

### 7.1 JSON File Protection

```
.leslie/
├── thread_relations.json       # Main file
├── thread_relations.json.bak   # Backup (before each write)
└── thread_relations.json.lock  # Lock file
```

### 7.2 Recovery Flow

```
1. Write operation starts
   ↓
2. Copy current → .bak
   ↓
3. Acquire lock
   ↓
4. Write new content
   ↓
5. Release lock

On parse error:
   ↓
1. Try to parse main file
   ↓
2. If failed, try .bak file
   ↓
3. If both failed, return T502 with recovery options
```

## 8. Implementation

### Retry Utility

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    multiplier?: number;
    retryableErrors?: string[];
  }
): Promise<T> {
  let delay = options.initialDelay ?? 100;
  let attempts = 0;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempts++;
      if (attempts >= (options.maxAttempts ?? 10)) {
        throw enhanceError(error, { attempts });
      }
      if (!isRetryable(error, options.retryableErrors)) {
        throw error;
      }
      await sleep(delay);
      delay = Math.min(delay * (options.multiplier ?? 2), options.maxDelay ?? 5000);
    }
  }
}
```

## 9. Related Documents

- [Logging System](./01-logging-system.md)
- [Overview](./00-overview.md)
