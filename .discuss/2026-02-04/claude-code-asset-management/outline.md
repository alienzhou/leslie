# Claude Code Asset Persistence Mechanism

## 🔵 Current Focus
(Discussion completed, all documented)

## ⚪ Pending
(None)

## ✅ Confirmed
- Leslie's role: Orchestrate and manage collaboration results of multiple Agents, not replace Claude Code
- Both Direction A + B will be designed, complementary relationship
- Assets flow bidirectionally:
  - CLI → Agent (inject asset paths as context)
  - Agent → CLI (produce assets, CLI collects and stores)
- Storage location: In-project `.leslie/`
- Asset types:
  1. **plan** - Task planning (single file or directory)
  2. **progress** - Execution progress (more flexible than todos, may use Markdown in future)
  3. **transcript** - Agent execution trace (one file per chatId)
  4. **learnings** - Research findings (optional)
  5. **discuss** - Discussion content (similar to current .discuss/)
  6. **design** - Technical/product design documents
- Plan and Design structure:
  - Can be a single .md file
  - Or a directory composed of multiple files
  - Structure decided autonomously, not limited to single file
  - **Describe organization guidelines in AGENTS.md, let Agent decide and explain**
- Progress vs Todos: Progress is more flexible with richer content
- **Asset version control**: Not implemented separately, relies on Git. Future M5E integration will unify asset (including PageTag) version control via Git
- **Thread recovery mechanism**:
  - Conversation data (Message List) persistently stored
  - On failure, use stored Message List to re-invoke Agent
  - Combined with current asset state, enables checkpoint resume
- **Cross-Thread asset recall**:
  - Explicitly declare dependencies via `--ref thread-id`
  - Inject asset list (paths), not content itself
  - Agent decides when to read actual content
- **Context injection design**:
  - Layered design:
    - **AGENTS.md**: Static Leslie system usage guide (universal)
    - **User Message**: Dynamic `<thread_context>` + task description (varies per conversation)
  - `<thread_context>` tag: Structured XML with metadata
  - Example:
    ```xml
    <thread_context thread="thread-123" objective="obj-456">
      <asset type="plan" path=".leslie/threads/thread-123/plan.md" />
      <asset type="design" path=".leslie/threads/thread-123/design/api-spec.md" />
    </thread_context>
    
    User's actual task description...
    ```
- Transcript generation timing and method:
  - Generated programmatically by CLI after conversation ends
  - Not letting Agent invoke tools (high cost, slow)
  - **Under ACP integration, Leslie can directly obtain conversation information**
  - Process termination = accurate signal
- Injection format: Wrapped in XML tags (specific format TBD)
- **AGENTS.md initialization mechanism** (leslie init):
  - Command: `leslie init`
  - Location: Append to end of file
  - Block marker: Wrapped in `<leslie_system_guide>` XML tag
  - Tag attributes: `version` (version number) + `description` (description)
  - Warning message: Using `<!-- -->` comment syntax
  - Update logic:
    - No block → Append at file end
    - Block exists with minor/patch update → Auto-replace with prompt
    - Block exists with major update → Requires user confirmation
  - User modification protection: Not protected, inform users not to modify block internals, customizations go outside
- **AGENTS.md block content**:
  - Leslie Thread System usage guide
  - Detailed description for each asset type:
    - What: What it is
    - Location: Storage location
    - When: When to create/update
    - How to use: How to use it
    - Generation: Generation logic (Agent creates or CLI generates)
  - Asset types covered: plan, progress, design, learnings, transcript
  - Thread operation guide (CLI commands)
  - Cross-Thread reference instructions
- **Compression protection strategy**:
  - Ideal solution: ACP `session/update` + `sessionUpdate: "usage_update"` (RFD proposal)
    - Provides `used` (used tokens) and `size` (total capacity) fields
    - Trigger `<thread_context>` re-injection when usage >90%
  - Transition solution (before ACP implementation):
    - Rough estimation based on message rounds or estimated token count
    - E.g., proactive re-injection after every N conversation rounds
    - Or re-inject when estimated total tokens approach threshold

## ❌ Rejected
- ~~recap~~ → Replaced with transcript (more precise execution trace)
- ~~Agent invokes tool to generate transcript~~ → Programmatic generation, avoid cost and latency

---

## 📋 Decisions

- [D01-asset-management-architecture.md](./decisions/D01-asset-management-architecture.md) - Asset management architecture decision
- [D02-agents-md-initialization.md](./decisions/D02-agents-md-initialization.md) - AGENTS.md initialization mechanism
- [D03-agents-md-block-content.md](./decisions/D03-agents-md-block-content.md) - AGENTS.md block content specification

## 📄 Templates

- [leslie-system-guide.md](./templates/leslie-system-guide.md) - AGENTS.md complete template content
- [thread-context-format.md](./templates/thread-context-format.md) - Thread Context XML format specification

---

## 📋 Background Context

### User Question
> When using Claude Code now, how to persist some asset files, or make it produce fixed outputs with customization?

### Analyzed ide-agent Architecture

**Spectra System Core Components**:
```
packages/agent/src/spectra/
├── artifacts/
│   ├── plan-writer.ts      # plan.md writing
│   ├── todos-writer.ts     # todos.yml writing
│   ├── learnings-writer.ts # learning documents
│   └── recap-writer.ts     # recap summaries
├── versioning/             # Git-based checkpoint
└── recall/                 # History recall
```

**Asset Types**:
| Asset | File | Trigger Tool |
|------|------|----------|
| Plan | plan.md | create_plan |
| Todos | todos.yml | write_todo |
| Learnings | learning-*.md | research_task |
| Recap | recap-*.md | Auto-generated |

**Key Mechanisms**:
1. Tool produces assets: `create_plan` → `plan.md`
2. Session binding: Each conversation has independent threadId directory
3. Version control: Git-based checkpoint
4. Prompt injection: Asset state injected into System Prompt
