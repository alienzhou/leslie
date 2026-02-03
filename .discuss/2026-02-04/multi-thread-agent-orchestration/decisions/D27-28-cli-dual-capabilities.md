# D27-28: CLI Dual Capabilities

> Status: ✅ Confirmed
> Decision Date: 2026-02-04
> Source: Tech Stack Implementation Discussion

## Overview

Leslie CLI exposes two distinct capability sets within a single CLI interface:

| Type | Target User | Purpose |
|------|-------------|---------|
| **Thread Primitives** | Agent | Operational interface for managing execution context |
| **Task & UI** | Human | Launch objectives, view status, interactive connection |

## Architecture

> See full diagram in [Architecture Outline](../outline.md#-system-architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                       Leslie CLI                                 │
├─────────────────────────────┬───────────────────────────────────┤
│   Thread Primitives (A)     │      Task & UI (B)                │
│   ─────────────────────     │      ────────────                 │
│   • spawn, lifecycle, ...   │      • objective, list, connect   │
│   ↓ Agent invocation        │      ↓ Human interaction          │
└─────────────────────────────┴───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Leslie Core                                │
│   Objective Manager • Thread Manager • Storage • ACP Client      │
└─────────────────────────────────────────────────────────────────┘
```

## D27: Thread Primitives (Type A)

**Decision**: CLI exposes a complete set of Thread primitives for Agent invocation.

### Capabilities

| Command | Purpose |
|---------|---------|
| `spawn` | Create child Thread |
| `lifecycle` | State control (suspend, resume, cancel, done) |
| `reference` | Establish references between Threads |
| `merge` | Merge outputs from multiple Threads |
| `transfer` | Control transfer between executors |
| `inject` | Inject information into a Thread |
| `observe` | Subscribe to Thread events |
| `rollback` | Rollback to previous state |

### Invocation Patterns

**Agent via CLI**:
```bash
leslie spawn --intent "Research caching strategies" --objective obj-123
```

**Agent via Skills**:
```typescript
// Encapsulated in a Skill
await threadPrimitives.spawn({
  intent: "Research caching strategies",
  objectiveId: "obj-123"
});
```

### Design Principles

1. **Machine-friendly output**: JSON by default
2. **Stateless commands**: Each command is self-contained
3. **Composable**: Commands can be chained and scripted
4. **Consistent error handling**: Standardized error codes

## D28: Task & UI (Type B)

**Decision**: CLI provides human-facing commands for task management and status visualization.

### Capabilities

| Command | Purpose |
|---------|---------|
| `objective create` | Launch a new Objective |
| `objective list` | List all Objectives |
| `objective status` | View Objective status |
| `list` | List Threads with UI formatting |
| `connect` | Interactive connection to a running Thread |
| `status` | Visualized Thread status |

### Design Principles

1. **Human-readable output**: Formatted, colored output
2. **Interactive mode**: Support for REPL-style interaction
3. **Progress visualization**: Real-time updates for long-running operations
4. **Error guidance**: Helpful error messages with suggestions

## Relationship with Human-Agent Parity (D22)

This dual-capability design directly implements the Human-Agent Parity principle:

| Aspect | Thread Primitives (A) | Task & UI (B) |
|--------|----------------------|---------------|
| **Caller** | Agent | Human |
| **Output** | JSON (machine-readable) | Formatted (human-readable) |
| **Interaction** | Non-interactive | Interactive supported |
| **Operations** | Isomorphic primitives | High-level task management |

Both humans and agents operate on the same underlying Thread system, just through different interface layers.

## Implementation Notes

### Output Mode Detection

CLI should auto-detect or allow explicit mode selection:
```bash
# Auto-detect: if TTY, use human mode; otherwise, JSON mode
leslie list

# Explicit JSON mode
leslie list --json

# Explicit human mode
leslie list --human
```

### Command Organization

```
leslie
├── spawn              # Primitive (A)
├── lifecycle          # Primitive (A)
├── reference          # Primitive (A)
├── merge              # Primitive (A)
├── transfer           # Primitive (A)
├── inject             # Primitive (A)
├── observe            # Primitive (A)
├── rollback           # Primitive (A)
├── objective          # Task & UI (B)
│   ├── create
│   ├── list
│   └── status
├── list               # Task & UI (B) - formatted Thread list
├── connect            # Task & UI (B) - interactive
└── status             # Task & UI (B) - visualized
```

## Related Decisions

- [D12-15 CLI Design](./D12-15-cli-design.md) - CLI command specifications
- [D22 Human-Agent Parity](./D22-human-agent-parity.md) - Core philosophy
- [D23-26 Objective-Thread Model](./D23-26-objective-thread-model.md) - Thread operations via CLI

---
← [Back to outline](../outline.md)
