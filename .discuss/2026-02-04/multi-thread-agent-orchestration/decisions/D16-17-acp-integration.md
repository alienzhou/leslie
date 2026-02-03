# D16-17: ACP Integration Plan

> Status: ✅ Confirmed
> Decision Date: 2026-02-04

## Core Decisions

### D16: Thread = ACP Session
- Each Thread corresponds to one ACP Session
- Each Thread runs an independent Claude Code process
- Not considering API rate limiting for now

### D17: Capability Injection Method
- **Not through MCP** to directly inject thread commands to Agent
- **Through Skill mechanism**: Agent learns Thread operations by loading Skills

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Thread Orchestration System                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Thread Manager                           │ │
│  │  - Thread Registry                                          │ │
│  │  - ACP Connection Pool                                      │ │
│  │  - Artifact Storage                                         │ │
│  └───────────────────────────┬────────────────────────────────┘ │
│                              │                                   │
│          ┌───────────────────┼───────────────────┐              │
│          ▼                   ▼                   ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  Thread A   │     │  Thread B   │     │  Thread C   │       │
│  │  (Session)  │     │  (Session)  │     │  (Session)  │       │
│  │             │     │             │     │             │       │
│  │  Skill      │     │  Skill      │     │  Skill      │       │
│  │  Injection  │     │  Injection  │     │  Injection  │       │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘       │
│         │ ACP               │ ACP               │ ACP          │
│         ▼                   ▼                   ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ Claude Code │     │ Claude Code │     │ Claude Code │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## ACP Method Mapping

| Thread CLI | ACP Method |
|------------|------------|
| `thread spawn` | `session/new` |
| `thread prompt` | `session/prompt` |
| `thread status` | Local state query |
| `thread lifecycle done` | Close Session |
| `thread lifecycle cancel` | `session/cancel` |

## Components to Implement

1. **Thread Manager** - Core scheduler
2. **Thread CLI** - Command line interface
3. **Artifact Storage** - Output storage
4. **Skill Collection** - Skills for Thread operations

## Related Decisions
- [D01 ACP Technology Stack](./D01-acp-protocol-selection.md) - Protocol selection
- [D02 Coordination Mode](./D02-coordination-mode.md) - Agent collaboration approach
- [D12-15 CLI Design](./D12-15-cli-design.md) - Command specification
- [D18-19 Skill Design](./D18-19-skill-design.md) - Capability injection method

## Related Notes
- [ACP Research](../notes/acp-research.md) - Detailed protocol analysis

---
← [Back to outline](../outline.md)
