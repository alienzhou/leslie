# Sharing Mechanism Design

> **Decision ID**: D04-D11  
> **Status**: ✅ Confirmed  
> **Last Updated**: 2026-02-09

## 1. Core Design Decisions

### 1.1 D04: Share Artifacts Not Messages

- Share "work artifacts" rather than conversation messages
- Artifact types: plans, discussion outlines, design documents, project closure reports
- Conversations can optionally be exported as transcript, but not shared by default

### 1.2 D05: Layered State

| Layer | Content | Access |
|-------|---------|--------|
| **Lightweight global state** | Thread list, status, global plan/milestones | All threads |
| **Local output space** | Each Thread has its own `artifacts/` directory | Via `reference` |

### 1.3 D06: Dynamic Reference

- Establish references at runtime on demand (no need to declare at spawn time)
- Start flexible and open, converge based on actual issues later

### 1.4 D07: Real-time Updates

- Agent updates shared Context in real-time during execution
- Not "submit all at once after completion"

## 2. Directory Structure

```
.leslie/
├── threads/
│   ├── .global/                    # Global state
│   │   ├── registry.json           # Thread registry
│   │   └── plan.md                 # Global plan
│   │
│   ├── thread-A/
│   │   ├── artifacts/              # A's outputs
│   │   │   ├── plan.md
│   │   │   └── code/
│   │   ├── context/                # A's context
│   │   │   ├── inherited/          # frozen snapshots
│   │   │   └── live/               # live reference pointers
│   │   └── transcript.md           # Conversation export (optional)
│   │
│   └── thread-B/
│       ├── artifacts/
│       ├── context/
│       │   └── inherited/
│       │       └── plan.md         # Snapshot copied from A
│       └── transcript.md
└── thread_relations.json           # Thread relationships
```

## 3. Frozen Snapshot Mechanism

### 3.1 D08-D11 Decisions

| ID | Decision | Description |
|----|----------|-------------|
| D08 | Snapshot copy for Frozen | When binding=frozen, create a copy |
| D09 | Immediate copy | Copy happens at reference creation time |
| D10 | No auto-refresh | Frozen references don't update automatically |
| D11 | Manual refresh | User can explicitly refresh a frozen reference |

### 3.2 Read Logic

```typescript
read('plan.md')

if (exists in context/inherited/) {
  return readLocalCopy  // frozen
} else if (exists in context/live/.refs.json) {
  return readOriginalLocation  // live
} else {
  throw 'File not referenced'
}
```

## 4. Cross-Thread Reference

### 4.1 One-Level Injection

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

### 4.2 Transitive References: Not Automatic

If Thread A → Thread B → Thread C:
- Thread A's context **only includes B**, not C
- Thread C is NOT automatically visible

**Rationale**:
- Prevents context explosion
- Makes dependencies explicit
- User controls all references

### 4.3 Circular Reference Detection

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

### 4.4 Broken Reference Handling

**Behavior**:
1. **Log warning**: "Referenced Thread thread-B not found"
2. **Skip in context**: Don't include broken `<ref>` in `<thread_context>`
3. **Notify user**: Show warning in CLI output

**Rationale**: 
- Non-blocking: Doesn't prevent Thread from running
- Informative: User knows something is missing
- Graceful degradation: Agent can still proceed with available assets

## 5. Related Documents

- [Thread Primitives](./01-thread-primitives.md)
- [Asset Management](../asset-management/00-overview.md)
