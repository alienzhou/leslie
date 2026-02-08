# D01: Asset Management Architecture

| Property               | Value                         |
| ---------------------- | ----------------------------- |
| **Status**       | ✅ Confirmed                  |
| **Date**         | 2026-02-04                    |
| **Participants** | alienzhou                     |
| **Related**      | D23-26-objective-thread-model |

## Context

When orchestrating agents with Claude Code, asset persistence and management needs to be addressed. The core question is: How to enable Agents to produce fixed asset files (like plan.md, progress.yml) with customization support?

Referenced the Spectra asset management system from the ide-agent project.

## Decision

### 1. Leslie's Role

Leslie is an **orchestrator and manager**, not a replacement for Claude Code. Asset management is one of its core responsibilities.

### 2. Dual-Layer Architecture

A complementary dual-layer design:

| Layer                                    | Responsibility                                 | Implementation   |
| ---------------------------------------- | ---------------------------------------------- | ---------------- |
| **Direction A (Prompt/AGENTS.md)** | Define what format assets Agent should produce | Plain text rules |
| **Direction B (Leslie CLI)**       | Manage asset storage, versioning, recall       | Code logic       |

### 3. Bidirectional Asset Flow

```
Leslie CLI ──inject asset paths──▶ Claude Code Agent
                                │
                                │ read & produce
                                ▼
           ◀──collect asset files──── Thread Asset Directory
```

- **Injection**: CLI injects asset paths into Agent context when starting a Thread
- **Production**: Agent creates/updates asset files following specifications
- **Collection**: CLI collects and organizes assets after conversation ends

### 4. Storage Location

Using **in-project storage**: `.leslie/threads/{thread-id}/`

Advantages:

- Agent can directly read/write
- Does not pollute user's home directory
- Follows project version control

### 5. Asset Types

| Asset                | Format    | Producer      | Timing             | Structure             |
| -------------------- | --------- | ------------- | ------------------ | --------------------- |
| **plan**       | .md       | Agent         | Before execution   | Single file/directory |
| **design**     | .md       | Agent         | Design phase       | Single file/directory |
| **progress**   | .yml→.md | Agent         | During execution   | Single file           |
| **discuss**    | .md       | Agent         | Before decisions   | Directory             |
| **learnings**  | .md       | Agent         | After research     | Directory             |
| **transcript** | .txt      | **CLI** | After conversation | Directory             |

### 6. Flexible Plan/Design Structure

- Can be a single `.md` file
- Or a directory composed of multiple files
- **Describe organization guidelines in AGENTS.md, let Agent decide on its own**

### 7. Transcript Generation Mechanism

- **Timing**: Generated programmatically by CLI after conversation ends
- **Source**: Under ACP integration, Leslie can directly obtain conversation information
- **Granularity**: One file per chatId
- **Advantage**: No Agent token consumption, format fully controllable

**Not adopting** Agent-invoked tool generation (high cost, slow)

### 8. Directory Structure

```
.leslie/
└── threads/
    └── {thread-id}/
        ├── plan.md              # or plan/ directory
        ├── design.md            # or design/ directory
        ├── progress.yml
        ├── discuss/
        ├── learnings/
        └── .meta/
            └── transcripts/
                └── {chatId}-{query}.txt
```

## Consequences

### Positive

- Unified and predictable asset formats
- Consistent asset paths for Agent production and usage
- Transcript does not consume Agent resources
- Flexible structure adapts to tasks of varying complexity

### Negative

- Need to maintain asset specifications in AGENTS.md
- Need to implement Transcript generation logic

## Related

- [D23-26 Objective/Thread Model](../multi-thread-agent-orchestration/decisions/D23-26-objective-thread-model.md)
- ide-agent Spectra system reference
