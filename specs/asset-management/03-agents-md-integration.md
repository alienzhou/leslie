# AGENTS.md Integration

> **Decision ID**: D02, D03  
> **Status**: ✅ Confirmed  
> **Last Updated**: 2026-02-09

## 1. Overview

Leslie injects a system usage guide into the project's AGENTS.md file to provide static context for all Agents working in the project.

## 2. Initialization Command

```bash
leslie init
```

### 2.1 Behavior

| Scenario | Behavior |
|----------|----------|
| No AGENTS.md exists | Create new file with Leslie block |
| AGENTS.md exists, no Leslie block | Append Leslie block to end of file |
| AGENTS.md exists, Leslie block found | Update based on version comparison |

### 2.2 Insertion Location

Append to end of file (after existing content).

## 3. Block Marker Design

```xml
<leslie_system_guide version="1.0.0" description="Leslie Multi-Thread Agent Orchestration System Usage Guide">
<!-- ⚠️ This section is managed by Leslie. Do not edit manually. -->
<!-- To add custom agent guidelines, write OUTSIDE this block. -->

## Leslie Thread System

...content...

</leslie_system_guide>
```

### 3.1 Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `version` | Semantic version | `1.0.0` |
| `description` | Human-readable description | `Leslie System Guide` |

## 4. Version Update Policy

| Change Type | Update Behavior | Example |
|-------------|-----------------|---------|
| **MAJOR** (1.x.x → 2.x.x) | Ask user for confirmation | Breaking changes |
| **MINOR** (x.1.x → x.2.x) | Auto-update, print notification | New features |
| **PATCH** (x.x.1 → x.x.2) | Auto-update, print notification | Bug fixes |

## 5. Block Content Structure

### 5.1 Overview Section

Brief introduction to Leslie's role and core concepts:
- Objective: Top-level goal
- Thread: Execution context
- Asset: Work outputs

### 5.2 Context Format Section

Explanation of `<thread_context>` XML structure:

```xml
<thread_context thread="thread-id" objective="obj-id">
  <asset type="plan" path="..." />
  <ref thread="other-id">
    <asset type="plan" path="..." />
  </ref>
</thread_context>
```

### 5.3 Asset Types Section

Each asset documented with five aspects:

| Aspect | Description |
|--------|-------------|
| **What** | Brief description |
| **Location** | File path pattern |
| **When** | When to create/update |
| **How to use** | Usage instructions |
| **Generation** | Who creates it |

Assets covered: plan, progress, design, learnings, transcript

### 5.4 Agent Responsibilities Section

Checklist of Agent duties:
1. Parse `<thread_context>` to understand scope
2. Create plan if none exists
3. Update progress after each step
4. Generate design/learnings as needed
5. Stay in scope (only modify own Thread's assets)

### 5.5 Thread Operations Section

CLI commands for Thread lifecycle:
```bash
leslie spawn --intent "..."           # Create Thread
leslie spawn --ref <thread-id>        # Create with reference
leslie lifecycle <id> done            # Mark complete
leslie lifecycle <id> blocked         # Mark blocked
```

### 5.6 Cross-Thread Reference Section

Rules for working with referenced assets:
- ✓ Read referenced assets as needed
- ✗ Do NOT modify other Threads' assets
- ✓ If changes needed, spawn new Thread or coordinate

### 5.7 Thread Relations Section

```markdown
### Thread Relations

**Storage Location**: `.leslie/thread_relations.json`

**Access**: The file path is provided in `<thread_context relations_file="...">` attribute.

**When to Query**:
- Context recovery after compression
- Dependency analysis
- Asset provenance tracing

**How to Query**: Use the `thread-relations` skill for detailed guidance.

**Important**: Do NOT modify this file directly. All modifications by Leslie CLI.
```

## 6. User Modification Policy

| Aspect | Policy |
|--------|--------|
| **Protection** | None (user responsibility) |
| **Warning** | HTML comments in block |
| **On user edit** | Next `leslie init` overwrites changes |

**Guidance**: Users should add custom content OUTSIDE the Leslie block.

## 7. Version Bump Triggers

| Change | Version Bump |
|--------|--------------|
| Add new asset type | MINOR |
| Change asset structure | MAJOR |
| Fix typos or wording | PATCH |
| Add CLI command | MINOR |
| Change core concepts | MAJOR |

## 8. Template Location

Canonical block content template: `packages/cli/src/templates/leslie-system-guide.md`

## 9. Design Principles

1. **Comprehensive**: Cover all essential information Agents need
2. **Concise**: Keep under ~800 words, ~3 min reading time
3. **Actionable**: Use concrete examples, not abstract descriptions
4. **Consistent**: Follow same structure across all sections

## 10. Related Documents

- [Context Injection](./02-context-injection.md)
- [Asset Types](./01-asset-types.md)
