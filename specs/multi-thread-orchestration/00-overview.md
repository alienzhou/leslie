# Leslie Multi-Thread Agent Orchestration Framework

> **Version**: 1.0  
> **Status**: Design Complete  
> **Last Updated**: 2026-02-09

## 1. Background and Objectives

### 1.1 Background

When using Claude Code for complex development tasks, developers often face the challenge of managing multiple parallel subtasks—each requiring independent context while needing to share certain information. Traditional single-threaded interactions cannot effectively handle this scenario.

Leslie is designed to address this problem by providing a **multi-thread agent orchestration framework** that enables:
- Parallel decomposition and execution of complex tasks
- Context isolation and selective sharing between threads
- Human-Agent parity collaboration model

### 1.2 Core Objectives

1. **Objective Management**: Organize work around top-level goals (Objectives)
2. **Thread Orchestration**: Manage multiple execution contexts (Threads) under each Objective
3. **Asset Sharing**: Enable controlled artifact sharing between Threads
4. **Human-Agent Collaboration**: Support seamless interaction between humans and AI agents

## 2. Core Concepts

### 2.1 Concept Hierarchy

| Concept | Granularity | Analogy |
|---------|-------------|---------|
| **Objective** | Goal/Task | An Epic / Top-level requirement |
| **Thread** | Execution unit | A Session / Work context |
| **Artifact** | Output | Code, documents, configs, etc. |

### 2.2 Conceptual Model

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

## 3. Design Philosophy

### 3.1 Human-Agent Parity (Core Principle)

> **This is not a fully automated system, but a Human-Agent parity collaboration system.**

Human ↔ Agent are **equal**, both can:
- Initiate tasks
- Intervene in execution
- Ask for help

| Interaction Mode | Description |
|------------------|-------------|
| **Human → Agent** | Traditional task assignment |
| **Agent → Human** | Agent requests human assistance |
| **Human Intervention** | Human proactively pauses/stops/redirects Agent |

### 3.2 Twin Isomorphism

Human and Agent use the same action language to operate Threads:

| Primitive | Human can do | Agent can do |
|-----------|--------------|--------------|
| spawn | Open new thread | Derive subtask |
| reference | Reference/mention | Reference context |
| lifecycle | Close/archive task | Complete/abandon |
| merge | Integrate conclusions | Aggregate outputs |
| transfer | Hand to AI | Request human approval |

## 4. System Architecture

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
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Leslie Core                                │
│   • Objective Manager                                            │
│   • Thread Manager                                               │
│   • Storage (JSON + FS)                                          │
│   • ACP Client                                                   │
└─────────────────────────────────────────────────────────────────┘
```

| CLI Type | Target | Output | Interaction |
|----------|--------|--------|-------------|
| **Thread Primitives (A)** | Agent | JSON (machine-readable) | Non-interactive |
| **Task & UI (B)** | Human | Formatted (human-readable) | Interactive supported |

## 5. Technology Selection

- **Protocol**: ACP (Agent Client Protocol) for Agent communication
- **Coordination Mode**: Agent peer collaboration first, central coordinator as fallback
- **Runtime**: TypeScript + Node.js 22.x
- **Storage**: JSON file for metadata, file system for artifacts

## 6. Scope

### In Scope (MVP)
- Objective and Thread lifecycle management
- Thread primitives: spawn, reference, lifecycle
- Asset management and cross-thread reference
- CLI interface for both humans and agents
- ACP integration with Claude Code

### Out of Scope (Future)
- Custom Agent kernel (use Claude Code first)
- Web UI
- Desktop application
- Headless mode

## 7. Related Documents

- [Thread Primitives Design](./01-thread-primitives.md)
- [Sharing Mechanism](./02-sharing-mechanism.md)
- [CLI Design Specification](./03-cli-design.md)
- [Human-Agent Parity](./04-human-agent-parity.md)

## 8. References

- [ACP Official Website](https://agentclientprotocol.com/)
- [AutoGen Swarm Documentation](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/swarm.html)
