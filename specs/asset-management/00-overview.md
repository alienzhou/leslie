# Leslie Asset Management Architecture

> **Version**: 1.0  
> **Status**: Design Complete  
> **Last Updated**: 2026-02-09

## 1. Background and Objectives

### 1.1 Background

When using Claude Code for complex development tasks, developers face a challenge: how to enable Agents to produce fixed, structured asset files (like `plan.md`, `progress.md`) while supporting customization and persistence.

This design addresses the asset persistence and management needs in the Leslie multi-thread orchestration framework.

### 1.2 Core Objectives

1. **Asset Definition**: Define standard asset types and formats
2. **Asset Flow**: Enable bidirectional asset flow between CLI and Agent
3. **Context Injection**: Provide assets as context to Agents
4. **Cross-Thread Reference**: Enable controlled asset sharing between Threads

## 2. Leslie's Role

> **Leslie is an orchestrator and manager, not a replacement for Claude Code.**

Asset management is one of its core responsibilities:
- Define what format assets Agent should produce (via AGENTS.md)
- Manage asset storage, versioning, recall (via CLI)

## 3. Dual-Layer Architecture

| Layer | Responsibility | Implementation |
|-------|----------------|----------------|
| **Direction A (Prompt/AGENTS.md)** | Define asset format specifications | Plain text rules |
| **Direction B (Leslie CLI)** | Manage asset storage, versioning, recall | Code logic |

## 4. Bidirectional Asset Flow

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

## 5. Storage Location

Using **in-project storage**: `.leslie/threads/{thread-id}/`

**Advantages**:
- Agent can directly read/write
- Does not pollute user's home directory
- Follows project version control

## 6. Asset Types

| Asset | Format | Producer | Timing | Structure |
|-------|--------|----------|--------|-----------|
| **plan** | .md | Agent | Before execution | Single file/directory |
| **design** | .md | Agent | Design phase | Single file/directory |
| **progress** | .md | Agent | During execution | Single file |
| **discuss** | .md | Agent | Before decisions | Directory |
| **learnings** | .md | Agent | After research | Directory |
| **transcript** | .txt | **CLI** | After conversation | Directory |

## 7. Directory Structure

```
.leslie/
├── threads/
│   └── {thread-id}/
│       ├── plan.md              # or plan/ directory
│       ├── design.md            # or design/ directory
│       ├── progress.md
│       ├── discuss/
│       ├── learnings/
│       └── .meta/
│           └── transcripts/
│               └── {YYYYMMDD}-{HHmm}-{query}.txt
└── thread_relations.json        # Thread relationships
```

## 8. Context Injection Design

### 8.1 Layered Design

| Layer | Content | Update Frequency |
|-------|---------|------------------|
| **AGENTS.md** | Static Leslie system usage guide | On version update |
| **User Message** | Dynamic `<thread_context>` + task description | Per conversation |

### 8.2 Thread Context Format

```xml
<thread_context 
  thread="thread-123" 
  objective="obj-456"
  relations_file=".leslie/thread_relations.json">
  
  <asset type="plan" path=".leslie/threads/thread-123/plan.md" />
  <asset type="design" path=".leslie/threads/thread-123/design/api-spec.md" />
  
  <ref thread="thread-456">
    <asset type="plan" path=".leslie/threads/thread-456/plan.md" />
  </ref>
</thread_context>

User's actual task description...
```

## 9. AGENTS.md Integration

### 9.1 Initialization Mechanism (`leslie init`)

| Scenario | Behavior |
|----------|----------|
| No AGENTS.md exists | Create new file with Leslie block |
| AGENTS.md exists, no Leslie block | Append Leslie block to end of file |
| AGENTS.md exists, Leslie block found | Update based on version |

### 9.2 Block Marker

```xml
<leslie_system_guide version="1.0.0" description="Leslie System Guide">
<!-- ⚠️ This section is managed by Leslie. Do not edit manually. -->

## Leslie Thread System
...content...

</leslie_system_guide>
```

### 9.3 Version Update Policy

| Change Type | Update Behavior |
|-------------|-----------------|
| **MAJOR** | Ask user for confirmation |
| **MINOR** | Auto-update, print notification |
| **PATCH** | Auto-update, print notification |

## 10. Scope

### In Scope (MVP)
- Asset type definitions and storage structure
- Context injection mechanism
- AGENTS.md initialization
- Transcript generation
- Cross-thread reference (one-level)

### Out of Scope (Future)
- Asset version control (beyond Git)
- Compression protection strategy
- Live binding reference

## 11. Related Documents

- [Asset Types Specification](./01-asset-types.md)
- [Context Injection Design](./02-context-injection.md)
- [AGENTS.md Integration](./03-agents-md-integration.md)
- [Transcript Format](./04-transcript-format.md)
