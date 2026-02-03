# D20-21: Skill Auto-generation and Evolution

> Status: ✅ Confirmed
> Decision Date: 2026-02-04

## Core Decisions

### D20: Skill Storage Location
- Auto-generated Skills are stored in **project-level directory**
- Following Claude Code conventions
- Project-level Skills have minimal pollution, good isolation

```
project/
└── .skills/              # Project-level Skill directory
    ├── auto-generated/   # Agent auto-generated
    │   └── parallel-research.md
    └── human-curated/    # Human curated
        └── code-review-flow.md
```

### D21: Skill Evolution Strategy
- **Do not preset composite Skills**
- Agent evolves them autonomously based on actual needs
- Core philosophy: **Basic primitives + Autonomous composition**

## Design Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Skill Evolution Path                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  System Prompt Injection                                         │
│  ├── Thread Primitives List                                      │
│  │   - spawn: Create child Thread                                │
│  │   - reference: Establish reference                            │
│  │   - merge: Merge outputs                                      │
│  │   - transfer: Transfer control                                │
│  │   - lifecycle: State control                                  │
│  │   - observe: Event subscription                               │
│  │   - inject: Information injection                             │
│  │   - rollback: Rollback                                        │
│  │                                                               │
│  └── Agent uses and combines autonomously                        │
│                                                                  │
│      ┌────────────────────────────────────────────────┐         │
│      │ Directly call basic primitives                 │         │
│      │ thread spawn --intent "..."                    │         │
│      │ thread reference --target ...                  │         │
│      └────────────────────────────────────────────────┘         │
│                          │                                       │
│                          ▼                                       │
│      ┌────────────────────────────────────────────────┐         │
│      │ Discover reuse patterns                        │         │
│      │ "I've done this scenario multiple times..."    │         │
│      └────────────────────────────────────────────────┘         │
│                          │                                       │
│                          ▼                                       │
│      ┌────────────────────────────────────────────────┐         │
│      │ Autonomously abstract into Skill               │         │
│      │ → Generate to project-level .skills/ directory │         │
│      │ → Reusable in future                           │         │
│      └────────────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Two Skill Sources

| Source | Description | Storage Location |
|--------|-------------|------------------|
| Human curated | Manually created based on human needs | `.skills/human-curated/` |
| Agent auto-generated | Abstracted after Agent discovers reuse patterns | `.skills/auto-generated/` |

## Conditions for Composite Skill Generation

Not preset, Agent determines based on actual situation:
- Is a complex scenario being repeatedly reused?
- Is it worth abstracting into a reusable pattern?

**If complex scenario is reused → High-integration Skill**
**If not → Just use basic primitives**

## Integration with Claude Code Skill Mechanism

- Follow Claude Code's Skill storage conventions
- Use project-level directory for isolation
- Agent has read/write access to Skills
