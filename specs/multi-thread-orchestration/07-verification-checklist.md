# Verification Checklist - Multi-Thread Agent Orchestration

> **Status**: Pre-Implementation  
> **Last Updated**: 2026-02-09

## Functional Verification

### Thread Primitives (Tier 1)

#### spawn
- [ ] Can create new thread with intent
- [ ] Inheritance modes work correctly (full/partial/none)
- [ ] Child thread is independent after creation
- [ ] Snapshot-based inheritance (no live updates)
- [ ] Returns correct thread_id and parent_id

#### reference
- [ ] Can establish reference to another thread
- [ ] Frozen binding creates snapshot copy
- [ ] Scope filtering works (specific files vs all)
- [ ] Returns ref_id and snapshot_version

#### lifecycle
- [ ] All state transitions work correctly
- [ ] Cannot resume after done/cancel
- [ ] Archive is final state
- [ ] Reason is recorded correctly

### Sharing Mechanism

- [ ] Artifacts are stored in correct directory
- [ ] Cross-thread reference works via --ref
- [ ] One-level injection (no transitive)
- [ ] Circular reference detection works
- [ ] Broken reference handling is non-blocking

### CLI Interface

- [ ] All commands produce valid JSON output
- [ ] Error codes follow specification
- [ ] Human-readable format works for humans
- [ ] --format flag works for all commands

### Human-Agent Parity

- [ ] Human can use all primitives
- [ ] Agent can use all primitives
- [ ] transfer request_approval works
- [ ] lifecycle suspend/cancel works
- [ ] inject command works

## Non-Functional Verification

### Performance

- [ ] JSON file operations complete within 100ms
- [ ] File lock acquisition doesn't cause deadlocks
- [ ] 100 threads can be managed without degradation

### Reliability

- [ ] Retry mechanism works for transient failures
- [ ] Backup file is created before writes
- [ ] Recovery from corrupted JSON works

### Usability

- [ ] Error messages are clear and actionable
- [ ] CLI help is comprehensive
- [ ] Documentation is accurate

## Integration Verification

### ACP Integration

- [ ] Can connect to Claude Code via ACP
- [ ] Thread = Session mapping works
- [ ] Transcript generation works

### AGENTS.md Integration

- [ ] `leslie init` creates correct block
- [ ] Version checking works
- [ ] Idempotent initialization

## Sign-off

| Area | Reviewer | Date | Status |
|------|----------|------|--------|
| Thread Primitives | | | |
| Sharing Mechanism | | | |
| CLI Interface | | | |
| Human-Agent Parity | | | |
| ACP Integration | | | |
