# Thread Primitives Design

> **Decision ID**: D03  
> **Status**: ✅ Confirmed  
> **Last Updated**: 2026-02-09

## 1. Core Principle

> **Thread = An evolvable, interactable cognitive carrier**

Thread is not a timeline itself, but a "cognitive unit with causality, context, and intent":
- Context
- State
- Intent
- Evolution history
- Can be referenced, forked, merged

## 2. Primitive Tier System

### 2.1 Tier 1: Basic Primitives (MVP)

| Primitive | Core Semantics | Priority |
|-----------|----------------|----------|
| **spawn** | Derive new thread from current thread | P0 |
| **reference** | Establish read-only association between threads | P0 |
| **lifecycle** | Control thread's lifecycle state | P0 |

### 2.2 Tier 2: Collaboration Primitives

| Primitive | Core Semantics | Priority |
|-----------|----------------|----------|
| **merge** | Merge outputs from multiple threads | P1 |
| **transfer** | Transfer control between human/Agent | P1 |

### 2.3 Tier 3: Advanced Primitives

| Primitive | Core Semantics | Priority |
|-----------|----------------|----------|
| **observe** | Subscribe to another thread's state changes | P2 |
| **inject** | Inject information/constraints into thread | P2 |
| **rollback** | Roll back to a previous state | P2 |

## 3. Tier 1 Primitive Definitions

### 3.1 spawn — Derive

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

### 3.2 reference — Reference

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

### 3.3 lifecycle — Lifecycle Control

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

## 4. Tier 2 Primitive Definitions

### 4.1 merge — Merge

**One-liner**: Merge **Artifacts** from multiple threads to target thread.

> **Core insight**: Merge doesn't merge conversations, but artifacts. After conversation ends, conclusions are in Artifacts.

**Conflict Types**:

| Conflict Type | Description | Resolution |
|---------------|-------------|------------|
| **File-level** | Same artifact file modified differently | Three-way merge / manual selection |
| **Decision** | Two threads reach opposite conclusions | Human arbitration / Arbiter Agent |
| **Code dependency** | Merged code won't compile/run | Auto-fix / manual fix |
| **State** | Inconsistent state modifications | Choose latest / human decision |

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sources` | thread_id[] | ✅ | Threads to merge |
| `target` | thread_id | ✅ | Target thread |
| `artifact_scope` | string[] | No | Artifact paths to merge (default all) |
| `conflict_strategy` | object | No | Resolution strategy for each conflict type |
| `validation` | enum | No | Validation: `compile` / `test` / `none` |
| `requires_approval` | boolean | No | Requires human approval |

### 4.2 transfer — Authorization Transfer

**One-liner**: Change thread's execution control or request authorization.

**Two Directions**:

| Direction | Description | Scenario |
|-----------|-------------|----------|
| **request_approval** | Agent requests human authorization | Delete file, execute dangerous command |
| **delegate** | Human delegates to Agent | Let Agent autonomously complete work scope |

**Standard Capability List**:

| Capability | Default Authorization |
|------------|----------------------|
| `read` | auto |
| `search` | auto |
| `analyze` | auto |
| `code_edit` | require_human |
| `test_run` | auto |
| `delete_file` | require_human |
| `execute_command` | require_human |
| `approve_merge` | require_human |
| `deploy` | require_human |

## 5. Primitive Combination Patterns

| Collaboration Pattern | Primitive Combination |
|-----------------------|----------------------|
| **Branch-Fix-Merge** | spawn → reference → lifecycle → merge |
| **Human-Agent Alternation** | spawn → transfer ↔ transfer → merge |
| **Parallel Research** | spawn × N → reference × N → merge |
| **Suspend-Resume** | lifecycle(suspend) → spawn → lifecycle(resume) |
| **Knowledge Reuse** | reference(frozen) → spawn → merge |
| **Review Chain** | spawn → reference → transfer(push) → merge |

## 6. Related Documents

- [Sharing Mechanism](./02-sharing-mechanism.md)
- [Human-Agent Parity](./04-human-agent-parity.md)
