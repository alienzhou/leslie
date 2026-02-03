# D23-26: Objective-Thread Model

> Status: ✅ Confirmed
> Decision Date: 2026-02-04
> Source: Tech Stack Implementation Discussion

## Concept Hierarchy

> See full diagram in [Architecture Outline](../outline.md#-concept-model)

| Concept | Granularity | Analogy |
|---------|-------------|---------|
| **Objective** | Goal/Task | An Epic / Top-level requirement |
| **Thread** | Execution unit | A Session / Work context |
| **Artifact** | Output | Code, documents, configs, etc. |

## D23: Objective-driven Architecture

**Decision**: Thread must belong to an Objective (mandatory constraint)

### Rationale
1. Simplifies model, avoids orphan Threads
2. Provides clear task organization structure
3. Facilitates tracking task completion status

### Implementation Points
```typescript
interface Thread {
  id: string;
  objectiveId: string;  // Required, cannot be null
  intent: string;
  // ...
}
```

## D24: Objective Completion Condition

**Decision**: Objective completion = all Threads terminated

### State Transitions
```
Objective.status:
  active    → Has active Threads
  completed → All Threads are terminated
```

### Definition of Thread terminated
- `done`: Completed normally
- `cancelled`: Was cancelled
- `archived`: Archived

## D25: Session Recovery

**Decision**: Session recovery via context snapshot + replay

### Problem
Claude Code Sessions are in-memory, lost on restart. Threads need to be persisted to SQLite, but how to recover an "interrupted Session"?

### Solution
1. Thread stores context snapshot (conversation history, key state)
2. On recovery, replay snapshot to Agent
3. Agent resumes execution from restored context

### Storage Structure
```
storage/
├── threads.db              # SQLite: Thread metadata
└── threads/
    └── <thread-id>/
        ├── context.json    # Context snapshot
        └── artifacts/      # Outputs
```

## D26: Thread Operation Entry

**Decision**: All Thread operations via CLI, Agent can call CLI/Skills

### Design Considerations
- **Unified entry**: Both humans and Agents operate Threads through the same CLI commands
- **Aligns with Human-Agent Parity**: CLI doesn't distinguish caller identity
- **Flexibility**: Agent can wrap CLI calls through Skills

### Invocation Methods

#### Human Direct Call
```bash
leslie spawn --intent "Design database schema"
```

#### Agent via CLI
```bash
# Agent executes in terminal
leslie spawn --intent "Research caching strategies"
```

#### Agent via Skills
```typescript
// Wrapped in Skill
await threadPrimitives.spawn({
  intent: "Research caching strategies"
});
```

## Relationship with Other Decisions

- **D22 Human-Agent Parity**: D26 is its concrete implementation, embodying the "isomorphic operations" principle
- **D16-17 ACP Integration**: Foundation for Thread = Session mapping
- **D12-15 CLI Design**: CLI command format specification

## Related Discussions
- [Tech Stack Implementation](../../tech-stack-implementation/outline.md)
- [Human-Agent Parity](./D22-human-agent-parity.md)

---
← [Back to outline](../outline.md)
