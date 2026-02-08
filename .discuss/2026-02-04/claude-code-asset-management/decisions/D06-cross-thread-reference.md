# D06: Cross-Thread Reference and Dependency Management

**Status**: ✅ Confirmed  
**Decision Date**: 2026-02-08  
**Source**: Claude Code Asset Management Discussion

## Decision

Define how Threads reference and access assets from other Threads.

## Basic Reference Model: One-Level Injection

`<thread_context>` shows **only direct references** (one level deep):

```xml
<thread_context thread="current-id" objective="obj-456">
  <!-- Current Thread's assets -->
  <asset type="plan" path=".leslie/threads/current-id/plan.md" />
  
  <!-- Direct reference (via --ref flag) -->
  <ref thread="referenced-id">
    <asset type="design" path=".leslie/threads/referenced-id/design/api.md" />
  </ref>
</thread_context>
```

**Rationale**:
- Simplicity: Agent only sees immediate needs
- Context budget: Avoids path explosion
- Explicit control: User decides what's visible

## Transitive References: Not Automatic

If Thread A → Thread B → Thread C:
- Thread A's context **only includes B**, not C
- Thread C is NOT automatically visible

**Rationale**:
- Prevents context explosion
- Makes dependencies explicit
- User controls all references

## Advanced Capability 1: Dependency Graph Tool

Agent can query full Thread dependency network.

**Tool Response Format**:
```json
{
  "root": "thread-A",
  "dependencies": {
    "thread-A": {
      "direct_refs": ["thread-B"],
      "objective": "obj-frontend"
    },
    "thread-B": {
      "direct_refs": ["thread-C"],
      "objective": "obj-api"
    },
    "thread-C": {
      "direct_refs": [],
      "objective": "obj-database"
    }
  },
  "graph": "thread-A → thread-B → thread-C"
}
```

**Use Case**: Agent wants to understand full context before decisions

## Advanced Capability 2: Asset Discovery

Agent can manually explore referenced Threads following these guidelines:

**Discovery Pattern**:
1. **List assets**: Use `list_files(".leslie/threads/xxx/")` to see Thread directory
2. **Read specific assets**: Use `read_file` when details needed
3. **Follow transitive refs**: Check referenced Thread's plan.md for further references

**Important**: This is manual exploration. Only do this when necessary for the task.

**Guidelines in AGENTS.md**: Document this exploration pattern for Agent reference

## Advanced Capability Toggle

Configuration to enable/disable:

```yaml
# .leslie/config.yml
advanced:
  dependency_graph_tool: true
  transitive_discovery: true
```

**Default**: Both enabled (require Agent to actively use)

## Circular Reference Detection

**Detection Strategy**: At spawn time, check for cycles when creating Thread with `--ref`

**Detection Algorithm**:
- Track visited Threads in a set
- Traverse from referenced Thread following all direct refs
- If traversal reaches the new Thread being created → cycle detected

**Action on detection**: Reject spawn command with clear error:
```
Error: Cannot create Thread with --ref thread-C
Reason: Circular reference detected (thread-A → thread-B → thread-C → thread-A)
```

**Rationale**: Prevents infinite loops in dependency resolution

## Broken Reference Handling

**Scenario**: Referenced Thread is deleted after reference established

**Detection**: At context injection time, check if referenced Thread exists

**Behavior**:
1. **Log warning**: "Referenced Thread thread-B not found"
2. **Skip in context**: Don't include broken `<ref>` in `<thread_context>`
3. **Notify user**: Show warning in CLI output

**Example context with broken ref**:
```xml
<thread_context thread="thread-A" objective="...">
  <asset type="plan" path=".leslie/threads/thread-A/plan.md" />
  
  <!-- thread-B reference is silently skipped (logged as warning) -->
</thread_context>
```

**Rationale**: 
- Non-blocking: Doesn't prevent Thread from running
- Informative: User knows something is missing
- Graceful degradation: Agent can still proceed with available assets

## Storage

Store references in SQLite:

```sql
CREATE TABLE thread_references (
  from_thread_id TEXT,
  to_thread_id TEXT,
  created_at TIMESTAMP,
  UNIQUE(from_thread_id, to_thread_id)
);
```

## Related Decisions

| Decision | Relationship |
|----------|-------------|
| D01 Asset Management | D06 defines cross-Thread access |
| D03 AGENTS.md Content | D06 guidelines documented in D03 |

---
← [Back to outline](../outline.md)
