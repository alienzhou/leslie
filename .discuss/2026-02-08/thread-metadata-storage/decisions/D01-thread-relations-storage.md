# D01: Thread Relations Storage Design

**Status**: ✅ Confirmed  
**Date**: 2026-02-08  
**Scope**: Leslie Thread Management

---

## Context

Leslie needs to store thread relationship information to support:
1. Visualization of thread relationships and dependencies
2. Context injection after compression (re-injecting dependent thread contexts)
3. Relationship queries and traversal (direct and indirect dependencies)

Expected data scale: Up to 100 threads.

---

## Decision

### Storage Solution: JSON File

**Chosen**: Use a single JSON file (`.leslie/thread_relations.json`) to store all thread metadata and relationship information.

**Rejected**: Relational databases (SQLite/PostgreSQL)

**Rationale**:
- YAGNI principle: 100 threads scale doesn't require a database
- Git-friendly: JSON files can be committed directly, diffs are human-readable
- Simple agent integration: Direct `json.load()`, no SQL library needed
- Clear migration path: Can upgrade to SQLite or PostgreSQL in the future if needed

---

## JSON Schema Design

```json
{
  "version": "1.0",
  "metadata": {
    "last_updated": "2026-02-08T16:00:00Z",
    "thread_count": 5
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
    }
  ],
  "relations": {
    "thread_abc123": {
      "children": ["thread_xyz789"],
      "references_to": [],
      "referenced_by": ["thread_xyz789"],
      "depends_on": []
    }
  }
}
```

### Schema Description

1. **`version`**: Schema version number for future upgrades
2. **`metadata`**: Meta information (last update time, thread count, etc.)
3. **`threads`**: Dictionary of thread basic information
   - `id`: Unique thread identifier
   - `title`: Thread title
   - `objective`: Thread objective (user-defined task description)
   - `created_at`: Creation timestamp (ISO 8601 format)
   - `status`: Thread status (`active` | `frozen` | `archived`)
   - `tags`: Tag array (optional, provided by agent when invoking CLI)
   - `parent_id`: Parent thread ID (spawn source, can be null)
   - `storage_path`: Thread storage path

4. **`operations`**: Operations history array (chronological order)
   - `id`: Unique operation identifier
   - `timestamp`: Operation timestamp (ISO 8601 format)
   - `command`: CLI command name (`spawn` | `reference` | `freeze` | etc.)
   - `operator`: Operator (`user` | `system` | `agent`)
   - `params`: Command parameters (different structure for different commands)

5. **`relations`**: Relationship cache (derived from operations)
   - `children`: Spawned child threads
   - `references_to`: Which threads' assets this thread references
   - `referenced_by`: Which threads reference this thread's assets
   - `depends_on`: Which threads this thread depends on (manually marked)

### Design Principles

- **`operations` is the source of truth**: Records all operation history for audit and replay
- **`relations` is a query cache**: Accelerates common queries, can be rebuilt from operations
- **Versioned**: `version` field supports future schema evolution
- **Rebuildable**: If `relations` becomes corrupted, it can be recalculated from `operations`

---

## Agent Integration

### 1. AGENTS.md Guidance

Add to the "Leslie System" section in AGENTS.md (see template: `.discuss/2026-02-04/claude-code-asset-management/templates/leslie-system-guide.md`):

**Thread Relations Section** (after "Cross-Thread Reference"):

```markdown
### Thread Relations

Leslie tracks relationships between Threads to support context management and dependency analysis.

**Storage Location**: `.leslie/thread_relations.json`

**Access**: The file path is provided in `<thread_context relations_file="...">` attribute.

**When to Query**:
- **Context recovery**: After context compression, determine which Threads' contexts to re-inject
- **Dependency analysis**: Understand Thread dependencies and relationships
- **Asset provenance**: Trace asset origins across Threads

**How to Query**:
Use the `thread-relations` skill to learn the JSON schema and query methods.

**Important**: Do NOT modify `.leslie/thread_relations.json` directly. All modifications are handled by Leslie CLI.
```

