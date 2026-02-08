<leslie_system_guide version="1.0.0" description="Leslie Multi-Thread Agent Orchestration System Usage Guide">
<!-- ⚠️ This section is managed by Leslie. Do not edit manually. -->
<!-- To add custom agent guidelines, write OUTSIDE this block. -->

## Leslie Thread System

Leslie is a multi-thread Agent orchestration framework. Each Thread belongs to an Objective.

**Core Concepts**:
- **Objective**: Top-level task unit (e.g., "Build user authentication")
- **Thread**: Execution unit corresponding to an Agent Session
- **Asset**: Persistent artifacts created during Thread execution

### Context You Receive

When working in a Leslie Thread, your User Message includes `<thread_context>`:

```xml
<thread_context thread="<thread-id>" objective="<objective-id>">
  <asset type="plan" path=".leslie/threads/.../plan.md" />
  <asset type="design" path=".leslie/threads/.../design/" />
  <ref thread="other-thread-id">
    <asset type="..." path="..." />
  </ref>
</thread_context>
```

**Attributes**:
- `thread`: Current Thread ID
- `objective`: Parent Objective ID

**Child Elements**:
- `<asset>`: Your Thread's assets (read-write)
- `<ref>`: Referenced Thread's assets (read-only)

### Asset Types

#### plan (Required)
- **What**: Task breakdown and execution plan
- **Location**: `.leslie/threads/<id>/plan.md` or `plan/` directory
- **When to create**: At the start of a Thread, after understanding the objective
- **How to use**: Read to understand task scope; Update as you refine the approach
- **Generation**: You create this based on the objective. Structure flexibly:
  - Single file (`plan.md`) for simple tasks
  - Directory (`plan/`) with multiple files for complex projects
  - Example structure:
    ```
    plan/
    ├── overview.md
    ├── phase-1-auth.md
    └── phase-2-api.md
    ```

#### progress (Required)
- **What**: Execution status and completion tracking
- **Location**: `.leslie/threads/<id>/progress.md`
- **When to update**: After completing each significant step
- **How to use**: Track what's done, what's in progress, what's blocked
- **Generation**: You create and maintain this. Use markdown format with status indicators:
  ```markdown
  ## In Progress
  - [ ] Implement login endpoint
  
  ## Completed
  - [x] Set up database schema
  - [x] Configure authentication middleware
  
  ## Blocked
  - [ ] Deploy to staging (waiting for credentials)
  ```

#### design (Optional)
- **What**: Technical or product design documents
- **Location**: `.leslie/threads/<id>/design/` directory
- **When to create**: Before implementing complex features
- **How to use**: Document architecture decisions, API specs, data models, design rationale
- **Generation**: You create as needed. Organize into multiple files for clarity:
  ```
  design/
  ├── architecture.md
  ├── api-spec.md
  └── database-schema.md
  ```

#### learnings (Optional)
- **What**: Research findings, investigations, analysis results
- **Location**: `.leslie/threads/<id>/learnings/` directory
- **When to create**: During research or investigation tasks
- **How to use**: Document findings, technology comparisons, trade-off analysis, recommendations
- **Generation**: You create as needed. One file per topic:
  ```
  learnings/
  ├── auth-library-comparison.md
  ├── session-management-research.md
  └── security-best-practices.md
  ```

#### transcript (Read-Only)
- **What**: Agent execution trace and conversation history
- **Location**: `.leslie/threads/<id>/transcript.json`
- **How to use**: Read to understand previous context when resuming a Thread
- **Generation**: CLI generates this automatically after Thread completion. **Do NOT modify.**
- **Format**: JSON containing message history and tool call records

### Your Responsibilities

1. **Parse context**: Read `<thread_context>` to understand your scope and available assets
2. **Create plan**: If no plan exists, create one based on the objective
3. **Update progress**: Mark steps as done, add blockers, track completion percentage
4. **Generate assets**: Create design/learnings documents as your work requires them
5. **Stay in scope**: Only modify assets within your Thread; Read-only for referenced Threads

### Thread Operations (via CLI)

When you need to spawn sub-tasks or manage Thread lifecycle:

```bash
# Create new Thread
leslie spawn --intent "Implement user registration API"

# Create Thread with reference to another Thread
leslie spawn --intent "Build frontend login" --ref thread-abc123

# Mark Thread as complete
leslie lifecycle <thread-id> done

# Mark Thread as blocked
leslie lifecycle <thread-id> blocked --reason "Waiting for API keys"
```

**When to use**:
- **spawn**: When you identify a sub-task that should be handled as a separate Thread
- **lifecycle done**: When you've completed all work in your plan
- **lifecycle blocked**: When you cannot proceed due to external dependencies

### Cross-Thread Reference

Assets from other Threads appear under `<ref>` in your context:

```xml
<thread_context thread="current-thread-id" objective="obj-456">
  <asset type="plan" path=".leslie/threads/current-thread-id/plan.md" />
  
  <ref thread="other-thread-id">
    <asset type="design" path=".leslie/threads/other-thread-id/design/api-spec.md" />
  </ref>
</thread_context>
```

**Rules**:
- ✓ Read referenced assets as needed for your work
- ✗ Do NOT modify other Threads' assets
- ✓ If referenced asset needs changes, spawn a new Thread or coordinate with the owning Thread

**Example**:
You're building a frontend and reference the backend API design. You can read the API spec to understand endpoints, but if you discover the API needs changes, spawn a new Thread to handle the backend modifications.

### Thread Relations

Leslie tracks relationships between Threads to support context management and dependency analysis.

**Storage Location**: `.leslie/thread_relations.json`

**Access**: The file path is provided in `<thread_context relations_file="...">` attribute.

**When to Query**:
- **Context recovery**: After context compression, determine which Threads' contexts to re-inject
- **Dependency analysis**: Understand Thread dependencies and relationships
- **Asset provenance**: Trace asset origins across Threads

**How to Query**:
Use the `thread-relations` skill to learn the JSON schema and query methods.

**Important**: Do NOT modify `.leslie/thread_relations.json` directly. All modifications are handled by Leslie CLI.

</leslie_system_guide>
