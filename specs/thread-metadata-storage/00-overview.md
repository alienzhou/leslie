# Thread Metadata Storage Design

> **Version**: 1.0  
> **Status**: Design Complete  
> **Last Updated**: 2026-02-09

## 1. Background and Objectives

### 1.1 Background

Leslie needs to store thread relationship information to support:
1. Visualization of thread relationships and dependencies
2. Context injection after compression (re-injecting dependent thread contexts)
3. Relationship queries and traversal (direct and indirect dependencies)

Expected data scale: Up to 100 threads.

### 1.2 Core Objectives

1. **Simple Storage**: Use JSON file, not database
2. **Agent Integration**: Agent can read and query directly
3. **CLI Managed**: All writes through CLI with file locking
4. **Git-Friendly**: Human-readable, version-controllable

## 2. Storage Solution

### 2.1 Decision: JSON File

**Chosen**: Single JSON file (`.leslie/thread_relations.json`)

**Rejected**: Relational databases (SQLite/PostgreSQL)

**Rationale**:
- YAGNI principle: 100 threads scale doesn't require a database
- Git-friendly: JSON files can be committed, diffs are readable
- Simple agent integration: Direct file read, no SQL library needed
- Clear migration path: Can upgrade to SQLite if needed

### 2.2 File Location

| Property | Value |
|----------|-------|
| Path | `.leslie/thread_relations.json` |
| Location | Project root |
| Encoding | UTF-8 |
| Format | Indented JSON (2 spaces) |

## 3. Data Model

### 3.1 Top-Level Structure

| Section | Purpose |
|---------|---------|
| `version` | Schema version for future upgrades |
| `metadata` | Meta information (last update, count) |
| `threads` | Thread basic information dictionary |
| `operations` | Operations history (source of truth) |
| `relations` | Relationship cache (derived from operations) |

### 3.2 Thread Info Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique thread identifier |
| `title` | string | Thread title |
| `objective` | string | Thread objective |
| `created_at` | ISO 8601 | Creation timestamp |
| `status` | enum | `active` / `frozen` / `archived` |
| `tags` | string[] | Optional tags (from agent) |
| `parent_id` | string? | Parent thread ID (spawn source) |
| `storage_path` | string | Thread storage path |

### 3.3 Operation Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique operation identifier |
| `timestamp` | ISO 8601 | Operation timestamp |
| `command` | string | CLI command name |
| `operator` | enum | `user` / `system` / `agent` |
| `params` | object | Command parameters |

### 3.4 Relation Fields

| Field | Type | Description |
|-------|------|-------------|
| `children` | string[] | Spawned child threads |
| `references_to` | string[] | Threads this thread references |
| `referenced_by` | string[] | Threads referencing this thread |
| `depends_on` | string[] | Explicit dependencies |

## 4. Design Principles

1. **`operations` is the source of truth**: Records all operation history for audit and replay
2. **`relations` is a query cache**: Accelerates common queries, derived from operations
3. **Versioned**: `version` field supports schema evolution
4. **Rebuildable**: If `relations` corrupts, it can be rebuilt from `operations`

## 5. Concurrency Handling

### 5.1 Write Operations

| Aspect | Strategy |
|--------|----------|
| Locking | Exclusive file lock via `proper-lockfile` |
| Stale timeout | 10 seconds |
| Retry | Up to 5 times with backoff |

### 5.2 Read Operations

- No lock needed (reads are fast)
- Reads during writes may encounter partial data (acceptable for query use)

## 6. Agent Integration

### 6.1 Access Pattern

| Aspect | Description |
|--------|-------------|
| Discovery | File path in `<thread_context relations_file="...">` attribute |
| Permission | Read-only for Agents |
| Modification | All writes via Leslie CLI |

### 6.2 When to Query

| Scenario | Purpose |
|----------|---------|
| Context recovery | After compression, find dependent thread contexts to re-inject |
| Dependency analysis | Understand thread relationships before decisions |
| Asset provenance | Trace asset origins across threads |
| Status check | Find active/frozen/archived threads |

### 6.3 Skill: `thread-relations`

A read-only query skill providing:
- Complete JSON schema documentation
- Common query patterns (described, not coded)
- Guidance on when to read this file

## 7. Scope

### In Scope (MVP)
- JSON file storage with versioning
- Thread basic info and status
- Operations history
- Relations cache
- File locking for writes
- Skill for agent queries

### Out of Scope (Future)
- SQLite storage
- Real-time change notifications
- Automatic dependency inference

## 8. Related Documents

- [JSON Schema Specification](./01-json-schema.md)
- [Agent Query Guide](./02-agent-query-guide.md)
