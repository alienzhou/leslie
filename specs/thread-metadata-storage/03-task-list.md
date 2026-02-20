# Task List - Thread Metadata Storage

> **Status**: Planning Phase  
> **Last Updated**: 2026-02-09

## MVP Development Tasks

### Phase 1: Schema Definition

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| M001 | Define TypeScript interfaces | P0 | Pending | ThreadRelations, ThreadInfo, etc. |
| M002 | Create Zod validation schema | P0 | Pending | Runtime validation |
| M003 | Write schema documentation | P0 | Pending | JSON schema reference |

### Phase 2: Storage Implementation

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| M004 | Implement file read function | P0 | Pending | With error handling |
| M005 | Implement file write function | P0 | Pending | With file locking |
| M006 | Implement backup mechanism | P0 | Pending | .bak before write |
| M007 | Implement recovery from backup | P1 | Pending | On parse failure |

### Phase 3: CRUD Operations

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| M008 | Implement thread creation | P0 | Pending | Add to threads dict |
| M009 | Implement thread update | P0 | Pending | Update fields |
| M010 | Implement thread status change | P0 | Pending | active/frozen/archived |
| M011 | Implement thread deletion | P1 | Pending | Remove from all sections |

### Phase 4: Operations History

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| M012 | Implement operation recording | P0 | Pending | Add to operations array |
| M013 | Implement operation ID generation | P0 | Pending | Unique IDs |
| M014 | Implement operations querying | P1 | Pending | Filter by command, time |

### Phase 5: Relations Management

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| M015 | Implement relation creation | P0 | Pending | On spawn, reference |
| M016 | Implement relation update | P0 | Pending | On changes |
| M017 | Implement relation cache rebuild | P1 | Pending | From operations |
| M018 | Implement circular reference check | P0 | Pending | On reference creation |

### Phase 6: Query Functions

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| M019 | Implement thread lookup | P0 | Pending | By ID |
| M020 | Implement threads filtering | P0 | Pending | By status, tags |
| M021 | Implement children lookup | P0 | Pending | Get child threads |
| M022 | Implement references lookup | P0 | Pending | Get referenced threads |
| M023 | Implement dependency traversal | P1 | Pending | Full dependency chain |

### Phase 7: Agent Integration

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| M024 | Create thread-relations skill | P0 | Pending | Query guidance |
| M025 | Update AGENTS.md template | P0 | Pending | Add relations section |
| M026 | Update context injection | P0 | Pending | Add relations_file attr |

## Dependency Graph

```
M001 → M002 → M003
         ↓
       M004 → M005 → M006 → M007
         ↓
       M008 → M009 → M010 → M011
         ↓
       M012 → M013 → M014
         ↓
       M015 → M016 → M017 → M018
         ↓
       M019 → M020 → M021 → M022 → M023
         ↓
       M024 → M025 → M026
```
