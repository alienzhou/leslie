# Multi-Thread Agent Orchestration Framework Design Discussion

> Discussion Date: 2026-02-04
> Participant: alienzhou
> Repository: [leslie](https://github.com/vibe-x-ai/leslie)

## 🔵 Current Focus
- Discussion paused, content has been captured

## ⚪ Pending
(Empty - MVP implementation plan moved to tech-stack-implementation discussion)

## ✅ Confirmed Decisions

### Technology Selection
| ID | Decision | Document |
|----|----------|----------|
| D01 | ACP as Agent communication protocol | [D01-acp-protocol-selection](./decisions/D01-acp-protocol-selection.md) |
| D02 | Agent peer collaboration first, central coordinator as fallback | [D02-coordination-mode](./decisions/D02-coordination-mode.md) |
| D03 | Reuse existing Tier 1-3 Thread primitives | [D03-thread-primitives](./decisions/D03-thread-primitives.md) |

### Sharing Mechanism
| ID | Decision | Document |
|----|----------|----------|
| D04-07 | Share artifacts, layered state, dynamic reference, real-time updates | [D04-07-sharing-mechanism](./decisions/D04-07-sharing-mechanism.md) |

### Version & Snapshot
| ID | Decision | Document |
|----|----------|----------|
| D08-11 | Snapshot copy for Frozen, immediate copy, no refresh | [D08-11-frozen-snapshot](./decisions/D08-11-frozen-snapshot.md) |

### CLI Design
| ID | Decision | Document |
|----|----------|----------|
| D12-15 | `thread <cmd>` style, JSON default, simplified error handling | [D12-15-cli-design](./decisions/D12-15-cli-design.md) |
| D27-28 | CLI dual capabilities: Thread Primitives (Agent) + Task & UI (Human) | [D27-28-cli-dual-capabilities](./decisions/D27-28-cli-dual-capabilities.md) |

### Integration
| ID | Decision | Document |
|----|----------|----------|
| D16-17 | Thread=Session, Skill-based capability injection | [D16-17-acp-integration](./decisions/D16-17-acp-integration.md) |

### Objective & Thread Model
| ID | Decision | Document |
|----|----------|----------|
| D23 | Objective-driven: Thread must belong to Objective | [D23-26-objective-thread-model](./decisions/D23-26-objective-thread-model.md) |
| D24 | Objective completion: all Threads terminated | [D23-26-objective-thread-model](./decisions/D23-26-objective-thread-model.md) |
| D25 | Session recovery: context snapshot + replay | [D23-26-objective-thread-model](./decisions/D23-26-objective-thread-model.md) |
| D26 | Thread operations via CLI, Agent can call CLI/Skills | [D23-26-objective-thread-model](./decisions/D23-26-objective-thread-model.md) |

### Skill Design
| ID | Decision | Document |
|----|----------|----------|
| D18-19 | Three Skill forms, separation of knowledge and execution | [D18-19-skill-design](./decisions/D18-19-skill-design.md) |
| D20-21 | Project-level Skill storage, Agent autonomous evolution | [D20-21-skill-evolution](./decisions/D20-21-skill-evolution.md) |

### Core Philosophy
| ID | Decision | Document |
|----|----------|----------|
| D22 | 🔴 **Human-Agent Parity** (System Essence) | [D22-human-agent-parity](./decisions/D22-human-agent-parity.md) |

## ❌ Rejected
(Empty)

## 📚 External References
- [ACP Official Website](https://agentclientprotocol.com/)
- [AutoGen Swarm Documentation](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/swarm.html)
- Thread Primitives Design (external reference: stream repo, not linked for independent publishing)

## 🔗 Related Discussions
- [Tech Stack Implementation](../tech-stack-implementation/outline.md) - Tech stack selection and implementation planning

## 📂 Discussion Artifacts

### Decisions (Confirmed)
- [D01-acp-protocol-selection](./decisions/D01-acp-protocol-selection.md) - ACP technology stack selection
- [D02-coordination-mode](./decisions/D02-coordination-mode.md) - Coordination mode choice
- [D04-07-sharing-mechanism](./decisions/D04-07-sharing-mechanism.md) - Sharing mechanism design
- [D08-11-frozen-snapshot](./decisions/D08-11-frozen-snapshot.md) - Frozen snapshot implementation
- [D12-15-cli-design](./decisions/D12-15-cli-design.md) - CLI design specification
- [D16-17-acp-integration](./decisions/D16-17-acp-integration.md) - ACP integration plan
- [D18-19-skill-design](./decisions/D18-19-skill-design.md) - Skill design specification
- [D20-21-skill-evolution](./decisions/D20-21-skill-evolution.md) - Skill evolution strategy
- [D22-human-agent-parity](./decisions/D22-human-agent-parity.md) - 🔴 Human-Agent parity (Core philosophy)
- [D23-26-objective-thread-model](./decisions/D23-26-objective-thread-model.md) - Objective-Thread model
- [D27-28-cli-dual-capabilities](./decisions/D27-28-cli-dual-capabilities.md) - CLI dual capabilities

### Notes (Analysis)
- [acp-research](./notes/acp-research.md) - ACP protocol research → supports D01, D16-17
- [swarm-analysis](./notes/swarm-analysis.md) - Swarm mode comparison → supports D02
- [thread-cli-commands](./notes/thread-cli-commands.md) - CLI command details → supports D12-15
- [skill-design-draft](./notes/skill-design-draft.md) - Skill design draft → supports D18-19

## 🔗 Document Relationship

```
                    outline.md (this document)
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    decisions/       notes/         external
         │               │               │
    ┌────┴────┐     ┌────┴────┐         │
    ▼         ▼     ▼         ▼         ▼
  D01 ◄───── acp-research    ACP Official
    │
  D02 ◄───── swarm-analysis ──► Swarm Docs
    │
  D04-11 ◄── (formed during discussion)
    │
  D12-15 ◄── thread-cli-commands
    │
  D16-17 ◄── acp-research
    │
  D18-19 ◄── skill-design-draft
    │
  D20-21 ◄── (formed during discussion)
    │
  D22 ◄──── (Core philosophy: Human-Agent Parity)
    │
  D23-26 ◄── Tech Stack Implementation Discussion
    │
    └──────► Thread Primitives Design (stream repo)
```

## 📊 Concept Model

```
┌─────────────────────────────────────────────────────────────┐
│                        Objective                             │
│  "Build a production-ready REST API for user management"    │
└─────────────────────────┬───────────────────────────────────┘
                          │ owns
                          ▼
     ┌────────────────────┼────────────────────┐
     │                    │                    │
     ▼                    ▼                    ▼
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Thread  │ ──ref── │ Thread  │ ──ref── │ Thread  │
│  (API)  │         │  (DB)   │         │ (Tests) │
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     ▼                   ▼                   ▼
  Artifacts           Artifacts           Artifacts
```

| Concept | Granularity | Analogy |
|---------|-------------|--------|
| **Objective** | Goal/Task | Epic / Top-level requirement |
| **Thread** | Execution unit | Session / Work context |
| **Artifact** | Output | Code, documents, configs, etc. |

## 🏗️ System Architecture

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
│   • transfer                │      • ...                        │
│   • inject                  │                                   │
│                             │                                   │
│   ↓ Agent invocation        │      ↓ Human interaction          │
└─────────────────────────────┴───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Leslie Core                                │
│   • Objective Manager                                            │
│   • Thread Manager                                               │
│   • Storage (SQLite + FS)                                        │
│   • ACP Client                                                   │
└─────────────────────────────────────────────────────────────────┘
```

| CLI Type | Target | Output | Interaction |
|----------|--------|--------|-------------|
| **Thread Primitives (A)** | Agent | JSON (machine-readable) | Non-interactive |
| **Task & UI (B)** | Human | Formatted (human-readable) | Interactive supported |
