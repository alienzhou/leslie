# D05: Asset File Naming Convention

**Status**: ✅ Confirmed  
**Decision Date**: 2026-02-08  
**Source**: Claude Code Asset Management Discussion

## Decision

Use timestamp-prefixed kebab-case format for asset files in directories (plan/, design/, learnings/).

## Recommended Format

```
{timestamp}-{topic-slug}.md
```

**Components**:
- **timestamp**: `YYYYMMDD` or `YYYYMMDD-HHmm`
- **topic-slug**: Kebab-case topic description

## Examples

### plan/ Directory
```
plan/
├── 20260208-project-overview.md
├── 20260208-1430-phase-1-authentication.md
└── 20260208-1445-phase-2-api-design.md
```

### design/ Directory
```
design/
├── 20260208-architecture-overview.md
├── 20260208-1400-database-schema.md
└── 20260208-1430-api-endpoints.md
```

### learnings/ Directory
```
learnings/
├── 20260208-auth-library-comparison.md
└── 20260208-1430-session-management-research.md
```

## Timestamp Formats

| Format | When to Use | Example |
|--------|-------------|---------|
| `YYYYMMDD` | Reference docs, single file per day | `20260208-architecture.md` |
| `YYYYMMDD-HHmm` | Multiple files same day | `20260208-1430-phase-1.md` |

## Topic Slug Guidelines

**Format**: Lowercase kebab-case

**Best Practices**:
- Descriptive but concise (3-6 words ideal)
- Use domain terminology
- Avoid special characters
- Max 50 characters

**Good**:
- ✓ `database-schema`
- ✓ `user-authentication-flow`
- ✓ `api-endpoint-design`

**Bad**:
- ✗ `DB_Schema` (mixed case, underscore)
- ✗ `user auth` (space)
- ✗ `file1` (not descriptive)

## Special Cases

### Single File Assets
When plan or design is single file:
```
plan.md          # No timestamp
design.md        # No timestamp
```

### Always-Single Files
```
progress.md      # Always one file, always overwritten
```

### Transcripts
Follow their own convention (D04):
```
{YYYYMMDD}-{HHmm}-{sanitized-user-query}.txt
```

## Rationale

### Why Timestamp Prefix?
1. Chronological sorting
2. Conflict avoidance
3. Context preservation
4. Easy navigation

### Why Kebab-Case?
1. URL-friendly
2. More readable than camelCase/snake_case
3. Standard in markdown documentation
4. Git-friendly (no escaping needed)

## Related Decisions

| Decision | Relationship |
|----------|-------------|
| D01 Asset Management | D05 defines naming for D01 asset types |
| D03 AGENTS.md Content | Naming documented in D03 |
| D04 Transcript Format | Transcript has its own convention |

---
← [Back to outline](../outline.md)
