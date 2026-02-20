# Task List - Multi-Thread Agent Orchestration

> **Status**: Planning Phase  
> **Last Updated**: 2026-02-09

## MVP Development Tasks

### Phase 1: Core Infrastructure

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| T001 | Set up monorepo with pnpm workspace | P0 | Pending | packages/core, packages/cli |
| T002 | Configure TypeScript with shared base config | P0 | Pending | tsconfig.base.json |
| T003 | Set up oclif CLI framework | P0 | Pending | @vibe-x-ai/leslie-cli |
| T004 | Implement JSON storage layer | P0 | Pending | thread_relations.json |
| T005 | Implement file lock mechanism | P0 | Pending | proper-lockfile |

### Phase 2: Thread Primitives (Tier 1)

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| T006 | Implement `spawn` command | P0 | Pending | Core primitive |
| T007 | Implement `reference` command | P0 | Pending | Frozen binding first |
| T008 | Implement `lifecycle` command | P0 | Pending | done/cancel/archive |
| T009 | Implement Thread state machine | P0 | Pending | See D03 |
| T010 | Implement inheritance logic | P0 | Pending | full/partial/none |

### Phase 3: Asset Management

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| T011 | Define asset directory structure | P0 | Pending | .leslie/threads/{id}/ |
| T012 | Implement context injection | P0 | Pending | `<thread_context>` XML |
| T013 | Implement cross-thread reference | P0 | Pending | --ref flag |
| T014 | Implement circular reference detection | P1 | Pending | At spawn time |
| T015 | Implement broken reference handling | P1 | Pending | Non-blocking warning |

### Phase 4: Query & Status

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| T016 | Implement `list` command | P0 | Pending | Filter by status |
| T017 | Implement `status` command | P0 | Pending | Thread details |
| T018 | Implement `artifacts` command | P0 | Pending | List thread outputs |

### Phase 5: Collaboration Primitives (Tier 2)

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| T019 | Implement `merge` command | P1 | Pending | Artifact merging |
| T020 | Implement conflict detection | P1 | Pending | File-level conflicts |
| T021 | Implement `transfer` command | P1 | Pending | request_approval/delegate |

### Phase 6: AGENTS.md Integration

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| T022 | Implement `leslie init` command | P0 | Pending | Inject to AGENTS.md |
| T023 | Create Leslie System Guide template | P0 | Pending | XML block content |
| T024 | Implement version checking logic | P1 | Pending | Major/minor updates |

### Phase 7: ACP Integration

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| T025 | Implement ACP Client | P0 | Pending | Connect to Claude Code |
| T026 | Implement Thread = Session mapping | P0 | Pending | See D16-17 |
| T027 | Implement transcript generation | P1 | Pending | Post-conversation |

## Dependency Graph

```
T001 → T002 → T003
         ↓
       T004 → T005
         ↓
       T006 → T007 → T008
         ↓
       T011 → T012 → T013
         ↓
       T016 → T017 → T018
         ↓
       T019 → T020 → T021
         ↓
       T022 → T023 → T024
         ↓
       T025 → T026 → T027
```
