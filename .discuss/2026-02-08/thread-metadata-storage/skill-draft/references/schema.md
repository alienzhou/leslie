# JSON Schema Reference

Complete schema documentation for `.leslie/thread_relations.json`.

---

## Root Structure

```json
{
  "version": "1.0",
  "metadata": { ... },
  "threads": { ... },
  "operations": [ ... ],
  "relations": { ... }
}
```

---

## Field: `version`

- **Type**: String
- **Purpose**: Schema version for compatibility checking
- **Current**: `"1.0"`

---

## Field: `metadata`

```json
{
  "last_updated": "2026-02-08T16:00:00Z",  // ISO 8601 timestamp
  "thread_count": 5                         // Total number of threads
}
```

---

## Field: `threads`

Dictionary mapping thread IDs to thread information:

```json
{
  "thread_abc123": {
    "id": "thread_abc123",
    "title": "Implement login feature",
    "objective": "Build secure OAuth2 login flow",
    "created_at": "2026-02-08T15:30:00Z",   // ISO 8601
    "status": "active",                      // "active" | "frozen" | "archived"
    "tags": ["backend", "auth"],            // Optional array
    "parent_id": null,                       // Parent thread ID or null
    "storage_path": ".leslie/threads/thread_abc123/"
  }
}
```

### Thread Status Values

- `active`: Currently active thread
- `frozen`: Frozen/paused thread (snapshot preserved)
- `archived`: Completed/archived thread

---

## Field: `operations`

Array of operations in chronological order:

```json
[
  {
    "id": "op_001",
    "timestamp": "2026-02-08T15:35:00Z",
    "command": "spawn",
    "operator": "user",
    "params": {
      "parent_id": "thread_abc123",
      "child_id": "thread_xyz789",
      "objective": "Fix bug in login",
      "shared_assets": ["asset_001"]
    }
  }
]
```

### Operation Types (command field)

- `spawn`: Create child thread
- `reference`: Reference another thread's assets
- `freeze`: Freeze thread
- `archive`: Archive thread
- `update`: Update thread metadata

### Operator Values

- `user`: Manual user action
- `agent`: Agent-initiated action
- `system`: Automatic system action

---

## Field: `relations`

Dictionary mapping thread IDs to relationship info (derived from operations):

```json
{
  "thread_abc123": {
    "children": ["thread_xyz789"],           // Spawned child threads
    "references_to": [],                     // Threads whose assets this thread references
    "referenced_by": ["thread_xyz789"],      // Threads that reference this thread's assets
    "depends_on": []                         // Threads this thread depends on (manually marked)
  }
}
```

**Note**: `relations` is a cache derived from `operations`. If corrupted, it can be rebuilt from operation history.

---

## Complete Example

```json
{
  "version": "1.0",
  "metadata": {
    "last_updated": "2026-02-08T16:00:00Z",
    "thread_count": 2
  },
  "threads": {
    "thread_abc123": {
      "id": "thread_abc123",
      "title": "Implement login feature",
      "objective": "Build secure OAuth2 login flow",
      "created_at": "2026-02-08T15:30:00Z",
      "status": "active",
      "tags": ["backend", "auth"],
      "parent_id": null,
      "storage_path": ".leslie/threads/thread_abc123/"
    },
    "thread_xyz789": {
      "id": "thread_xyz789",
      "title": "Fix login bug",
      "objective": "Fix OAuth redirect issue",
      "created_at": "2026-02-08T15:35:00Z",
      "status": "frozen",
      "tags": ["bugfix"],
      "parent_id": "thread_abc123",
      "storage_path": ".leslie/threads/thread_xyz789/"
    }
  },
  "operations": [
    {
      "id": "op_001",
      "timestamp": "2026-02-08T15:35:00Z",
      "command": "spawn",
      "operator": "user",
      "params": {
        "parent_id": "thread_abc123",
        "child_id": "thread_xyz789",
        "objective": "Fix bug in login",
        "shared_assets": ["asset_001"]
      }
    },
    {
      "id": "op_002",
      "timestamp": "2026-02-08T16:00:00Z",
      "command": "freeze",
      "operator": "agent",
      "params": {
        "thread_id": "thread_xyz789",
        "reason": "Bug fixed"
      }
    }
  ],
  "relations": {
    "thread_abc123": {
      "children": ["thread_xyz789"],
      "references_to": [],
      "referenced_by": [],
      "depends_on": []
    },
    "thread_xyz789": {
      "children": [],
      "references_to": ["thread_abc123"],
      "referenced_by": [],
      "depends_on": ["thread_abc123"]
    }
  }
}
```
