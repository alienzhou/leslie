<leslie_system_guide version="2.0.0" description="Leslie Multi-Thread Agent Orchestration System Usage Guide">
<!-- ⚠️ This section is managed by Leslie. Do not edit manually. -->
<!-- To add custom agent guidelines, write OUTSIDE this block. -->

## Leslie Thread System

Leslie is a multi-thread Agent orchestration framework. Each Thread belongs to an Objective.
You are running inside a Leslie Thread. Your prompt starts with `<thread_context>` — parse it to understand your identity and available resources.

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

1. Parse `<thread_context>` to identify your thread ID, objective, and available assets
2. Create plan if missing
3. Update progress after major steps
4. Keep edits scoped to current thread assets
5. Read referenced assets as read-only

### Thread Operations

All operations use the `leslie` CLI. You call them via Bash — the same commands humans use.

#### spawn — Decompose into sub-threads

When your task is complex (multiple independent subtasks, parallel research, etc.), spawn child threads instead of doing everything yourself.

```bash
leslie spawn --intent "Research Redis caching strategies" \
  --objective <objective-id> \
  --parent <your-thread-id> \
  --inherit partial --scope "requirements"
```

When to spawn:
- Task has 2+ independent subtasks that benefit from separate context
- Need parallel exploration of different approaches
- Subtask requires clean context to avoid interference

When NOT to spawn:
- Task is simple and sequential
- Subtask depends heavily on your current context

#### reference — Share context between threads

```bash
leslie reference --from <your-thread-id> --target <other-thread-id> --binding frozen
```

Use when your thread needs to read another thread's assets (design docs, research notes, etc.).

#### lifecycle — Manage thread state

```bash
leslie lifecycle --thread <thread-id> --action done
leslie lifecycle --thread <thread-id> --action suspend --reason "Waiting for dependency"
leslie lifecycle --thread <thread-id> --action cancel --reason "No longer needed"
```

Mark your thread `done` when the task is complete. Leslie will also auto-mark it on successful exit.

#### transfer — Request human intervention

```bash
leslie transfer --thread <your-thread-id> \
  --direction request_approval --scope code_edit \
  --reason "Architecture decision needed: REST vs GraphQL"
```

Use when:
- You encounter a decision that requires human judgment
- You're blocked and need information only a human can provide
- The task exceeds your capability or confidence

#### inject — Receive runtime instructions

You don't call this yourself. Humans or the system use it to send you new constraints or information:

```bash
leslie inject --thread <thread-id> --type constraint --content "Must support TypeScript"
```

Check `.meta/injections.log` in your thread directory for injected instructions.

### Behavior Guidelines

1. **Read before act**: Always read your `<thread_context>` assets (especially plan and referenced designs) before starting work
2. **Plan first**: If no plan exists, create `plan.md` in your thread directory before coding
3. **Decompose proactively**: If the task involves 3+ distinct subtasks, consider spawning child threads
4. **Ask for help**: If uncertain about a decision, use `transfer --direction request_approval` rather than guessing
5. **Update progress**: Write `progress.md` after completing each major step
6. **Stay scoped**: Only modify files relevant to your thread's intent; don't drift into unrelated changes

### Thread Relations

**Storage Location**: `.leslie/thread_relations.json`

**Access**: File path is available in `<thread_context relations_file="...">`.

**Important**: Do NOT modify this file directly. All modifications must go through Leslie CLI.

</leslie_system_guide>
