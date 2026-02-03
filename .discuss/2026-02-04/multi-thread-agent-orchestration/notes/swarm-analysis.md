# Swarm Mode Analysis and Comparison

> Type: Research Notes
> Date: 2026-02-04

## Swarm Mode Overview

Swarm is a multi-Agent collaboration mode pioneered by OpenAI and implemented by AutoGen.

### Core Mechanism
- Agents delegate tasks to other Agents via **HandoffMessage**
- All Agents **share the same message context**
- Next speaker is selected based on the latest HandoffMessage
- Agents make **local decisions**, not dependent on central orchestrator

### Typical Flow
```
User → Agent A → (handoff) → Agent B → (handoff) → Agent A → TERMINATE
```

## Comparison with Our Thread Mode

| Dimension | Swarm | Thread Mode |
|-----------|-------|-------------|
| **Context** | Shared message context | Independent context |
| **Switching Mechanism** | HandoffMessage (tool call) | transfer primitive |
| **Data Exchange** | Natural sharing (same context) | Requires reference/merge |
| **Parallelism** | Serial turn-taking | True parallel execution |
| **Isolation** | No isolation | Threads are isolated |

## Key Difference Analysis

### 1. Context Sharing vs Isolation

**Swarm**: All Agents see the same message history
- Pros: Natural information flow, no explicit passing needed
- Cons: Cannot truly parallelize, one speaks while others wait

**Thread**: Each Thread has independent context
- Pros: True parallel execution, no interference
- Cons: Requires explicit sharing mechanism (reference/merge)

### 2. Our Choice

Don't fully replicate Swarm, instead:
- Share **work artifacts** rather than conversation messages
- Artifact types: plans, outlines, design documents, project closure reports
- Conversations can optionally be exported as transcript

### 3. transfer Primitive Can Support Swarm-like handoff

```typescript
transfer({
  direction: 'handoff',
  target: 'thread-B',
  context_inherit: 'artifacts_only'  // Only inherit artifacts
})
```

## Swarm Example Analysis

### Customer Support Scenario
```
Travel Agent → Flights Refunder → User → Flights Refunder → Travel Agent → TERMINATE
```

**Characteristics**:
- Serial relay
- Can handoff to "user" to wait for input
- Returns to coordinator to terminate after task completion

### Stock Research Scenario
```
Planner → Financial Analyst → Planner → News Analyst → Planner → Writer → Planner → TERMINATE
```

**Characteristics**:
- Has a Planner role as the center
- Although using Swarm, it's actually "centralized + handoff"
- Each expert returns to Planner after completion

## Insights for Us

1. **Swarm's Planner Pattern**: Although called decentralized, Stock Research example actually has a center
2. **Start Simple, Add Complexity**: We try true peer collaboration first, add coordinator if problems arise
3. **Handoff is Optional**: transfer primitive supports handoff, but doesn't force its use

## References
- https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/swarm.html
- https://github.com/openai/swarm

## Related Decisions
- [D02 Coordination Mode](../decisions/D02-coordination-mode.md) - Adopted coordination strategy
- [D04-07 Sharing Mechanism](../decisions/D04-07-sharing-mechanism.md) - Handling differences from Swarm

---
← [Back to outline](../outline.md)
