# D04-07: Sharing Mechanism Design

> Status: ✅ Confirmed
> Decision Date: 2026-02-04

## Core Decisions

### D04: Share Artifacts Not Messages
- Share "work artifacts" rather than conversation messages
- Artifact types: plans, discussion outlines, design documents, project closure reports
- Conversations can optionally be exported as transcript, but not shared by default

### D05: Layered State
- **Lightweight global state**: Thread list, status, global plan/milestones
- **Local output space**: Each Thread has its own `artifacts/` directory
- Other Threads access via `reference`

### D06: Dynamic Reference
- Establish references at runtime on demand (no need to declare at spawn time)
- Start flexible and open, converge based on actual issues later

### D07: Real-time Updates
- Agent updates shared Context in real-time during execution
- Not "submit all at once after completion"

## Directory Structure Design

```
/threads/
├── .global/                    # Global state
│   ├── registry.json           # Thread registry
│   └── plan.md                 # Global plan
│
├── thread-A/
│   ├── artifacts/              # A's outputs
│   │   ├── plan.md
│   │   └── code/
│   ├── context/                # A's context
│   │   ├── inherited/          # frozen snapshots
│   │   └── live/               # live reference pointers
│   └── transcript.md           # Conversation export (optional)
│
└── thread-B/
    ├── artifacts/
    ├── context/
    │   └── inherited/
    │       └── plan.md         # Snapshot copied from A
    └── transcript.md
```

## Read Logic

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

## Related Decisions
- [D08-11 Frozen Snapshot](./D08-11-frozen-snapshot.md) - Version and reference implementation
- [D16-17 ACP Integration](./D16-17-acp-integration.md) - Thread architecture

## Related Notes
- [Thread CLI Command Details](../notes/thread-cli-commands.md) - reference command details

---
← [Back to outline](../outline.md)
