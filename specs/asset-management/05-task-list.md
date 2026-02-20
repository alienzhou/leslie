# Task List - Asset Management

> **Status**: Planning Phase  
> **Last Updated**: 2026-02-09

## MVP Development Tasks

### Phase 1: Storage Infrastructure

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| A001 | Create `.leslie/` directory structure | P0 | Pending | On init |
| A002 | Implement thread directory management | P0 | Pending | Create/delete dirs |
| A003 | Implement asset path resolution | P0 | Pending | Given type, return path |

### Phase 2: Asset Type Support

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| A004 | Define asset type enum/constants | P0 | Pending | plan, progress, etc. |
| A005 | Implement asset existence checks | P0 | Pending | Verify asset exists |
| A006 | Implement asset listing | P0 | Pending | List thread assets |

### Phase 3: Context Injection

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| A007 | Implement `<thread_context>` XML builder | P0 | Pending | Core injection |
| A008 | Implement asset enumeration for context | P0 | Pending | List assets for injection |
| A009 | Implement reference injection | P0 | Pending | `<ref>` elements |
| A010 | Implement relations file injection | P1 | Pending | `relations_file` attr |

### Phase 4: AGENTS.md Integration

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| A011 | Create Leslie System Guide template | P0 | Pending | Markdown content |
| A012 | Implement AGENTS.md parser | P0 | Pending | Find Leslie block |
| A013 | Implement block insertion logic | P0 | Pending | Append or update |
| A014 | Implement version comparison | P0 | Pending | Semver comparison |
| A015 | Implement `leslie init` command | P0 | Pending | CLI entry point |

### Phase 5: Transcript Generation

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| A016 | Implement filename sanitization | P1 | Pending | Query → filename |
| A017 | Implement transcript formatter | P1 | Pending | Message → text |
| A018 | Implement truncation logic | P1 | Pending | Limit content size |
| A019 | Implement file cleanup | P1 | Pending | Max 50 files |
| A020 | Integrate with ACP message retrieval | P1 | Pending | Get conversation |

### Phase 6: Cross-Thread Reference

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| A021 | Implement reference asset resolution | P0 | Pending | Get ref assets |
| A022 | Implement one-level injection limit | P0 | Pending | No transitive |
| A023 | Implement broken reference handling | P1 | Pending | Skip + warn |

## Dependency Graph

```
A001 → A002 → A003
         ↓
       A004 → A005 → A006
         ↓
       A007 → A008 → A009 → A010
         ↓
       A011 → A012 → A013 → A014 → A015
         ↓
       A016 → A017 → A018 → A019 → A020
         ↓
       A021 → A022 → A023
```
