---
name: high-intensity-debug-runbook
description: "Run-repro-log triage workflow for frequent Leslie runtime issues. Use when user asks to run heavily, troubleshoot, inspect logs, find root cause, and verify fixes."
license: MIT
metadata:
  version: "0.1.0"
  author: "leslie-project"
  category: "debugging"
---

# High-Intensity Debug Runbook

Use this skill for repeated, high-frequency troubleshooting in Leslie:
- run objective
- observe abnormal behavior
- inspect runtime logs/state
- identify root cause with evidence
- apply minimal fix
- verify with regression test

This skill is optimized for Leslie CLI + runtime artifacts.

---

## When To Trigger

Trigger when user intent includes:
- "高强度运行"
- "排障"
- "看日志"
- "提前退出"
- "没执行完就结束"
- "定位根因"

Also trigger for English intent such as:
- "debug this run"
- "analyze runtime logs"
- "why did it exit early"

---

## Core Rules

1. Evidence first. Do not conclude without runtime artifacts.
2. Prefer minimal fix in existing architecture.
3. Keep diagnosis reproducible (command + objective id + artifact paths).
4. Add at least one regression test for discovered root cause.
5. Never edit relation/objective data files manually in production fix logic.

---

## Required Inputs (ask only if missing)

- exact command used (example: `leslie run --title "..."`)
- workspace path where `.leslie` exists
- `objective_id` (if available)
- symptom summary in one sentence

If `objective_id` is missing, derive from latest run artifacts under `.leslie/runtime/`.

---

## Standard Workflow

### Step 1: Reconstruct Timeline

Collect and correlate:
- `.leslie/runtime/<runtime-id>/events.ndjson`
- `.leslie/objectives.json`
- `.leslie/thread_relations.json`
- `.leslie/logs/<objective-id>/objective.log`

Build a short timeline:
1. root thread started
2. child threads started/exited
3. objective status changed to completed

### Step 2: Validate Status Invariants

Check these invariants:
- objective is `completed` only when all threads in that objective are terminated
- objective thread set must be consistent with relations thread set
- run loop stop condition must not rely on stale or partial thread scope

### Step 3: Generate Hypotheses

Create 3-5 concrete hypotheses, then reject quickly with artifact evidence.

Examples:
- H1: objective completion checks only root thread ids
- H2: child threads are not linked to objective
- H3: watcher misses state updates and exits on stale objective status

### Step 4: Patch Minimally

Patch the smallest layer that restores invariant correctness.
Typical order:
1. objective status refresh logic
2. thread/objective linkage updates
3. run scheduler stop conditions

### Step 5: Verify

Must include:
- targeted test for reproduced bug
- existing related tests still pass

Recommended:
- package-level focused test command first
- full suite later if needed

### Step 6: Report

Output must include:
- symptom
- root cause
- exact files changed
- verification command and result
- residual risks

---

## Leslie-Specific Fast Checks

### Early-Completion Symptom

Symptom pattern:
- TUI still shows running children
- CLI prints `[run] objective <id> completed`
- process exits

Immediate checks:
1. In `objectives.json`, inspect `thread_ids` for that objective
2. In `thread_relations.json`, list threads with matching `objective`
3. Compare counts and statuses

If mismatch exists:
- likely root cause: objective completion uses incomplete thread set

### Known Good Fix Pattern

For objective completion refresh:
- derive effective thread ids from relations by objective id
- fallback to stored `objective.thread_ids` only when relation list is empty
- sync objective thread ids with relation-derived ids
- evaluate completion on effective thread ids

---

## Output Template

```markdown
## Debug Result

- **Symptom**: ...
- **Root cause**: ...
- **Fix**: ...
- **Files changed**: `...`, `...`
- **Verification**: `...` => passed/failed
- **Residual risk**: ...
```

---

## Anti-Patterns

- Guessing root cause from code only without runtime artifacts
- Large refactor before reproducing issue
- Declaring success without test evidence
- Fixing only UI/TUI output when core status model is inconsistent

---

## Version

`0.1.0`
