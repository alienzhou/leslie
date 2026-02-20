# Context Injection Design

> **Decision ID**: D01, D06  
> **Status**: ✅ Confirmed  
> **Last Updated**: 2026-02-09

## 1. Overview

Context injection is the mechanism by which Leslie provides asset information to Agents at the start of each conversation.

## 2. Layered Design

| Layer | Content | Location | Update Frequency |
|-------|---------|----------|------------------|
| **Static Layer** | Leslie system usage guide | AGENTS.md | On CLI version update |
| **Dynamic Layer** | Thread-specific context | User Message | Per conversation |

## 3. Thread Context Format

### 3.1 XML Structure

```xml
<thread_context 
  thread="thread-abc123" 
  objective="obj-456"
  relations_file=".leslie/thread_relations.json">
  
  <!-- Current Thread's assets (read-write) -->
  <asset type="plan" path=".leslie/threads/thread-abc123/plan.md" />
  <asset type="progress" path=".leslie/threads/thread-abc123/progress.md" />
  <asset type="design" path=".leslie/threads/thread-abc123/design/" />
  
  <!-- Referenced Thread's assets (read-only) -->
  <ref thread="thread-xyz789">
    <asset type="plan" path=".leslie/threads/thread-xyz789/plan.md" />
    <asset type="design" path=".leslie/threads/thread-xyz789/design/api.md" />
  </ref>
  
</thread_context>

User's actual task description...
```

### 3.2 Attributes

| Attribute | Description | Required |
|-----------|-------------|----------|
| `thread` | Current Thread ID | ✅ |
| `objective` | Parent Objective ID | ✅ |
| `relations_file` | Path to relations JSON | Optional |

### 3.3 Element Types

| Element | Description | Access |
|---------|-------------|--------|
| `<asset>` | Current Thread's asset | Read-Write |
| `<ref>` | Referenced Thread container | Read-Only |
| `<ref>/<asset>` | Referenced Thread's asset | Read-Only |

## 4. Cross-Thread Reference

### 4.1 One-Level Injection

`<thread_context>` shows **only direct references** (one level deep):
- Thread A references Thread B → B's assets are visible
- Thread B references Thread C → C's assets are NOT visible to A

**Rationale**:
- Prevents context explosion
- Makes dependencies explicit
- User controls all references

### 4.2 Reference Access Rules

| Access Type | Allowed | Example |
|-------------|---------|---------|
| Read own assets | ✅ | `read_file(".leslie/threads/thread-abc/plan.md")` |
| Write own assets | ✅ | `write_file(".leslie/threads/thread-abc/progress.md")` |
| Read referenced assets | ✅ | `read_file(".leslie/threads/thread-xyz/plan.md")` |
| Write referenced assets | ❌ | Not allowed |

### 4.3 Establishing References

References are established via CLI when spawning or at runtime:

```bash
# At spawn time
leslie spawn --intent "Fix login bug" --ref thread-abc

# At runtime (dynamic reference)
leslie reference --target thread-abc --scope "artifacts/plan.md"
```

## 5. Agent Responsibilities

When receiving `<thread_context>`:

1. **Parse context** to understand scope and available assets
2. **Read existing assets** (plan, progress) if they exist
3. **Create plan** if none exists
4. **Update progress** after each significant step
5. **Stay in scope** — only modify own Thread's assets
6. **Reference only** — read but don't modify other Threads' assets

## 6. Injection Timing

| Event | Context Injected |
|-------|------------------|
| Thread starts | Full `<thread_context>` |
| User message in existing Thread | Updated `<thread_context>` |
| Context compression occurs | Re-inject `<thread_context>` |

## 7. Compression Protection Strategy

### 7.1 Ideal Solution (Future)

Use ACP `session/update` + `sessionUpdate: "usage_update"`:
- Provides `used` (used tokens) and `size` (total capacity) fields
- Trigger `<thread_context>` re-injection when usage > 90%

### 7.2 Transition Solution (MVP)

- Rough estimation based on message rounds
- Proactive re-injection after every N conversation rounds
- Or re-inject when estimated total tokens approach threshold

## 8. Thread Relations Discovery

Agent can query full Thread dependency network via the relations file:

```json
{
  "version": "1.0",
  "threads": {
    "thread-abc": {
      "title": "API Design",
      "status": "active"
    }
  },
  "relations": {
    "thread-abc": {
      "references_to": ["thread-xyz"],
      "referenced_by": []
    }
  }
}
```

## 9. Related Documents

- [Asset Types](./01-asset-types.md)
- [AGENTS.md Integration](./03-agents-md-integration.md)
- [Thread Metadata Storage](../thread-metadata-storage/00-overview.md)
