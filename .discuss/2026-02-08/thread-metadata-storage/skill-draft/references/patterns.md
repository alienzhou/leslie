# Common Query Patterns

Real-world scenarios for thread relations queries. Uses helper functions from [quick-reference.md](./quick-reference.md).

---

## Pattern 1: Context Recovery After Compression

**Scenario**: Context window was compressed, need to re-inject dependent threads.

**Implementation**:

```python
import json

# Load relations
data = json.load(open('.leslie/thread_relations.json'))

# Get current thread ID from thread_context
current_thread_id = "thread_xyz789"

# Find all dependencies (use get_all_dependencies from quick-reference.md)
all_deps = get_all_dependencies(current_thread_id, data)

# For each dependency, check if it's frozen (might need re-injection)
for dep_id in all_deps:
    dep_info = data['threads'][dep_id]
    if dep_info['status'] == 'frozen':
        print(f"Need to re-inject frozen thread: {dep_id}")
        print(f"  Title: {dep_info['title']}")
        print(f"  Storage path: {dep_info['storage_path']}")
```

**Use Case**:
- After context compression, agent needs to restore dependent thread contexts
- Prioritize frozen threads (they contain finalized knowledge)
- Read from storage_path to get thread's assets

---

## Pattern 2: Dependency Tree Visualization

**Scenario**: Generate a tree view of thread dependencies.

**Implementation**:

```python
def print_dependency_tree(thread_id, data, indent=0, visited=None):
    """Recursively print dependency tree."""
    if visited is None:
        visited = set()
    
    if thread_id in visited:
        print("  " * indent + f"├─ {thread_id}: [CIRCULAR REFERENCE]")
        return
    
    visited.add(thread_id)
    
    thread = data['threads'][thread_id]
    status_icon = "✓" if thread['status'] == 'frozen' else "●"
    print("  " * indent + f"├─ {status_icon} {thread_id}: {thread['title']}")
    
    deps = data['relations'][thread_id]['depends_on']
    for dep_id in deps:
        if dep_id in data['threads']:
            print_dependency_tree(dep_id, data, indent + 1, visited)

# Usage
current_thread_id = "thread_abc123"
print(f"Dependency tree for {current_thread_id}:")
print_dependency_tree(current_thread_id, data)
```

**Output Example**:
```
Dependency tree for thread_abc123:
├─ ● thread_abc123: Implement login feature
  ├─ ✓ thread_xyz789: Fix login bug
    ├─ ✓ thread_def456: Update OAuth library
```

**Use Case**:
- Understand thread hierarchy before making changes
- Identify critical path dependencies
- Visualize project structure

---

## Pattern 3: Find All Active Work

**Scenario**: List all active threads (exclude frozen/archived) to understand current workload.

**Implementation**:

```python
active_threads = [
    thread for thread in data['threads'].values()
    if thread['status'] == 'active'
]

print(f"Active threads ({len(active_threads)}):")
for thread in active_threads:
    print(f"\n  Thread: {thread['id']}")
    print(f"  Title: {thread['title']}")
    print(f"  Created: {thread['created_at']}")
    
    if thread.get('tags'):
        print(f"  Tags: {', '.join(thread['tags'])}")
    
    # Show dependencies
    deps = data['relations'][thread['id']]['depends_on']
    if deps:
        print(f"  Depends on: {', '.join(deps)}")
    
    # Show children
    children = data['relations'][thread['id']]['children']
    if children:
        print(f"  Has {len(children)} child thread(s)")
```

**Output Example**:
```
Active threads (2):

  Thread: thread_abc123
  Title: Implement login feature
  Created: 2026-02-08T15:30:00Z
  Tags: backend, auth
  Has 1 child thread(s)

  Thread: thread_ghi012
  Title: Build user dashboard
  Created: 2026-02-08T16:00:00Z
  Tags: frontend, ui
  Depends on: thread_abc123
```

**Use Case**:
- Daily standup: what's currently in progress
- Identify orphaned threads (no dependencies, no children)
- Resource allocation planning

---

## Pattern 4: Impact Analysis

**Scenario**: Before freezing/archiving a thread, find all threads that depend on it.

**Implementation**:

```python
def find_impact(thread_id, data):
    """Find all threads that would be affected if this thread changes."""
    
    # Direct impact: threads that reference this thread
    direct_refs = data['relations'][thread_id]['referenced_by']
    
    # Direct impact: children threads
    children = data['relations'][thread_id]['children']
    
    # Indirect impact: threads that depend on referencing threads
    indirect_refs = []
    for ref_id in direct_refs:
        if ref_id in data['relations']:
            indirect_refs.extend(data['relations'][ref_id]['referenced_by'])
    
    return {
        'direct_references': direct_refs,
        'children': children,
        'indirect_references': list(set(indirect_refs) - set(direct_refs))
    }

# Usage
thread_id = "thread_abc123"
impact = find_impact(thread_id, data)

print(f"Impact analysis for {thread_id}:")
print(f"  Direct references: {len(impact['direct_references'])} threads")
print(f"  Child threads: {len(impact['children'])} threads")
print(f"  Indirect references: {len(impact['indirect_references'])} threads")

if impact['direct_references'] or impact['children']:
    print("\n⚠️ Warning: Other threads depend on this thread")
```

**Use Case**:
- Before freezing a thread, ensure dependent threads are aware
- Before modifying shared assets, understand impact scope
- Risk assessment for architectural changes

---

## Pattern 5: Thread Timeline Analysis

**Scenario**: Understand project evolution over time.

**Implementation**:

```python
from datetime import datetime

# Sort threads by creation time
threads_by_time = sorted(
    data['threads'].values(),
    key=lambda t: datetime.fromisoformat(t['created_at'].replace('Z', '+00:00'))
)

print("Thread creation timeline:")
for thread in threads_by_time:
    # Parse timestamp
    created = datetime.fromisoformat(thread['created_at'].replace('Z', '+00:00'))
    
    # Determine thread type
    is_root = thread['parent_id'] is None
    thread_type = "Root" if is_root else "Child"
    
    print(f"\n  {created.strftime('%Y-%m-%d %H:%M')} - {thread_type}")
    print(f"  {thread['id']}: {thread['title']}")
    print(f"  Status: {thread['status']}")
    
    if thread.get('tags'):
        print(f"  Tags: {', '.join(thread['tags'])}")
```

**Use Case**:
- Project retrospective: how work evolved
- Identify patterns: what types of threads spawn over time
- Timeline documentation for stakeholders

---

## Pattern 6: Find Threads Referencing a Specific Asset

**Scenario**: Trace which threads use a particular asset (for impact analysis or cleanup).

**Implementation**:

```python
def find_threads_referencing_asset(asset_id, data):
    """Find all threads that reference a specific asset."""
    result = []
    
    for op in data['operations']:
        if op['command'] == 'reference':
            params = op['params']
            if 'asset_ids' in params and asset_id in params['asset_ids']:
                from_thread = params['from_id']
                result.append(from_thread)
    
    return list(set(result))  # Remove duplicates

# Usage
asset_id = "asset_001"
referencing_threads = find_threads_referencing_asset(asset_id, data)
print(f"Threads referencing {asset_id}: {referencing_threads}")

# Show details
for thread_id in referencing_threads:
    thread = data['threads'][thread_id]
    print(f"  - {thread_id}: {thread['title']} ({thread['status']})")
```

**Use Case**:
- Before deleting an asset, understand who's using it
- Audit asset usage across threads
- Find stale references to cleaned-up assets
