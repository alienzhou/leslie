# D02: Coordination Mode - Agent Peer Collaboration First

> Status: ✅ Confirmed
> Decision Date: 2026-02-04

## Decision
Implement Agent peer collaboration mode first (Swarm-like), keeping central coordinator mode as a fallback.

## Comparison of Two Modes

### Mode A: Central Coordinator
```
            ┌─────────────┐
            │ Coordinator │
            └──────┬──────┘
       ┌──────────┼──────────┐
       ▼          ▼          ▼
   Thread A   Thread B   Thread C
```
- Pros: Clear global view, strong control
- Cons: Single point bottleneck, limited scalability

### Mode B: Agent Peer Collaboration (Swarm-like)
```
   Thread A ◄──► Thread B
       ▲            ▲
       └────────────┘
            │
       Thread C
```
- Pros: Simpler architecture, more flexible
- Cons: Potential coordination chaos

## Selection Rationale
1. Simpler architecture, suitable for MVP
2. Want to see how complex tasks Agent can handle in a flexible setup
3. Keep fallback option, can switch if problems arise

## Key Differences from Swarm
| Dimension | Swarm | Our Thread Model |
|-----------|-------|------------------|
| Context | Shared message context | Independent context |
| Switching | HandoffMessage | transfer primitive |
| Data Exchange | Natural sharing (same context) | Requires reference/merge |
| Parallelism | Serial turn-taking | True parallel execution |

## References
- https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/swarm.html
- https://github.com/openai/swarm
- [Swarm Analysis Notes](../notes/swarm-analysis.md)

## Related Decisions
- [D01 ACP Technology Stack](./D01-acp-protocol-selection.md) - Communication protocol selection
- [D16-17 ACP Integration](./D16-17-acp-integration.md) - Thread = Session

---
← [Back to outline](../outline.md)
