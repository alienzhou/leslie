# D18-19: Skill Design Specification

> Status: ✅ Confirmed
> Decision Date: 2026-02-04

## Core Decisions

### D18: Skill Positioning
- **Skill = Descriptive knowledge**: Tells Agent how to do things
- **CLI = Execution capability**: Actually executes operations
- Agent learns through Skills, executes through CLI

### D19: Three Forms of Skill Using Primitives

| Form | Description | Example |
|------|-------------|---------|
| Composite | Combines multiple primitives into workflow | research-coordinator |
| Single | 1:1 correspondence with single primitive | thread-spawn |
| Context-free | Pure capability notice, no specific scenario | thread-basics |

## Skill Directory Structure

```
/skills/thread-system/
├── README.md                    # Overview
│
├── atomic/                      # Single-scenario Skills (1:1 with primitives)
│   ├── spawn/SKILL.md
│   ├── reference/SKILL.md
│   ├── merge/SKILL.md
│   ├── transfer/SKILL.md
│   └── lifecycle/SKILL.md
│
└── composite/                   # Composite Skills (roles/patterns)
    ├── research-coordinator/SKILL.md
    ├── task-decomposer/SKILL.md
    └── parallel-executor/SKILL.md
```

## Skill Injection Mechanism

```
┌─────────────────────────────────────────────────────────────┐
│                 Agent's Knowledge Sources                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. System Prompt (always present)                           │
│     - Tells Agent "you have Thread operation capabilities"   │
│     - Lists available Skills                                 │
│     - Does not contain specific command details              │
│                                                              │
│  2. On-demand Skill Loading                                  │
│     - Agent uses use_skill to load when needed               │
│     - Gets detailed command syntax and workflow guidance     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Example: Single-scenario Skill (thread-spawn)

```markdown
---
name: thread-spawn
description: "Create new Thread for subtasks"
---

# Thread Spawn

## When to Use
- Task can be broken into independent subtasks
- Need parallel execution
- Subtask requires clean context

## Command
thread spawn --intent "<description>" [--inherit partial] [--scope "..."]

## Example
thread spawn --intent "Research Redis" --inherit partial --scope "requirements"
```

## Example: Composite Skill (research-coordinator)

```markdown
---
name: research-coordinator
description: "Coordinate multi-threaded research"
---

# Research Coordinator

## Workflow
1. Decompose → identify 2-5 research directions
2. Spawn → `thread spawn` for each direction
3. Monitor → `thread list` + `thread status`
4. Reference → `thread reference --binding frozen`
5. Merge → `thread merge`
6. Synthesize → produce final report
```

## Related Decisions
- [D12-15 CLI Design](./D12-15-cli-design.md) - CLI commands that Skills invoke
- [D16-17 ACP Integration](./D16-17-acp-integration.md) - Skill injection method

## Related Notes
- [Skill Design Draft](../notes/skill-design-draft.md) - Detailed design proposal
- [Thread CLI Commands](../notes/thread-cli-commands.md) - Commands available for Skills

---
← [Back to outline](../outline.md)
