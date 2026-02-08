# D02: AGENTS.md Initialization Mechanism

**Status**: ✅ Confirmed  
**Decision Date**: 2026-02-08  
**Source**: Claude Code Asset Management Discussion

## Decision

Provide `leslie init` command to inject Leslie system usage guide into project AGENTS.md files.

## Block Marker Design

Use distinctive XML tag to wrap Leslie-managed content:

```xml
<leslie_system_guide version="1.0.0" description="Leslie Multi-Thread Agent Orchestration System Usage Guide">
<!-- ⚠️ This section is managed by Leslie. Do not edit manually. -->
<!-- To add custom agent guidelines, write OUTSIDE this block. -->

## Leslie Thread System

...content...

</leslie_system_guide>
```

**Attributes**:
- `version`: Semantic version (MAJOR.MINOR.PATCH)
- `description`: Human-readable description

## Insertion Strategy

| Scenario | Behavior |
|----------|----------|
| No AGENTS.md exists | Create new file with Leslie block |
| AGENTS.md exists, no Leslie block | Append Leslie block to end of file |
| AGENTS.md exists, Leslie block found | Update based on version (see below) |

**Insertion Location**: End of file (append)

## Version Update Policy

| Change Type | Update Behavior |
|-------------|-----------------|
| **MAJOR** (1.x.x → 2.x.x) | Ask user for confirmation before updating |
| **MINOR** (x.1.x → x.2.x) | Auto-update, print notification to console |
| **PATCH** (x.x.1 → x.x.2) | Auto-update, print notification to console |

**Rationale**:
- MAJOR: Structural changes may require user adjustment
- MINOR: New content additions are safe
- PATCH: Wording fixes are safe

## User Modification Policy

**No protection**: Users are responsible for not editing inside the block.

**Warning mechanism**: HTML comments in block clearly state "do not edit manually"

**If user edits**: Next `leslie init` will overwrite their changes (acceptable given clear warnings)

## Implementation Scope

### Core Algorithm
1. Parse AGENTS.md to find `<leslie_system_guide>` block
2. Extract version from block if exists
3. Compare versions using semver rules
4. Update/insert/skip based on version change type
5. Write updated content to file

### Template Storage
- Canonical template: `packages/cli/src/templates/leslie-system-guide.md`
- Template changes trigger version bump in CLI

## Related Decisions

| Decision | Relationship |
|----------|-------------|
| D01 Asset Management Architecture | D02 implements "AGENTS.md as usage guide" mechanism |
| D03 Block Content Specification | D03 defines content injected by D02 |

## Related Templates

- [Leslie System Guide Template](../templates/leslie-system-guide.md) - Full block content

---
← [Back to outline](../outline.md)
