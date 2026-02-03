# D12-15: Thread CLI Design Specification

> Status: ✅ Confirmed
> Decision Date: 2026-02-04

## Core Decisions

### D12: Naming Style
- Use `thread <command>` style (similar to git)
- Examples: `thread spawn`, `thread list`, `thread status`

### D13: Output Format
- Optional `--format json|table|yaml`
- Default is JSON

### D14: Error Handling
- Return: error code + error message
- Suggested action is optional, maximum 1
- Most cases don't need suggestions, Agent can fix on its own

```json
{
  "code": "T101",
  "message": "Thread 'thread-xyz' not found"
}
```

### D15: Language
- English only
- No internationalization for now

## Command Tiers

| Tier | Command | Semantics | Priority |
|------|---------|-----------|----------|
| T1 | `spawn` | Create child Thread | P0 |
| T1 | `reference` | Establish reference | P0 |
| T1 | `lifecycle` | State control | P0 |
| T2 | `merge` | Merge outputs | P1 |
| T2 | `transfer` | Transfer control | P1 |
| T3 | `observe` | Event subscription | P2 |
| T3 | `inject` | Information injection | P2 |
| T3 | `rollback` | Rollback | P2 |
| Query | `list` | List Threads | P0 |
| Query | `status` | View status | P0 |
| Query | `artifacts` | List outputs | P0 |

## Command Examples

```bash
# Tier 1
thread spawn --intent "Research Redis" --inherit partial --scope "requirements"
thread reference --target thread-abc --scope "artifacts/plan.md" --binding frozen
thread lifecycle --action done --reason "Research completed"

# Tier 2
thread merge --sources thread-a,thread-b --target thread-main
thread transfer --direction handoff --target thread-review

# Query
thread list --status active
thread status thread-abc
thread artifacts thread-abc
```

## Related Decisions
- [D08-11 Frozen Snapshot](./D08-11-frozen-snapshot.md) - reference binding implementation
- [D16-17 ACP Integration](./D16-17-acp-integration.md) - CLI to ACP method mapping

## Related Notes
- [Thread CLI Command Details](../notes/thread-cli-commands.md) - Complete command definitions
- Thread Primitives Design (external reference: stream repo, not linked for independent publishing)

---
← [Back to outline](../outline.md)
