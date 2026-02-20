# CLI Design Specification

> **Decision ID**: D12-D15, D27-D28  
> **Status**: ✅ Confirmed  
> **Last Updated**: 2026-02-09

## 1. Core Design Decisions

### 1.1 Naming Style (D12)

Use `leslie <command>` style (similar to git):
- `leslie spawn` - Create new thread
- `leslie list` - List threads
- `leslie status` - View thread status

### 1.2 Output Format (D13)

- Optional `--format json|table|yaml`
- Default is JSON (machine-readable for Agent)

### 1.3 Error Handling (D14)

Return: error code + error message

```json
{
  "code": "T101",
  "message": "Thread 'thread-xyz' not found"
}
```

### 1.4 Language (D15)

- English only
- No internationalization for MVP

## 2. CLI Dual Capabilities (D27-D28)

```
┌─────────────────────────────────────────────────────────────────┐
│                       Leslie CLI                                 │
├─────────────────────────────┬───────────────────────────────────┤
│   Thread Primitives (A)     │      Task & UI (B)                │
│   ─────────────────────     │      ────────────                 │
│   • spawn                   │      • objective create           │
│   • lifecycle               │      • list (UI display)          │
│   • reference               │      • connect (interactive)      │
│   • merge                   │      • status (visualization)     │
│   • transfer                │                                   │
│   • inject                  │                                   │
│                             │                                   │
│   ↓ Agent invocation        │      ↓ Human interaction          │
└─────────────────────────────┴───────────────────────────────────┘
```

| CLI Type | Target | Output | Interaction |
|----------|--------|--------|-------------|
| **Thread Primitives (A)** | Agent | JSON (machine-readable) | Non-interactive |
| **Task & UI (B)** | Human | Formatted (human-readable) | Interactive supported |

## 3. Command Tiers

| Tier | Command | Semantics | Priority |
|------|---------|-----------|----------|
| T1 | `spawn` | Create child Thread | P0 |
| T1 | `reference` | Establish reference | P0 |
| T1 | `lifecycle` | State control | P0 |
| T2 | `merge` | Merge outputs | P1 |
| T2 | `transfer` | Transfer control | P1 |
| T3 | `observe` | Event subscription | P2 |
| T3 | `inject` | Information injection | P2 |
| T3 | `rollback` | Rollback | P2 |
| Query | `list` | List Threads | P0 |
| Query | `status` | View status | P0 |
| Query | `artifacts` | List outputs | P0 |

## 4. Command Examples

### 4.1 Tier 1 Commands

```bash
# spawn - Create child Thread
leslie spawn --intent "Research Redis caching" --inherit partial --scope "requirements"

# reference - Establish reference
leslie reference --target thread-abc --scope "artifacts/plan.md" --binding frozen

# lifecycle - Control state
leslie lifecycle --action done --reason "Research completed"
```

### 4.2 Tier 2 Commands

```bash
# merge - Merge artifacts
leslie merge --sources thread-a,thread-b --target thread-main

# transfer - Transfer control
leslie transfer --direction handoff --target thread-review
```

### 4.3 Query Commands

```bash
# list - List threads
leslie list --status active

# status - View thread status
leslie status thread-abc

# artifacts - List outputs
leslie artifacts thread-abc
```

## 5. Human-Agent Parity Commands

All Thread operations are available to both humans and agents via the same CLI:

```bash
# Agent asks Human for help
leslie transfer --direction request_approval \
  --scope "need_human_decision" \
  --reason "Encountered tech stack disagreement, need human decision"

# Human proactively stops Agent
leslie lifecycle --action suspend --reason "Found wrong direction, pausing for re-evaluation"

# Human proactively terminates Agent
leslie lifecycle --action cancel --reason "Strategy needs adjustment"

# Human injects new info/constraints
leslie inject --target thread-abc \
  --type constraint \
  --content "New requirement: must support TypeScript"
```

## 6. Related Documents

- [Thread Primitives](./01-thread-primitives.md)
- [Human-Agent Parity](./04-human-agent-parity.md)
- [Error Handling](../tech-stack/02-error-handling.md)