**Key Design Choices**:
- **Concise**: ~80 tokens, minimal context overhead
- **Pointer-based**: Agent discovers file path via `thread_context` attribute, then uses skill for details
- **Constraint-clear**: Explicitly forbids direct file modification

### 2. Thread Context Integration

Update `<thread_context>` XML format (see template: `.discuss/2026-02-04/claude-code-asset-management/templates/thread-context-format.md`):

Add `relations_file` attribute to root element:

```xml
<thread_context 
  thread="thread-abc123" 
  objective="obj-456"
  relations_file=".leslie/thread_relations.json">
  <!-- assets and refs -->
</thread_context>
```

**Rationale**: Agent can discover the relations file path without hardcoding, supporting future flexibility (e.g., per-objective relation files).

### 3. Skill: `thread-relations`

### 3. Skill: `thread-relations`

Create a read-only query skill containing:
- Complete JSON schema documentation
- Query example code (Python and JavaScript)
- Common query scenarios ("find all dependencies", "find parent thread", etc.)
- Guidance on when to read this file

**Important Constraints**: 
- Skill emphasizes this is read-only
- Agent **should NOT** directly modify this file
- All modifications are done by Leslie CLI (protected by file locks)

**Design Note**: Skill contains detailed implementation examples; AGENTS.md only points to skill to minimize context overhead.

---

### 4. Dynamic Query Approach

Agent dynamically writes query code based on current needs:

```python
# Example: Find all frozen threads
import json
data = json.load(open('.leslie/thread_relations.json'))
frozen = [t for t in data['threads'].values() 
          if t['status'] == 'frozen']
```

Benefits:
- No need to pre-implement all query functions
- Complex queries can be composed on the fly
- Agent can combine with other context for intelligent decisions

---

## Concurrency Handling

### File Lock Strategy

**CLI Write Operations** (Node.js/TypeScript):

```typescript
import * as lockfile from 'proper-lockfile';
import * as fs from 'fs/promises';

const LOCK_OPTIONS = {
  stale: 10000,  // Consider lock stale after 10s
  retries: {
    retries: 5,
    minTimeout: 100,
    maxTimeout: 1000
  }
};

async function writeThreadRelations(data: ThreadRelations): Promise<void> {
  const filePath = '.leslie/thread_relations.json';
  
  // Acquire exclusive lock
  const release = await lockfile.lock(filePath, LOCK_OPTIONS);
  
  try {
    // Write data
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } finally {
    // Always release lock
    await release();
  }
}
```

**Agent Read Operations**:
- Simplified approach: No lock (JSON file is small, reads are fast)
- Strict approach: Shared lock (allows multiple readers, blocks writes)

```typescript
async function readThreadRelations(): Promise<ThreadRelations> {
  const filePath = '.leslie/thread_relations.json';
  
  // Optional: Acquire shared lock
  // const release = await lockfile.lock(filePath, { ...LOCK_OPTIONS, shared: true });
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } finally {
    // if (release) await release();
  }
}
```

### Recommended NPM Package

**`proper-lockfile`** - Cross-platform, reliable file locking
- GitHub: https://github.com/moxystudio/node-proper-lockfile
- Weekly downloads: ~10M+
- Actively maintained
- Cross-platform (Linux, macOS, Windows)
- Features:
  - Stale lock detection
  - Configurable retry strategies
  - Shared/exclusive locks
  - Atomic operations

Installation:
```bash
npm install proper-lockfile
npm install @types/proper-lockfile --save-dev
```

---

## Dependency Tracking

### Source of Dependencies

**Manual Marking**: User explicitly declares dependencies via CLI

```bash
leslie spawn --parent thread_abc --objective "Fix bug" --depends-on thread_xyz
```

**Actual Mechanism**:
- CLI commands are generated by the agent (agent decides parameters)
- So effectively, the agent marks dependencies
- But formally, they are stored via CLI

