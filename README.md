# Leslie

> Multi-thread Agent Orchestration Framework with Human-Agent Parity

[![npm version](https://img.shields.io/npm/v/@vibe-x-ai/leslie.svg)](https://www.npmjs.com/package/@vibe-x-ai/leslie)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[中文文档](./README.zh-CN.md) | English

## Overview

Leslie is a multi-thread Agent orchestration framework built on the core philosophy of **Human-Agent Parity**.

Traditional Agent systems:
> Human assigns task → Agent auto-decomposes and executes → Produces result

Leslie's design philosophy:
> Human ↔ Agent are **equal**, both can initiate, intervene, and ask for help

## Core Concepts

### Objective
Top-level task unit. All Threads belong to an Objective.

### Thread
Execution unit, corresponding to an Agent Session. Supports:
- Lifecycle management (spawn, pause, resume, terminate)
- State sharing (artifacts, reference)
- Interruption recovery (context snapshot + replay)

### Three Interaction Modes

| Mode | Description |
|------|-------------|
| Human → Agent | Human assigns task, Agent decomposes and executes |
| Agent → Human | Agent encounters difficulty, proactively asks human for help |
| Human Intervention | Human intervenes, pauses, or corrects Agent at any time |

## Installation

```bash
npm install -g @vibe-x-ai/leslie
# or
pnpm add -g @vibe-x-ai/leslie
```

## Quick Start

```bash
# Create an Objective
leslie objective create "Build a REST API for user management"

# Spawn a Thread
leslie spawn --intent "Design database schema"

# List running Threads
leslie list

# Connect to a Thread to view status
leslie connect thread-abc123
```

## CLI Commands

### Basic Commands

| Command | Description |
|---------|-------------|
| `leslie spawn` | Create new Thread |
| `leslie list` | List all Threads |
| `leslie status <id>` | View Thread status |
| `leslie connect <id>` | Connect to running Thread |

### Objective Management

| Command | Description |
|---------|-------------|
| `leslie objective create` | Create Objective |
| `leslie objective list` | List all Objectives |
| `leslie objective status <id>` | View Objective status |

### Lifecycle Control

| Command | Description |
|---------|-------------|
| `leslie lifecycle --action suspend` | Suspend Thread |
| `leslie lifecycle --action resume` | Resume Thread |
| `leslie lifecycle --action cancel` | Cancel Thread |

### Collaboration Commands

| Command | Description |
|---------|-------------|
| `leslie reference` | Establish reference between Threads |
| `leslie merge` | Merge outputs from multiple Threads |
| `leslie transfer` | Transfer control |
| `leslie inject` | Inject information into Thread |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Interface                           │
│         leslie spawn / list / connect / objective            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Objective Manager                          │
│   - Objective lifecycle                                      │
│   - Thread orchestration under Objective                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Thread Manager                            │
│   - Thread lifecycle (spawn, pause, resume, terminate)       │
│   - State machine & event dispatch                           │
│   - Sharing mechanism (artifacts, reference)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Storage  │   │   ACP    │   │  IPC /   │
    │ (SQLite) │   │  Client  │   │ Headless │
    └──────────┘   └────┬─────┘   └──────────┘
                        │
                        ▼
               ┌────────────────┐
               │  Claude Code   │
               │  (via ACP)     │
               └────────────────┘
```

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | 5.x | Type safety |
| Node.js | 22.x | Runtime |
| oclif | 4.x | CLI framework |
| better-sqlite3 | 11.x | Local storage |
| ACP | - | Agent communication protocol |

## Project Structure

```
leslie/
├── packages/
│   ├── core/                # @vibe-x-ai/leslie-core
│   │   ├── src/
│   │   │   ├── objective/   # Objective management
│   │   │   ├── thread/      # Thread lifecycle
│   │   │   ├── storage/     # SQLite + FS
│   │   │   └── acp/         # ACP Client
│   │   └── package.json
│   │
│   ├── cli/                 # @vibe-x-ai/leslie-cli
│   │   ├── src/commands/
│   │   └── package.json
│   │
│   └── web/                 # @vibe-x-ai/leslie-web (future)
│
├── pnpm-workspace.yaml
└── package.json
```

## Development

```bash
# Clone repository
git clone git@github.com:vibe-x-ai/leslie.git
cd leslie

# Install dependencies
pnpm install

# Build
pnpm build

# Local testing
pnpm dev
```

## Design Documents

Detailed design decisions are documented in the `.discuss/` directory:

- [Architecture Design Discussion](.discuss/2026-02-04/multi-thread-agent-orchestration/outline.md)
- [Tech Stack Selection](.discuss/2026-02-04/tech-stack-implementation/outline.md)
- [Human-Agent Parity Design](.discuss/2026-02-04/multi-thread-agent-orchestration/decisions/D22-human-agent-parity.md)

## Protocols

- **Agent Communication**: [ACP (Agent Client Protocol)](https://agentclientprotocol.com/)
- **Thread Primitives**: Based on Tier 1-3 Thread Primitives design

## License

MIT © [vibe-x-ai](https://github.com/vibe-x-ai)
