# JSON Schema Specification

> **Decision ID**: D01  
> **Status**: ✅ Confirmed  
> **Last Updated**: 2026-02-09

## 1. Schema Example

The following is a representative example of the JSON structure (not a complete implementation):

```json
{
  "version": "1.0",
  "metadata": {
    "last_updated": "2026-02-08T16:00:00Z",
    "thread_count": 5
  },
  "threads": {
    "<thread-id>": {
      "id": "<thread-id>",
      "title": "...",
      "objective": "...",
      "status": "active | frozen | archived",
      "parent_id": "<parent-id> | null",
      "...": "..."
    }
  },
  "operations": [
    {
      "id": "<op-id>",
      "command": "spawn | reference | freeze | ...",
      "operator": "user | system | agent",
      "params": { "...": "..." }
    }
  ],
  "relations": {
    "<thread-id>": {
      "children": ["..."],
      "references_to": ["..."],
      "referenced_by": ["..."],
      "depends_on": ["..."]
    }
  }
}
```

## 2. Field Specifications

### 2.1 Root Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | ✅ | Schema version (semver format) |
| `metadata` | object | ✅ | File metadata |
| `threads` | object | ✅ | Thread info dictionary, keyed by thread ID |
| `operations` | array | ✅ | Operations history |
| `relations` | object | ✅ | Relationship cache, keyed by thread ID |

### 2.2 Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `last_updated` | string | ✅ | ISO 8601 timestamp of last modification |
| `thread_count` | number | ✅ | Total number of threads |

### 2.3 Thread Info Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique thread identifier |
| `title` | string | ✅ | Human-readable title |
| `objective` | string | ✅ | Thread objective/goal |
| `created_at` | string | ✅ | ISO 8601 creation timestamp |
| `status` | enum | ✅ | One of: `active`, `frozen`, `archived` |
| `tags` | string[] | No | Classification tags |
| `parent_id` | string? | ✅ | Parent thread ID, null if root thread |
| `storage_path` | string | ✅ | Thread directory path |

### 2.4 Operation Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique operation ID |
| `timestamp` | string | ✅ | ISO 8601 timestamp |
| `command` | string | ✅ | CLI command name |
| `operator` | enum | ✅ | One of: `user`, `system`, `agent` |
| `params` | object | ✅ | Command-specific parameters |

### 2.5 Relation Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `children` | string[] | ✅ | IDs of spawned child threads |
| `references_to` | string[] | ✅ | IDs of referenced threads |
| `referenced_by` | string[] | ✅ | IDs of threads that reference this |
| `depends_on` | string[] | ✅ | IDs of explicit dependencies |

## 3. Operation Types

| Command | Description | Key Params |
|---------|-------------|------------|
| `spawn` | Create child thread | `parent_id`, `child_id`, `objective` |
| `reference` | Reference another thread's asset | `from_id`, `to_id`, `asset_path` |
| `freeze` | Freeze thread (make read-only) | `thread_id` |
| `archive` | Archive thread | `thread_id` |
| `update` | Update thread info | `thread_id`, updated fields |

## 4. Status Values and Transitions

| Status | Description | Allowed Transitions |
|--------|-------------|---------------------|
| `active` | Thread is active and editable | → `frozen`, `archived` |
| `frozen` | Thread is frozen (read-only) | → `archived` |
| `archived` | Thread is archived | (terminal state) |

## 5. Validation Rules

| Rule | Description |
|------|-------------|
| **Version format** | Must be valid semver string |
| **Timestamps** | Must be valid ISO 8601 format |
| **Thread ID uniqueness** | IDs must be unique within `threads` |
| **Thread ID format** | Alphanumeric with hyphens/underscores |
| **Status values** | Must be one of defined enum values |
| **Parent-child consistency** | If A lists B in `children`, B must have A as `parent_id` |
| **Reference consistency** | If A lists B in `references_to`, B must list A in `referenced_by` |

## 6. Schema Evolution

When schema changes are needed:

| Change Type | Version Bump | Migration Strategy |
|-------------|--------------|-------------------|
| New optional field | PATCH | Backward compatible, no migration |
| New required field | MINOR | Provide default value |
| Field removal | MAJOR | Migration script required |
| Structure change | MAJOR | Migration script required |

## 7. Related Documents

- [Overview](./00-overview.md)
- [Agent Query Guide](./02-agent-query-guide.md)
