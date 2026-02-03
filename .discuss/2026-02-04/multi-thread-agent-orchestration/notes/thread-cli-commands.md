# Thread CLI Command Detailed Design

> Type: Design Draft
> Date: 2026-02-04

## Command Overview

### Tier 1: Basic Commands (Day 1 Must-have)

#### spawn - Create Child Thread

```bash
thread spawn --intent "Research Redis vs Memcached" \
  --inherit partial \
  --scope "requirements,constraints"
```

Returns:
```json
{
  "thread_id": "thread-abc123",
  "parent_id": "thread-main",
  "status": "active",
  "artifacts_path": "/threads/thread-abc123/artifacts/"
}
```

#### reference - Establish Reference

```bash
# frozen reference (immediate copy)
thread reference --target thread-abc \
  --scope "artifacts/plan.md" \
  --binding frozen

# live reference
thread reference --target thread-abc \
  --scope "artifacts/design.md" \
  --binding live
```

Returns:
```json
{
  "ref_id": "ref-001",
  "local_path": "context/inherited/plan.md",  // frozen
  "binding": "frozen"
}
```

#### lifecycle - State Control

```bash
thread lifecycle --action done --reason "Research completed"
thread lifecycle --action suspend --reason "Waiting for dependencies"
thread lifecycle --action resume
thread lifecycle --action cancel --reason "Wrong direction"
thread lifecycle --action archive
```

### Tier 2: Collaboration Commands

#### merge - Merge Outputs

```bash
thread merge --sources thread-a,thread-b \
  --target thread-main \
  --scope "artifacts/"

# With conflict strategy
thread merge --sources thread-a,thread-b \
  --target thread-main \
  --conflict-strategy '{"file_level":"three_way"}'
```

#### transfer - Control Transfer

```bash
# handoff style
thread transfer --direction handoff \
  --target thread-review \
  --context-inherit artifacts_only

# Request approval
thread transfer --direction request_approval \
  --scope "delete_file,execute_command" \
  --reason "Need to clean up temporary files"
```

### Tier 3: Advanced Commands

#### observe - Event Subscription

```bash
thread observe --target thread-a \
  --events "done,artifact_updated" \
  --filter "path=plan.md"
```

#### inject - Information Injection

```bash
thread inject --target thread-a \
  --type constraint \
  --content '{"forbidden_files":["src/core/*.ts"]}'
```

#### rollback - Rollback

```bash
thread rollback --to checkpoint:design_done
thread rollback --to step:3
```

### Query Commands

```bash
# List Threads
thread list
thread list --status active
thread list --parent thread-main

# View status
thread status thread-abc

# List outputs
thread artifacts thread-abc
thread artifacts --scope "*.md"
```

## Error Code Specification

| Prefix | Category |
|--------|----------|
| T1xx | Thread related |
| T2xx | Reference related |
| T3xx | Lifecycle related |
| T4xx | Merge related |
| T5xx | Transfer related |
| T9xx | System errors |

## Error Response Example

```json
{
  "code": "T101",
  "message": "Thread 'thread-xyz' not found"
}
```

## Related Decisions
- [D12-15 CLI Design Specification](../decisions/D12-15-cli-design.md) - Command specification definition
- [D08-11 Frozen Snapshot](../decisions/D08-11-frozen-snapshot.md) - reference binding implementation

## External References
- Thread Primitives Design (external reference: stream repo, not linked for independent publishing)

---
← [Back to outline](../outline.md)
