# D07: Progress.md Format Standardization

**Status**: ✅ Confirmed  
**Decision Date**: 2026-02-08  
**Source**: Claude Code Asset Management Discussion

## Decision

Define standard format for `progress.md` to ensure consistency across Agents and Threads.

## File Structure

```markdown
# Progress

## In Progress
- [ ] Task currently being worked on

## Completed
- [x] Task that has been finished

## Blocked
- [ ] Task that cannot proceed (reason in parentheses)
```

## Section Definitions

| Section | Purpose | Checkbox | Criteria |
|---------|---------|----------|----------|
| **In Progress** | Active work | `[ ]` | Work started, no blockers |
| **Completed** | Finished tasks | `[x]` | Work done and verified |
| **Blocked** | Paused tasks | `[ ]` | External dependency or issue |

**Blocked format**: Include reason
```markdown
- [ ] Deploy to staging (waiting for AWS credentials)
```

## Optional Elements

### Completion Percentage
```markdown
# Progress

**Overall Completion**: 60% (6/10 tasks completed)
```

- Format: `**Overall Completion**: {percent}% ({done}/{total} tasks completed)`
- Use for complex Threads with many tasks

### Timestamps
```markdown
- [x] Set up database schema (2026-02-08 14:30)
```

- Format: `(YYYY-MM-DD HH:mm)` at end of line
- Use to track completion velocity

## Task Granularity

**Recommended**: Each task = meaningful unit of work, completable in one session

**Good**:
```markdown
- [ ] Implement user authentication
  - [x] Create login component
  - [x] Add form validation
  - [ ] Integrate with backend API
```

**Bad**:
```markdown
- [ ] Write code (too vague)
- [ ] Change line 42 (too granular)
```

## Update Guidelines

**When to update**:
1. After completing a task
2. When starting new work
3. When encountering blockers
4. When blockers resolved

**How to update**: Use `replace_in_file` to move tasks between sections

## Related Decisions

| Decision | Relationship |
|----------|-------------|
| D01 Asset Management | D07 defines progress.md format |
| D03 AGENTS.md Content | Format documented in D03 |

---
← [Back to outline](../outline.md)
