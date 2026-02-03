# D08-11: Version Management and Frozen Snapshot

> Status: ✅ Confirmed
> Decision Date: 2026-02-04

## Core Decisions

### D08: No Complex Version Management
- Use simplified snapshot copy instead of complex version management
- Distinguish reference types via `binding: frozen | live`

### D09: Frozen Implementation - Option B
Choose "copy to child Thread's local directory" approach.

```
/threads/
├── thread-A/
│   └── artifacts/
│       └── plan.md  (original file)
│
└── thread-B/
    └── context/
        └── inherited/
            └── plan.md  (snapshot copied from A)
```

**Selection Rationale**:
1. Simple paths: B only needs to read files in its own directory
2. Complete isolation: A's modifications don't affect B
3. Clear semantics: `inherited/` = "snapshots I inherited"

### D10: Immediate Snapshot Copy
- Copy immediately when `reference({ binding: 'frozen' })` is called
- Not lazy copy

### D11: Frozen is Locked
- No refresh support after Frozen
- If new version needed, create a new frozen reference
- This makes semantics clearer and implementation simpler

## Usage Examples

```bash
# Create frozen reference (immediate copy)
thread reference --target thread-A --scope "artifacts/plan.md" --binding frozen

# Returns local path
{
  "local_path": "context/inherited/plan.md",
  "binding": "frozen",
  "source": "thread-A/artifacts/plan.md",
  "copied_at": "2026-02-04T02:00:00Z"
}

# Create live reference (no copy, read from original location)
thread reference --target thread-A --scope "artifacts/design.md" --binding live

{
  "remote_path": "thread-A/artifacts/design.md",
  "binding": "live"
}
```

## Related Decisions
- [D04-07 Sharing Mechanism](./D04-07-sharing-mechanism.md) - Layered state design
- [D12-15 CLI Design](./D12-15-cli-design.md) - reference command specification

## Related Notes
- [Thread CLI Command Details](../notes/thread-cli-commands.md) - Complete command definitions

---
← [Back to outline](../outline.md)
