# D01: Technology Stack Selection - ACP as Agent Communication Protocol

> Status: ✅ Confirmed
> Decision Date: 2026-02-04

## Decision
Adopt Agent Client Protocol (ACP) as the standard protocol for calling Claude Code Agent.

## Background
We need a standardized way for Thread Manager to communicate with Claude Code Agent.

## Rationale
1. **Standardization**: ACP is specifically designed for communication between code editors and coding agents
2. **Claude Code Support**: Claude Code already supports ACP
3. **Session Mechanism**: ACP's Session concept naturally corresponds to our Thread
4. **MCP Compatibility**: ACP can pass through MCP servers, preserving extensibility

## ACP Core Concept Mapping
| ACP Concept | Thread Concept |
|-------------|----------------|
| Session | Thread |
| session/new | spawn |
| session/load | Resume Thread |
| session/prompt | Send task to Thread |
| session/update | Thread output notification |

## References
- https://agentclientprotocol.com/
- [ACP Research Notes](../notes/acp-research.md)

## Related Decisions
- [D16-17 ACP Integration](./D16-17-acp-integration.md) - Detailed integration design
- [D02 Coordination Mode](./D02-coordination-mode.md) - Multi-Agent collaboration approach

---
← [Back to outline](../outline.md)
