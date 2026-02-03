# D22: Human-Agent Parity (System Essence)

> Status: ✅ Confirmed
> Decision Date: 2026-02-04
> Importance: 🔴 Core Design Philosophy

## Core Perspective

**This is not a fully automated system, but a Human-Agent parity collaboration system.**

Traditional thinking:
> Human assigns task → Agent fully auto-decomposes and executes → Produces result

Our design philosophy:
> Human ↔ Agent are **equal**, both can initiate, intervene, and ask for help

## Three Interaction Modes

### Mode A: Human → Agent (Task Assignment)

```
┌────────┐                    ┌────────┐
│ Human  │ ── Assign Task ──► │ Agent  │
└────────┘                    └────────┘
                                  │
                              Decompose
                              & Execute
                                  │
                                  ▼
                             Produce Result
```

Most common scenario, but not the only mode.

### Mode B: Agent → Human (Asking for Help)

```
┌────────┐                    ┌────────┐
│ Agent  │ ── Help Request ─► │ Human  │
└────────┘                    └────────┘
    │                             │
    │ Encounters situations       │ Human intervenes:
    │ it can't handle:            │ - Provides info
    │ - Needs extra info          │ - Makes decisions
    │ - Needs decision confirm    │ - Takes over task
    │ - Beyond capability         │
    │                             │
    └──── Continue execution ◄────┘
```

**Key capability**: Agent can proactively initiate notifications, requesting human intervention.

Implementation:
```bash
# Agent initiates help request
thread transfer --direction request_approval \
  --scope "need_human_decision" \
  --reason "Encountered tech stack disagreement, need human decision"
```

### Mode C: Human Proactive Intervention

```
┌────────┐                    ┌────────┐
│ Human  │ ── Intervene ────► │ Agent  │
└────────┘                    └────────┘
    │                             │
    │ Human finds issues:         │ Agent is intervened:
    │ - Agent going wrong way     │ - Pause execution
    │ - Agent is stuck            │ - Stop running
    │ - Need strategy change      │ - Receive new instructions
```

**Key capability**: Human can intervene at any time, like operating another Agent.

Implementation:
```bash
# Human proactively stops Agent
thread lifecycle --action suspend --reason "Found wrong direction, pausing for re-evaluation"

# Human proactively terminates Agent
thread lifecycle --action cancel --reason "Strategy needs adjustment"

# Human injects new info/constraints
thread inject --target thread-abc \
  --type constraint \
  --content "New requirement: must support TypeScript"
```

## Design Principles

### 1. Isomorphic Operations

Human and Agent use **exactly the same Thread primitives**:
- Human can `spawn` a Thread for Agent to work on
- Agent can also `spawn` a Thread for Human to work on (asking for help)
- Human can `lifecycle cancel` to stop Agent
- Agent can also `transfer request_approval` to request Human confirmation

### 2. Interchangeable Roles

From Thread's perspective, Human and Agent are just different **executors**:

```typescript
interface Thread {
  id: string;
  intent: string;
  executor: 'human' | 'agent';  // Who is executing this Thread
  status: 'active' | 'waiting_human' | 'completed' | ...;
}
```

### 3. Notification Mechanism

When Agent asks for help, system needs to notify Human:
- IDE notification
- Terminal output
- External notification (optional: email, messaging, etc.)

## Mapping to Existing Primitives

| Human-Agent Interaction | Primitive Used |
|------------------------|----------------|
| Human assigns task to Agent | `spawn` + `prompt` |
| Agent asks Human for help | `transfer --direction request_approval` |
| Agent requests Human takeover | `transfer --direction handoff --target human` |
| Human pauses Agent | `lifecycle --action suspend` |
| Human stops Agent | `lifecycle --action cancel` |
| Human injects new info | `inject` |
| Human observes Agent progress | `observe` / `status` |

## Relationship with "Twin Isomorphism"

This design aligns with the "Twin Isomorphism" principle from Thread primitive design:

> Human and Agent use the same action language to operate Threads.

Human-Agent parity is not a new feature, but the **core design philosophy of the system**.

## Implementation Key Points

1. **CLI doesn't distinguish caller**: `thread spawn` behaves the same whether called by Human or Agent
2. **executor field**: Records who is currently executing the Thread
3. **waiting_human status**: Agent enters waiting-for-human state after asking for help
4. **Notification system**: Trigger notification when asking for help (MVP can use simple terminal output)

## Related Decisions
- [D02 Coordination Mode](./D02-coordination-mode.md) - Agent peer collaboration
- [D18-19 Skill Design](./D18-19-skill-design.md) - How Agent learns Thread operations

---
← [Back to outline](../outline.md)
