# D03: Thread Primitives Design

> Status: ✅ Confirmed
> Decision Date: 2026-02-04
> Source: Migrated from stream repo (notes/2026-01-16/Thread交互原语设计.md)

## Core Principle

> **Thread = An evolvable, interactable cognitive carrier**

Thread is not a timeline itself, but a "cognitive unit with causality, context, and intent":

- Context
- State
- Intent
- Evolution history
- Can be referenced, forked, merged

## Twin Isomorphism

Human and Agent use the same action language to operate Threads:

| Primitive | Human can do | Agent can do | Isomorphic |
|-----------|--------------|--------------|------------|
| spawn | Open new thread | Derive subtask | ✅ |
| reference | Reference/mention | Reference context | ✅ |
| lifecycle | Close/archive task | Complete/abandon | ✅ |
| merge | Integrate conclusions | Aggregate outputs | ✅ |
| transfer | Hand to AI | Request human approval | ✅ |

## Primitive Tier System

### Tier 1: Basic Primitives (Must-have for Day 1)

| Primitive | Core Semantics | Priority |
|-----------|----------------|----------|
| **spawn** | Derive new thread from current thread | P0 |
| **reference** | Establish read-only association between threads | P0 |
| **lifecycle** | Control thread's lifecycle state | P0 |

### Tier 2: Collaboration Primitives (Multi-thread coordination)

| Primitive | Core Semantics | Priority |
|-----------|----------------|----------|
| **merge** | Merge outputs from multiple threads | P1 |
| **transfer** | Transfer control between human/Agent | P1 |

### Tier 3: Advanced Primitives (Complex scenario enhancement)

| Primitive | Core Semantics | Priority |
|-----------|----------------|----------|
| **observe** | Subscribe to another thread's state changes in real-time | P2 |
| **inject** | Inject information/constraints/feedback into thread | P2 |
| **rollback** | Roll back to a previous state | P2 |

---

## Tier 1 Primitive Definitions

### 1. spawn — Derive

**One-liner**: Create a new thread from current thread; new thread may inherit partial context.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `intent` | string | ✅ | New thread's goal/intent |
| `inherit` | enum | ✅ | Inheritance strategy: `full` / `partial` / `none` |
| `inherit_scope` | string[] | No | When inherit=partial, specify what to inherit |

**Returns**:

| Field | Description |
|-------|-------------|
| `thread_id` | New thread's unique identifier |
| `parent_id` | Parent thread's identifier |

**Constraints**:
- New thread evolves independently after creation
- Inheritance is **snapshot-based**, doesn't follow parent changes

---

### 2. reference — Reference

**One-liner**: Establish read-only reference from current thread to another.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | thread_id | ✅ | Referenced thread |
| `scope` | string[] | No | Reference scope: `all` / specific artifact paths |
| `binding` | enum | No | Binding type: `frozen` (default) / `live` |

**Returns**:

| Field | Description |
|-------|-------------|
| `ref_id` | Reference relationship's unique identifier |
| `snapshot_version` | If binding=frozen, records snapshot version |

**Constraints**:
- reference is **read-only**, cannot modify referenced thread
- `frozen` = snapshot, referenced thread changes don't affect current thread
- `live` = real-time sync (Tier 3 capability, implement frozen first)

---

### 3. lifecycle — Lifecycle Control

**One-liner**: Change thread's lifecycle state.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | enum | ✅ | Action: `done` / `archive` / `cancel` / `suspend` / `resume` |
| `reason` | string | No | State change reason |

**State Machine**:

```
        ┌─────────────────────────────────────┐
        │                                     │
        ▼                                     │
    [active] ──suspend──▶ [suspended] ──resume──┘
        │
        ├──done────▶ [completed] ──archive──▶ [archived]
        │
        └──cancel──▶ [cancelled] ──archive──▶ [archived]
```

**Constraints**:
- Cannot `resume` after `done` / `cancel`
- `archive` is final state, reduces visibility but preserves data
- `suspend` should save state snapshot for easy `resume`

---

## Tier 2 Primitive Definitions

### 4. merge — Merge

**One-liner**: Merge **Artifacts** from multiple threads to target thread.

> **Core insight**: Merge doesn't merge conversations, but artifacts. After conversation ends, conclusions are in Artifacts.

**Conflict Types**:

| Conflict Type | Description | Detection | Resolution |
|---------------|-------------|-----------|------------|
| **File-level** | Same artifact file modified differently | File path + hash comparison | Three-way merge / manual selection |
| **Decision** | Two threads reach opposite conclusions | Semantic analysis (AI-assisted) | Human arbitration / Arbiter Agent |
| **Code dependency** | Merged code won't compile/run | Compile/test validation | Auto-fix / manual fix |
| **State** | Inconsistent state modifications | State machine validation | Choose latest / human decision |

