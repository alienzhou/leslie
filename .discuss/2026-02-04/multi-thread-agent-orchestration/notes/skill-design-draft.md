# Skill Design Draft

> Type: Design Draft
> Date: 2026-02-04

## Skill Classification

### Type A: Single-scenario Skills (Atomic Operations 1:1)

Each Thread primitive corresponds to one Skill:

| Skill | Corresponding Primitive | Description |
|-------|------------------------|-------------|
| thread-spawn | spawn | Create child Thread |
| thread-reference | reference | Establish reference |
| thread-merge | merge | Merge outputs |
| thread-transfer | transfer | Transfer control |
| thread-lifecycle | lifecycle | State control |

### Type B: Composite Skills (Roles/Patterns)

For specific roles or work patterns:

| Skill | Scenario | Combined Primitives |
|-------|----------|---------------------|
| research-coordinator | Research coordination | spawn, reference, merge |
| task-decomposer | Task decomposition | spawn, transfer |
| parallel-executor | Parallel execution | spawn, observe, merge |
| code-reviewer-team | Code review | spawn, transfer, merge |

## Directory Structure

```
/skills/thread-system/
├── README.md
│
├── atomic/
│   ├── spawn/SKILL.md
│   ├── reference/SKILL.md
│   ├── merge/SKILL.md
│   ├── transfer/SKILL.md
│   └── lifecycle/SKILL.md
│
└── composite/
    ├── research-coordinator/
    │   ├── SKILL.md
    │   └── examples/
    └── task-decomposer/
        └── SKILL.md
```

## Skill Templates

### Single-scenario Skill Template

```markdown
---
name: thread-spawn
description: "Create new Thread for subtasks"
---

# Thread Spawn

## When to Use
- [Scenario list]

## Command
```bash
thread spawn --intent "<description>" [options]
```

## Options
| Option | Description |
|--------|-------------|
| --intent | Task description |
| --inherit | Context inheritance method |

## Example
```bash
thread spawn --intent "Research Redis" --inherit partial
```

## Return
```json
{ "thread_id": "...", "status": "active" }
```
```

### Composite Skill Template

```markdown
---
name: research-coordinator
description: "Coordinate multi-threaded research"
---

# Research Coordinator

You are a Research Coordinator. Your job is to...

## Workflow

### 1. Decompose
[Description]

### 2. Spawn
```bash
thread spawn --intent "..."
```

### 3. Monitor
```bash
thread list
thread status <id>
```

### 4. Synthesize
[Description]

## Example Session
User: "Compare Redis, Memcached, and local caching"
You should:
1. Spawn 3 Threads
2. Wait for completion
3. Reference conclusions
4. Write comparison report
```

## Injection Mechanism

### System Prompt Declaration (Minimal)

```markdown
## Thread Capabilities

You can operate in a multi-Thread environment.

### Atomic Operations
- thread-spawn
- thread-reference
- thread-merge
- thread-transfer
- thread-lifecycle

### Composite Patterns
- research-coordinator
- task-decomposer

To use, load the corresponding skill.
```

### On-demand Loading

Agent calls `use_skill` to load detailed content when needed.

## To Be Discussed

1. **Skill Auto-generation**: Can Agent autonomously generate new Skills? Where to store them?
2. **Granularity Issue**: Should composite Skills be general or domain-specific?

## Related Decisions
- [D18-19 Skill Design Specification](../decisions/D18-19-skill-design.md) - Confirmed design decisions
- [D12-15 CLI Design](../decisions/D12-15-cli-design.md) - Commands that Skills can call

## Related Notes
- [Thread CLI Command Details](./thread-cli-commands.md) - Complete command syntax

---
← [Back to outline](../outline.md)
