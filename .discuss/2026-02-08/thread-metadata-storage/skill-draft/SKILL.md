---
name: thread-relations
description: "Read-only skill for querying Leslie thread relationships. Use when you need to understand thread dependencies, find parent/child threads, or trace asset provenance across threads."
metadata:
  version: "1.0.0"
  author: "vibe-x-ai"
  category: "leslie-system"
---

# Thread Relations Query Skill

**Purpose**: Query thread relationships stored in `.leslie/thread_relations.json` to support context management, dependency analysis, and asset provenance tracking.

**Access Mode**: Read-only (All modifications via Leslie CLI)

---

## When to Use This Skill

Load this skill when you need to:

1. **Context Recovery After Compression**
   - Determine which threads' contexts to re-inject
   - Find dependencies that should be restored

2. **Dependency Analysis**
   - Find all threads that current thread depends on
   - Identify parent/child relationships
   - Trace dependency chains

3. **Asset Provenance**
   - Determine which thread created/shared an asset
   - Find all threads referencing a specific asset

4. **Relationship Visualization**
   - Generate thread relationship graphs
   - Build dependency trees

---

## Quick Start

### 1. Locate the File

The file path is provided in your `<thread_context relations_file="...">` attribute:

```python
relations_file = ".leslie/thread_relations.json"  # From thread_context
```

### 2. Load the Data

```python
import json
with open(relations_file, 'r') as f:
    data = json.load(f)
```

### 3. Basic Query Examples

**Find dependencies:**
```python
current_thread_id = "thread_abc123"
deps = data['relations'][current_thread_id]['depends_on']
```

**Find parent thread:**
```python
parent_id = data['threads'][current_thread_id]['parent_id']
```

**Find frozen threads:**
```python
frozen = [t for t in data['threads'].values() if t['status'] == 'frozen']
```

---

## Support Files

For detailed information, read these support files as needed:

### [schema.md](./references/schema.md)
Complete JSON schema documentation with all fields explained.

### [quick-reference.md](./references/quick-reference.md)
Fast query cheatsheet for common operations:
- Single-line queries (dependencies, parent, children, status, tags)
- Filter queries (frozen threads, by tag)
- Recursive dependency helper function
- Error handling with retries
- Both Python and JavaScript examples

### [patterns.md](./references/patterns.md)
Real-world query patterns with complete implementations:
- Context recovery after compression
- Dependency tree visualization
- Find all active work
- Impact analysis before freezing
- Thread timeline analysis
- Asset provenance tracing

---

## Important Constraints

**You MUST NOT**:
- ❌ Modify `.leslie/thread_relations.json` directly
- ❌ Add new threads or operations to the file

**All Modifications**:
- ✅ Must go through Leslie CLI commands
- ✅ CLI handles file locking and consistency

**File Access**:
- Read: No lock needed (safe for concurrent reads)
- If read fails, file may not exist yet (run `leslie init` first)

---

## Error Handling

Basic error handling:

```python
import json

try:
    with open('.leslie/thread_relations.json', 'r') as f:
        data = json.load(f)
except FileNotFoundError:
    print("Relations file not found. Run 'leslie init' first.")
except json.JSONDecodeError:
    print("Relations file corrupted. Contact user for recovery.")
```

For robust error handling with retry logic, see `quick-reference.md`.

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-08  
**Skill Type**: Read-only query