**Merge Flow**:

```
1. Collect   ──→ Gather Artifacts to merge
2. Detect    ──→ Detect conflicts (by type)
3. Resolve   ──→ Resolve conflicts (by strategy)
4. Validate  ──→ Validate merge result (compile/test)
5. Commit    ──→ Commit merge result to target Thread
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sources` | thread_id[] | ✅ | Threads to merge |
| `target` | thread_id | ✅ | Target thread |
| `artifact_scope` | string[] | No | Artifact paths to merge (default all) |
| `conflict_strategy` | object | No | Resolution strategy for each conflict type |
| `validation` | enum | No | Validation: `compile` / `test` / `none` |
| `requires_approval` | boolean | No | Requires human approval |

---

### 5. transfer — Authorization Transfer

**One-liner**: Change thread's execution control or request authorization.

**Two Directions**:

| Direction | Description | Scenario |
|-----------|-------------|----------|
| **request_approval** | Agent requests human authorization | Delete file, execute dangerous command |
| **delegate** | Human delegates to Agent | Let Agent autonomously complete work scope |

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `direction` | enum | ✅ | Direction: `request_approval` / `delegate` |
| `scope` | string[] | ✅ | Involved capabilities/operations |
| `reason` | string | No | Transfer reason |
| `timeout` | duration | No | Timeout duration |
| `fallback` | enum | No | Timeout handling: `skip` / `block` / `auto_approve` |
| `can_revoke` | boolean | No | Can be revoked |

**Standard Capability List (scope enum values)**:

| Capability | Description | Default Authorization |
|------------|-------------|----------------------|
| `read` | Read files | auto |
| `search` | Search code | auto |
| `analyze` | Analyze code | auto |
| `code_edit` | Edit code | require_human |
| `test_run` | Run tests | auto |
| `delete_file` | Delete files | require_human |
| `execute_command` | Execute commands | require_human |
| `approve_merge` | Approve merge | require_human |
| `deploy` | Deploy | require_human |

---

## Tier 3 Primitive Definitions

### 6. observe — Subscribe

**One-liner**: Subscribe to another thread's events in real-time; trigger response when event occurs (event-driven).

**Difference from reference**: reference is Pull mode (active query), observe is Push mode (auto notification).

**Standard Event Types**: `status_changed`, `artifact_created`, `artifact_updated`, `error_occurred`, `approval_requested`, `done`.

---

### 7. inject — Inject

**One-liner**: Inject new information, constraints, or feedback into a running thread, affecting its subsequent execution.

**Injection Types**: `data`, `constraint`, `feedback`, `priority`.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | thread_id | ✅ | Target thread |
| `type` | enum | ✅ | Injection type |
| `content` | any | ✅ | Injected content |
| `urgency` | enum | No | Urgency: `immediate` / `next_step` |

---

### 8. rollback — Rollback

**One-liner**: Roll back thread to a previous state (checkpoint, step, or timestamp), undoing subsequent changes.

**Rollback Target Types**: `checkpoint`, `step`, `timestamp`, `artifact_version`.

---

## Primitive Combination Patterns

| Collaboration Pattern | Primitive Combination |
|-----------------------|----------------------|
| **Branch-Fix-Merge** | spawn → reference → lifecycle → merge |
| **Human-Agent Alternation** | spawn → transfer ↔ transfer → merge |
| **Parallel Research** | spawn × N → reference × N → merge |
| **Suspend-Resume** | lifecycle(suspend) → spawn → lifecycle(resume) |
| **Knowledge Reuse** | reference(frozen) → spawn → merge |
| **Review Chain** | spawn → reference → transfer(push) → merge |

---

## Relationship Diagram

```
Tier 1 (Basic)       Tier 2 (Collaboration)   Tier 1 (Completion)
─────────────       ─────────────            ─────────────
spawn ───────────▶ transfer ◀────────▶ merge ───────▶ lifecycle
     ╲             (authorization flow)    (artifact convergence)    ╱
      ╲───────────────────────────────────────────────────────────╱
                     reference (throughout)
```

**Complete Loop**: spawn → transfer ↔ transfer → merge → lifecycle

---

## Related Decisions

- [D01 ACP Protocol Selection](./D01-acp-protocol-selection.md)
- [D02 Coordination Mode](./D02-coordination-mode.md)
- [D22 Human-Agent Parity](./D22-human-agent-parity.md) - Core philosophy

---
← [Back to outline](../outline.md)
