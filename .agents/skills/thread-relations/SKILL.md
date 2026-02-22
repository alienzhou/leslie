---
name: thread-relations
description: "Read-only guidance for querying .leslie/thread_relations.json"
---

# Thread Relations Query Skill

Use this skill when you need thread dependency and reference information.

## File Location

- `.leslie/thread_relations.json`
- File path is also exposed in `<thread_context relations_file="...">`.

## Core Rules

1. Read-only for agents.
2. All writes must go through `leslie` CLI.
3. If file missing, run `leslie init` first.

## Common Queries

- Find thread by id: `threads[threadId]`
- Find active threads: filter `threads.*.status == "active"`
- Find references: `relations[threadId].references_to`
- Find reverse references: `relations[threadId].referenced_by`
- Find dependency chain: DFS over `depends_on`

## CLI Troubleshooting

If you get an error like `leslie: command not found`:

1. Install Leslie CLI globally:
   - `npm install -g @vibe-x-ai/leslie`
   - or `pnpm add -g @vibe-x-ai/leslie`
2. Verify installation:
   - `leslie --help`
3. If command is still missing, check your global bin path:
   - `npm config get prefix`
   - make sure `<prefix>/bin` is in `PATH`

## Schema Summary

```json
{
  "version": "1.0",
  "metadata": { "last_updated": "...", "thread_count": 0 },
  "threads": {},
  "operations": [],
  "relations": {}
}
```
