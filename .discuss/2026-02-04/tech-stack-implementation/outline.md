# Tech Stack & Implementation Discussion

> Discussion Date: 2026-02-04
> Participant: alienzhou
> Context: Multi-thread Agent Orchestration Framework
> Status: ✅ Discussion Complete

## 🔵 Current Focus
- Discussion complete, decisions captured

## ⚪ Pending (Deferred to Implementation)
- (None - all design decisions captured)

## ✅ Confirmed Decisions

### Package & Naming
| ID | Decision | Rationale |
|----|----------|-----------|
| T00 | `@vibe-x-ai/leslie`, command `leslie spawn` | Unified branding, clear naming |

### Project Structure
| ID | Decision | Rationale |
|----|----------|-----------|
| T01a | Monorepo + pnpm workspace | Multi-package management, easy to extend |
| T01b | Packages: `@vibe-x-ai/leslie-core` / `@vibe-x-ai/leslie-cli` / web (future) | Separation of concerns |

### Language & Runtime
| ID | Decision | Rationale |
|----|----------|-----------|
| T02 | TypeScript + Node.js 22.x | Mature ecosystem, easy npm publishing |
| T03 | pnpm 9.x package manager | Monorepo workspace support |
| T04 | Don't build custom Agent, use Claude Code + ACP | Fast validation, focus on Thread orchestration |

### Dependencies
| ID | Dependency | Version | Purpose |
|----|------------|---------|---------|
| D01 | TypeScript | 5.x | Type safety |
| D02 | oclif | 4.x | CLI framework |
| D03 | zod | 3.x | Runtime validation |
| D04 | pino | 9.x | Logging |
| D05 | proper-lockfile | latest | File locking for JSON storage |

### Storage Layer
| ID | Decision | Rationale |
|----|----------|-----------|
| T05 | JSON file as metadata storage | Simple, human-readable, Agent-friendly (see [Thread Metadata Storage](../../2026-02-08/thread-metadata-storage/outline.md)) |
| T06 | File system storage | For artifacts, thread relations, extended configs |

### Interface & Interaction
| ID | Decision | Rationale |
|----|----------|-----------|
| T07 | CLI as MVP interface (oclif) | Minimal, plugin-based, automation-friendly |
| T08 | ACP Client for backend connection | Replaceable with any ACP-compatible Agent |

### Product Form
| ID | Decision | Rationale |
|----|----------|-----------|
| T10 | Publish as npm package | Get `leslie` command after install |
| T11 | Future extension to desktop/web | Not in MVP scope |

### Architecture Model
> These decisions are synced with D23-D26 in architecture discussion. See [D23-26-objective-thread-model](../multi-thread-agent-orchestration/decisions/D23-26-objective-thread-model.md) for details.

| ID | Decision | Rationale |
|----|----------|-----------|
| T12-T18 | Objective-driven model, CLI unified entry | Synced to D23-D26 |

## ❌ Rejected
| ID | Decision | Reason |
|----|----------|--------|
| R01 | Custom Agent kernel | Not for MVP, use Claude Code first |
| R02 | ACP Server mode | Thread is runtime instruction, no need to expose as service |
| R03 | SQLite as structured storage | Over-engineering for MVP, JSON file is sufficient |
| R04 | Headless mode | Deferred from MVP scope, may revisit later |

## 📚 Related Discussions
- [Multi-Thread Agent Orchestration Design](../multi-thread-agent-orchestration/outline.md) - Architecture and protocol decisions (D01-D26)

## 📂 Decision Documents
- [T-tech-stack-selection](./decisions/T-tech-stack-selection.md) - Tech stack selection summary
- [D-logging-debugging](./decisions/D-logging-debugging.md) - Logging and debugging system
- [D-error-handling](./decisions/D-error-handling.md) - Error handling strategy

## 📝 Architecture Diagrams

> Architecture diagrams are maintained in the architecture discussion. See: [Architecture Discussion](../multi-thread-agent-orchestration/outline.md#-concept-model)

### Monorepo Project Structure

```
leslie/
├── packages/
│   ├── core/                # @vibe-x-ai/leslie-core
│   ├── cli/                 # @vibe-x-ai/leslie-cli
│   └── web/                 # @vibe-x-ai/leslie-web (future)
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── README.md
```
