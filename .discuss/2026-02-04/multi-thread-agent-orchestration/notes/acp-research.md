# ACP Protocol Research Notes

> Type: Research Notes
> Date: 2026-02-04

## ACP Overview

Agent Client Protocol (ACP) standardizes communication between code editors and coding agents.

- Official site: https://agentclientprotocol.com/
- GitHub: https://github.com/agentclientprotocol/agent-client-protocol

## Design Philosophy

1. **MCP-friendly**: Based on JSON-RPC, reuses MCP types
2. **UX-first**: Designed for Agent interaction UX, includes diff display, etc.
3. **Trusted**: Assumes user trusts Agent, but preserves tool call control

## Core Concepts

### Communication Model
- Based on JSON-RPC 2.0
- **Methods**: Request-response pairs
- **Notifications**: One-way messages, no response expected

### Roles
- **Client**: Code editor (IDE)
- **Agent**: AI coding agent, typically runs as Client subprocess

### Connection Methods
- **Local**: Subprocess, communicates via stdin/stdout
- **Remote**: HTTP/WebSocket (in progress)

## Session Mechanism

Session = A conversation/thread context.

### Create Session
```json
{
  "method": "session/new",
  "params": {
    "cwd": "/home/user/project",
    "mcpServers": [...]
  }
}
```

Returns sessionId.

### Load Session
```json
{
  "method": "session/load",
  "params": {
    "sessionId": "sess_789xyz",
    "cwd": "/home/user/project"
  }
}
```

Agent will replay conversation history.

### Send Prompt
```json
{
  "method": "session/prompt",
  "params": {
    "sessionId": "...",
    "prompt": { "type": "text", "text": "..." }
  }
}
```

### Receive Updates
Agent sends via `session/update` notification:
- Message blocks (agent/user/thought)
- Tool calls
- Plan updates
- Mode changes

## ACP to Thread Mapping

| ACP Concept | Thread Concept |
|-------------|----------------|
| Session | Thread |
| session/new | spawn |
| session/load | Resume Thread |
| session/prompt | Send task to Thread |
| session/update | Thread output notification |
| session/cancel | lifecycle(cancel) |

## MCP Integration

ACP supports passing MCP servers at session/new:

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "/path/to/mcp-server",
      "args": ["--stdio"]
    }
  ]
}
```

This gives Agent additional tool capabilities.

**However, we choose to inject Thread capabilities via Skills, not MCP.**

## Extensibility

- `_meta` fields: Add custom data
- `_` prefixed methods: Custom methods
- Declare custom capabilities during initialization

## Official SDKs

- TypeScript: `@agentclientprotocol/sdk`
- Python: `python-sdk`
- Rust: `agent-client-protocol`
- Kotlin: `acp-kotlin`

## References
- Architecture: https://agentclientprotocol.com/get-started/architecture.md
- Session Setup: https://agentclientprotocol.com/protocol/session-setup.md
- Overview: https://agentclientprotocol.com/protocol/overview.md

## Related Decisions
- [D01 ACP Technology Stack Selection](../decisions/D01-acp-protocol-selection.md)
- [D16-17 ACP Integration Plan](../decisions/D16-17-acp-integration.md)

---
← [Back to outline](../outline.md)
