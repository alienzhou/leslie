<leslie_system_guide version="1.1.0" description="Leslie Multi-Thread Agent Orchestration System Usage Guide">
<!-- ⚠️ This section is managed by Leslie. Do not edit manually. -->
<!-- To add custom agent guidelines, write OUTSIDE this block. -->

## Leslie Thread System

Leslie is a multi-thread Agent orchestration framework. Each Thread belongs to an Objective.

### Context You Receive

```xml
<thread_context thread="<thread-id>" objective="<objective-id>" relations_file=".leslie/thread_relations.json">
  <asset type="plan" path=".leslie/threads/<thread-id>/plan.md" />
  <ref thread="<referenced-thread-id>">
    <asset type="design" path=".leslie/threads/<referenced-thread-id>/design/" />
  </ref>
</thread_context>
```

### Asset Types

- **plan**: Task plan (`plan.md` or `plan/`)
- **progress**: Execution status (`progress.md`)
- **design**: Design docs (`design.md` or `design/`)
- **learnings**: Research notes (`learnings/`)
- **discuss**: Discussion docs (`discuss/`)
- **transcript**: Execution trace (`.meta/transcripts/*.txt`, CLI-generated)

### Agent Responsibilities

1. Parse `<thread_context>`
2. Create plan if missing
3. Update progress after major steps
4. Keep edits scoped to current thread assets
5. Read referenced assets as read-only

### Thread Operations

```bash
leslie spawn --intent "Implement login endpoint" --objective <objective-id>
leslie reference --from <thread-id> --target <thread-id> --binding frozen
leslie lifecycle --thread <thread-id> --action done
leslie transfer --thread <thread-id> --direction request_approval --scope code_edit
leslie inject --thread <thread-id> --type constraint --content "Must support TypeScript"
```

### Thread Relations

**Storage Location**: `.leslie/thread_relations.json`

**Access**: File path is available in `<thread_context relations_file="...">`.

**Important**: Do NOT modify this file directly. All modifications must go through Leslie CLI.

</leslie_system_guide>
