# Task List - Tech Stack Implementation

> **Status**: Planning Phase  
> **Last Updated**: 2026-02-09

## MVP Development Tasks

### Phase 1: Project Setup

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| S001 | Initialize pnpm workspace | P0 | Pending | pnpm-workspace.yaml |
| S002 | Create core package structure | P0 | Pending | packages/core |
| S003 | Create CLI package structure | P0 | Pending | packages/cli |
| S004 | Configure shared tsconfig | P0 | Pending | tsconfig.base.json |
| S005 | Set up ESLint and Prettier | P0 | Pending | Code quality |
| S006 | Configure package.json scripts | P0 | Pending | build, test, lint |

### Phase 2: Core Package

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| S007 | Define core TypeScript types | P0 | Pending | Thread, Objective, etc. |
| S008 | Implement JSON storage manager | P0 | Pending | With file locking |
| S009 | Implement file storage manager | P0 | Pending | Artifacts, context |
| S010 | Implement Thread manager | P0 | Pending | CRUD + state machine |
| S011 | Implement Objective manager | P0 | Pending | CRUD + completion |
| S012 | Implement ACP client wrapper | P0 | Pending | Connect to Claude Code |

### Phase 3: CLI Package

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| S013 | Set up oclif CLI framework | P0 | Pending | Basic structure |
| S014 | Implement spawn command | P0 | Pending | Core primitive |
| S015 | Implement reference command | P0 | Pending | Core primitive |
| S016 | Implement lifecycle command | P0 | Pending | Core primitive |
| S017 | Implement list command | P0 | Pending | Query |
| S018 | Implement status command | P0 | Pending | Query |
| S019 | Implement init command | P0 | Pending | AGENTS.md |

### Phase 4: Logging System

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| S020 | Configure pino logger | P0 | Pending | Logfmt format |
| S021 | Implement log directory management | P0 | Pending | ~/.leslie/logs |
| S022 | Implement thread logger factory | P0 | Pending | Per-thread logs |
| S023 | Implement debug mode toggle | P0 | Pending | --debug flag |

### Phase 5: Error Handling

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| S024 | Define error code constants | P0 | Pending | T1xx-T9xx |
| S025 | Implement CLIError class | P0 | Pending | Structured errors |
| S026 | Implement retry utility | P0 | Pending | Exponential backoff |
| S027 | Implement warning handling | P1 | Pending | Non-fatal issues |
| S028 | Implement file recovery | P1 | Pending | Backup + restore |

### Phase 6: Testing

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| S029 | Set up Jest testing | P0 | Pending | Unit tests |
| S030 | Write core package tests | P0 | Pending | Storage, managers |
| S031 | Write CLI command tests | P0 | Pending | Command behavior |
| S032 | Write integration tests | P1 | Pending | End-to-end |

### Phase 7: Distribution

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| S033 | Configure npm publishing | P0 | Pending | @vibe-x-ai scope |
| S034 | Set up GitHub Actions CI | P0 | Pending | Build + test |
| S035 | Create README.md | P0 | Pending | Usage docs |
| S036 | Create CHANGELOG.md | P1 | Pending | Version history |

## Dependency Graph

```
S001 → S002 → S003 → S004 → S005 → S006
         ↓
       S007 → S008 → S009 → S010 → S011 → S012
         ↓
       S013 → S014 → S015 → S016 → S017 → S018 → S019
         ↓
       S020 → S021 → S022 → S023
         ↓
       S024 → S025 → S026 → S027 → S028
         ↓
       S029 → S030 → S031 → S032
         ↓
       S033 → S034 → S035 → S036
```
