# Asset Types Specification

> **Decision ID**: D01, D05  
> **Status**: ✅ Confirmed  
> **Last Updated**: 2026-02-09

## 1. Asset Type Overview

| Asset | Required | Producer | Format | Structure |
|-------|----------|----------|--------|-----------|
| plan | ✅ | Agent | .md | Single file or directory |
| progress | ✅ | Agent | .md | Single file (always overwritten) |
| design | Optional | Agent | .md | Single file or directory |
| learnings | Optional | Agent | .md | Directory |
| discuss | Optional | Agent | .md | Directory |
| transcript | Read-only | CLI | .txt | Directory |

## 2. Asset Type Details

### 2.1 plan — Task Planning

| Aspect | Description |
|--------|-------------|
| **What** | Task breakdown, execution sequence, dependencies |
| **Location** | `.leslie/threads/{thread-id}/plan.md` or `plan/` |
| **When** | Before execution starts; update when scope changes |
| **How to use** | Reference for task tracking; basis for progress updates |
| **Generation** | Agent creates based on Objective |

**Structure Options**:
- **Simple tasks**: Single `plan.md` file
- **Complex tasks**: `plan/` directory with multiple files
  - `plan/20260208-overview.md`
  - `plan/20260208-1430-phase-1.md`

### 2.2 progress — Execution Status

| Aspect | Description |
|--------|-------------|
| **What** | Current execution status, completed items, blockers |
| **Location** | `.leslie/threads/{thread-id}/progress.md` |
| **When** | Update after each significant step |
| **How to use** | Track progress, identify blockers, resume work |
| **Generation** | Agent creates and updates continuously |

**Format** (recommended):
```markdown
# Progress

## Completed
- [x] Task 1: Description
- [x] Task 2: Description

## In Progress
- [ ] Task 3: Description

## Blocked
- [ ] Task 4: Waiting for dependency X

## Next Steps
1. Complete Task 3
2. Resolve blocker for Task 4
```

### 2.3 design — Technical/Product Design

| Aspect | Description |
|--------|-------------|
| **What** | Architecture decisions, API specs, data models |
| **Location** | `.leslie/threads/{thread-id}/design.md` or `design/` |
| **When** | During design phase, before implementation |
| **How to use** | Reference for implementation; basis for review |
| **Generation** | Agent creates based on requirements |

**Structure Options**:
- **Simple design**: Single `design.md` file
- **Complex design**: `design/` directory
  - `design/20260208-architecture.md`
  - `design/20260208-api-spec.md`
  - `design/20260208-database-schema.md`

### 2.4 learnings — Research Findings

| Aspect | Description |
|--------|-------------|
| **What** | Research results, comparisons, recommendations |
| **Location** | `.leslie/threads/{thread-id}/learnings/` |
| **When** | After research or investigation tasks |
| **How to use** | Reference for decisions; knowledge preservation |
| **Generation** | Agent creates after analysis |

**Naming Convention**:
```
learnings/
├── 20260208-auth-library-comparison.md
├── 20260208-caching-strategies.md
└── 20260208-1430-redis-vs-memcached.md
```

### 2.5 discuss — Discussion Content

| Aspect | Description |
|--------|-------------|
| **What** | Discussion outlines, decision points, pros/cons |
| **Location** | `.leslie/threads/{thread-id}/discuss/` |
| **When** | Before major decisions |
| **How to use** | Trace decision rationale; revisit alternatives |
| **Generation** | Agent creates during discussion |

**Naming Convention**:
```
discuss/
├── 20260208-api-design-options.md
└── 20260208-database-selection.md
```

### 2.6 transcript — Execution Trace

| Aspect | Description |
|--------|-------------|
| **What** | Conversation history, tool calls, results |
| **Location** | `.leslie/threads/{thread-id}/.meta/transcripts/` |
| **When** | Auto-generated after conversation ends |
| **How to use** | Debug, audit, replay (read-only) |
| **Generation** | CLI generates programmatically |

**Naming Convention**:
```
{YYYYMMDD}-{HHmm}-{sanitized-user-query}.txt
```

**Example**: `20260208-1430-fix-login-bug.txt`

## 3. File Naming Convention

### 3.1 Timestamp-Prefixed Format

```
{timestamp}-{topic-slug}.md
```

| Format | When to Use | Example |
|--------|-------------|---------|
| `YYYYMMDD` | Single file per day | `20260208-architecture.md` |
| `YYYYMMDD-HHmm` | Multiple files same day | `20260208-1430-phase-1.md` |

### 3.2 Topic Slug Guidelines

- **Format**: Lowercase kebab-case
- **Length**: 3-6 words ideal, max 50 characters
- **Content**: Descriptive, domain terminology

**Good Examples**:
- ✓ `database-schema`
- ✓ `user-authentication-flow`
- ✓ `api-endpoint-design`

**Bad Examples**:
- ✗ `DB_Schema` (mixed case, underscore)
- ✗ `user auth` (space)
- ✗ `file1` (not descriptive)

## 4. Flexible Structure Principle

> **Describe organization guidelines in AGENTS.md, let Agent decide on its own.**

- Simple tasks → Single file
- Complex tasks → Directory with multiple files
- Agent has autonomy to choose appropriate structure
- Agent should explain structure choice in the files

## 5. Related Documents

- [Context Injection](./02-context-injection.md)
- [Transcript Format](./04-transcript-format.md)
