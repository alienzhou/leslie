# Leslie Technical Specifications

> **Version**: 1.0  
> **Last Updated**: 2026-02-09

This directory contains the technical design documents for the Leslie Multi-Thread Agent Orchestration Framework.

## Document Structure

All documents follow the [tech-doc-organizer](../.discuss/2026-02-04/claude-code-asset-management/decisions/D01-asset-management-architecture.md) specification:

| Doc Type | Status | Description |
|----------|--------|-------------|
| 00-overview.md | Required | High-level summary and objectives |
| 01-xx.md ~ 04-xx.md | Required | Technical design details |
| 0x-task-list.md | Required | Development task breakdown |
| 0x-cr-issues.md | Required | Code review issues tracker |
| 0x-verification-checklist.md | Required | Acceptance criteria |
| 0x-backlog.md | Required | Deferred and rejected items |

## Topic Overview

### 1. Multi-Thread Orchestration

**Directory**: `multi-thread-orchestration/`

Core framework design for managing multiple agent threads working on related tasks.

| Document | Description |
|----------|-------------|
| [00-overview.md](./multi-thread-orchestration/00-overview.md) | Framework overview and architecture |
| [01-thread-primitives.md](./multi-thread-orchestration/01-thread-primitives.md) | spawn, reference, lifecycle, merge, transfer |
| [02-sharing-mechanism.md](./multi-thread-orchestration/02-sharing-mechanism.md) | Artifact sharing and cross-thread reference |
| [03-cli-design.md](./multi-thread-orchestration/03-cli-design.md) | CLI commands and output formats |
| [04-human-agent-parity.md](./multi-thread-orchestration/04-human-agent-parity.md) | Human-Agent collaboration model |

### 2. Asset Management

**Directory**: `asset-management/`

Asset persistence, format specifications, and context injection mechanisms.

| Document | Description |
|----------|-------------|
| [00-overview.md](./asset-management/00-overview.md) | Asset management architecture |
| [01-asset-types.md](./asset-management/01-asset-types.md) | plan, progress, design, learnings, transcript |
| [02-context-injection.md](./asset-management/02-context-injection.md) | `<thread_context>` XML format |
| [03-agents-md-integration.md](./asset-management/03-agents-md-integration.md) | AGENTS.md block injection |
| [04-transcript-format.md](./asset-management/04-transcript-format.md) | Execution trace format |

### 3. Tech Stack

**Directory**: `tech-stack/`

Technology selection, logging, and error handling strategies.

| Document | Description |
|----------|-------------|
| [00-overview.md](./tech-stack/00-overview.md) | Tech stack selection and project structure |
| [01-logging-system.md](./tech-stack/01-logging-system.md) | logfmt format, log levels, debug mode |
| [02-error-handling.md](./tech-stack/02-error-handling.md) | Error codes, retry mechanism, warnings |

### 4. Thread Metadata Storage

**Directory**: `thread-metadata-storage/`

JSON-based storage design for thread relationships and operations history.

| Document | Description |
|----------|-------------|
| [00-overview.md](./thread-metadata-storage/00-overview.md) | Storage solution overview |
| [01-json-schema.md](./thread-metadata-storage/01-json-schema.md) | Complete JSON schema specification |
| [02-agent-query-guide.md](./thread-metadata-storage/02-agent-query-guide.md) | Agent query patterns and examples |

## Quick Reference

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Objective** | Top-level goal or task (Epic-level) |
| **Thread** | Execution unit with independent context |
| **Artifact** | Work output (plan, design, code, etc.) |

### Key Design Principles

1. **Human-Agent Parity**: Human and Agent are equal collaborators
2. **Twin Isomorphism**: Same primitives for both Human and Agent
3. **Share Artifacts, Not Messages**: Structured outputs, not conversation history
4. **JSON for MVP**: Simple storage, upgrade path to SQLite if needed

### Technology Stack

| Component | Choice |
|-----------|--------|
| Language | TypeScript 5.x |
| Runtime | Node.js 22.x LTS |
| CLI Framework | oclif 4.x |
| Storage | JSON file + File system |
| Protocol | ACP (Agent Client Protocol) |

## Version Management

**Strategy**: These specs are **living documents** that evolve with implementation.

- **No version directories**: Specs organized by module, not version
- **Version history**: Tracked via Git tags (e.g., `v0.1.0`, `v0.2.0`)
- **View past versions**: Use `git show v0.1.0:specs/README.md` to view historical snapshots
- **Discussion snapshots**: Preserved in `.discuss/YYYY-MM-DD/` directories as read-only archives

**Why no version directories?**
- Avoids fragmenting module documentation across multiple directories
- Git provides superior version tracking and diffing
- Simplifies navigation and maintenance

## Source Materials

These specifications are consolidated from discussion documents in:

- `.discuss/2026-02-04/multi-thread-agent-orchestration/`
- `.discuss/2026-02-04/claude-code-asset-management/`
- `.discuss/2026-02-04/tech-stack-implementation/`
- `.discuss/2026-02-08/thread-metadata-storage/`

## Contributing

When updating these documents:

1. Update the relevant spec document
2. Update task lists if scope changes
3. Add CR issues for implementation concerns
4. Update verification checklist if acceptance criteria change
5. Move out-of-scope items to backlog with rationale
6. Maintain consistency across related documents (see tech-doc-organizer guidelines)
