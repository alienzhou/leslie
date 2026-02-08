# Thread Context XML Format Specification

This document defines the `<thread_context>` XML format injected into Agent User Messages.

## Basic Structure

```xml
<thread_context thread="<thread-id>" objective="<objective-id>" relations_file=".leslie/thread_relations.json">
  <!-- Current Thread's assets -->
  <asset type="plan" path=".leslie/threads/<thread-id>/plan.md" />
  <asset type="progress" path=".leslie/threads/<thread-id>/progress.md" />
  <asset type="design" path=".leslie/threads/<thread-id>/design/" />
  
  <!-- Referenced Thread's assets (if any) -->
  <ref thread="<referenced-thread-id>">
    <asset type="design" path=".leslie/threads/<referenced-thread-id>/design/" />
  </ref>
</thread_context>
```

## Root Element: `<thread_context>`

**Attributes**:
- `thread` (required): Current Thread ID (e.g., "thread-abc123")
- `objective` (required): Parent Objective ID (e.g., "obj-456")
- `relations_file` (optional): Path to thread relations JSON file (e.g., ".leslie/thread_relations.json")

## Child Element: `<asset>`

Represents an asset belonging to the current Thread.

**Attributes**:
- `type` (required): Asset type - one of: `plan`, `progress`, `design`, `learnings`, `transcript`
- `path` (required): Relative file path from project root

**Notes**:
- Agent has read-write access to these assets
- Path may point to a file or directory depending on asset type

## Child Element: `<ref>`

Represents a referenced Thread and its assets.

**Attributes**:
- `thread` (required): Referenced Thread ID

**Child Elements**:
- Contains one or more `<asset>` elements

**Notes**:
- Agent has read-only access to referenced assets
- Multiple `<ref>` elements allowed if Thread references multiple other Threads

## Complete Example

```xml
<thread_context thread="thread-frontend-123" objective="obj-auth-system" relations_file=".leslie/thread_relations.json">
  <!-- Current Thread assets -->
  <asset type="plan" path=".leslie/threads/thread-frontend-123/plan.md" />
  <asset type="progress" path=".leslie/threads/thread-frontend-123/progress.md" />
  <asset type="design" path=".leslie/threads/thread-frontend-123/design/" />
  
  <!-- Reference to backend API Thread -->
  <ref thread="thread-backend-456">
    <asset type="design" path=".leslie/threads/thread-backend-456/design/api-spec.md" />
    <asset type="design" path=".leslie/threads/thread-backend-456/design/data-models.md" />
  </ref>
  
  <!-- Reference to database schema Thread -->
  <ref thread="thread-db-789">
    <asset type="design" path=".leslie/threads/thread-db-789/design/schema.sql" />
  </ref>
</thread_context>
```

## Injection Context

The `<thread_context>` block is injected at the **beginning of the User Message**, followed by the actual task description:

```
<thread_context thread="..." objective="..." relations_file=".leslie/thread_relations.json">
  ...
</thread_context>

Implement the login form component with email/password validation.
Use the API endpoints documented in the referenced backend design.
```

## Timing

### Initial Injection (spawn)
When a Thread is created via `leslie spawn`:
- Current Thread assets: Empty list (Agent will create them)
- Referenced assets: Full list from `--ref` parameter

### Resumption (load)
When a Thread is resumed:
- Current Thread assets: All existing assets
- Referenced assets: Same as initial spawn

### Re-injection (after compression)
If context window compression occurs:
- Same structure as resumption
- Ensures asset references remain available

## Asset Path Rules

### Single File Assets
```xml
<asset type="plan" path=".leslie/threads/thread-123/plan.md" />
<asset type="progress" path=".leslie/threads/thread-123/progress.md" />
```

### Directory Assets
```xml
<asset type="design" path=".leslie/threads/thread-123/design/" />
<asset type="learnings" path=".leslie/threads/thread-123/learnings/" />
```

### Plan (can be either)
```xml
<!-- Simple task: single file -->
<asset type="plan" path=".leslie/threads/thread-123/plan.md" />

<!-- Complex task: directory -->
<asset type="plan" path=".leslie/threads/thread-123/plan/" />
```

## Parsing Guidelines for Agents

1. **Extract IDs**: Parse `thread` and `objective` attributes for context
2. **Extract relations file**: Parse `relations_file` attribute to know where thread relationships are stored
3. **Identify own assets**: All direct `<asset>` children under `<thread_context>`
4. **Identify references**: All `<asset>` children under `<ref>` elements
5. **Read as needed**: Use file tools to read asset content when required
6. **Respect boundaries**: Only write to own assets, read-only for references

## Version History

- **v1.1.0** (2026-02-08): Added `relations_file` attribute for thread relationship tracking
- **v1.0.0** (2026-02-04): Initial format specification