**Source Chain**:
```
User Intent → Agent Reasoning → CLI Command → JSON Storage
```

---

## Tags Support

### Design

- **Field**: `tags` (optional array)
- **Source**: Provided by agent when invoking CLI
- **Required**: No (optional)
- **Usage**: Classification, filtering, visualization

### Example

```bash
# CLI command generated by agent
leslie spawn --parent thread_abc --objective "Fix auth bug" --tags bugfix,backend
```

```json
{
  "threads": {
    "thread_xyz": {
      "tags": ["bugfix", "backend"]
    }
  }
}
```

---

## Operations Granularity

**Granularity**: CLI command level

**Recorded Operation Types**:
- `spawn`: Create child thread
- `reference`: Reference another thread's asset
- `freeze`: Freeze thread
- `archive`: Archive thread
- `update`: Update thread information (e.g., title, objective)
- Other CLI commands...

**Not Recorded**:
- Internal asset creation/deletion within threads (recorded in transcript)
- Internal state changes within threads (recorded in thread_meta.json)
- Only cross-thread operations and relationship changes are recorded

---

## Consequences

### Positive

✅ **Simple**: No database dependency required  
✅ **Git-friendly**: File can be version controlled, diffs are readable  
✅ **Flexible**: Agent can dynamically write arbitrary query logic  
✅ **Maintainable**: Clear schema, easy to debug  
✅ **Extensible**: Can migrate to database in the future

### Negative

⚠️ **Concurrency risk**: Requires file locks to avoid conflicts  
⚠️ **Performance ceiling**: If exceeding 1000+ threads, optimization or migration needed  
⚠️ **Consistency**: Need to ensure JSON stays in sync with thread filesystem

### Mitigation

- Use file locks (`proper-lockfile` for Node.js)
- Performance is sufficient at 100 threads scale
- CLI is responsible for maintaining consistency (updates both JSON and filesystem atomically)

---

## Implementation Details

### File Location

- **Path**: `.leslie/thread_relations.json`
- **Location**: Project root (same level as `.leslie/` directory)
- **Encoding**: UTF-8
- **Format**: Indented JSON (2 spaces) for readability

### TypeScript Types

```typescript
interface ThreadRelations {
  version: string;
  metadata: {
    last_updated: string;  // ISO 8601 timestamp
    thread_count: number;
  };
  threads: {
    [threadId: string]: ThreadInfo;
  };
  operations: Operation[];
  relations: {
    [threadId: string]: RelationInfo;
  };
}

interface ThreadInfo {
  id: string;
  title: string;
  objective: string;
  created_at: string;  // ISO 8601 timestamp
  status: 'active' | 'frozen' | 'archived';
  tags?: string[];
  parent_id: string | null;
  storage_path: string;
}

interface Operation {
  id: string;
  timestamp: string;  // ISO 8601 timestamp
  command: string;
  operator: 'user' | 'system' | 'agent';
  params: Record<string, any>;
}

interface RelationInfo {
  children: string[];
  references_to: string[];
  referenced_by: string[];
  depends_on: string[];
}
```

---

## Related Decisions

- D06: Cross-Thread Reference (defines thread_ref format)
- D08-11: Frozen Snapshot (frozen thread snapshot mechanism)
- D23-26: Objective/Thread Model (conceptual model definition)

---

## Next Steps

1. **Create Skill**: `thread-relations` 
   - JSON schema documentation
   - Query example code
   - Common scenario guidance

2. **Implement CLI File Locks**:
   - Install and configure `proper-lockfile`
   - All write operations use exclusive locks
   - Error handling (lock timeout, corruption recovery)

3. **Update AGENTS.md**:
   - Add "Thread Relations" section
   - Point to `thread-relations` skill

4. **Initialize JSON File**:
   - CLI `init` command creates empty `thread_relations.json`
   - Include schema version and empty structure

5. **Create TypeScript Types**:
   - Define interfaces for type safety
   - Add JSON schema validation (optional)

---

**Version**: 1.0  
**Last Updated**: 2026-02-08
