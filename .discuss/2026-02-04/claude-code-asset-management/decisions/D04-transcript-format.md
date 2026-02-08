# D04: Transcript Format and Generation

**Status**: ✅ Confirmed  
**Decision Date**: 2026-02-08  
**Source**: Claude Code Asset Management Discussion

## Decision

Use human-readable plain text format (.txt) for transcript files, based on proven implementation in ide-agent repository.

## Format Choice: Plain Text, Not JSON

**Rationale**:
- Human-readable: Easy to scan and understand
- Agent-friendly: Can be read directly with `read_file` tool
- Compact: More space-efficient than structured JSON
- Proven: Already validated in production

## File Naming Convention

```
{YYYYMMDD}-{HHmm}-{sanitized-user-query}.txt
```

**Example**: `20260208-1430-fix-login-bug.txt`

**Sanitization Rules**:
- Whitelist: Letters, numbers, CJK characters, hyphens, underscores
- Replace other characters with hyphens
- Max length: 50 characters
- Fallback: "task" if result is empty

## File Content Structure

```
Thread ID: {threadId}
Chat ID: {chatId}
Time Range: {startTime} ~ {endTime}
Agent Mode: {agentMode}
Stop Reason: {stopReason}
Tool Calls: {toolCallCount}
---

user:
<user_query>
{user message}
</user_query>

assistant:
{assistant response}

[Tool call] {toolName}
{truncated params}

[Tool result] {toolName}
{truncated result}
```

### Metadata Header Fields

| Field | Description | Example |
|-------|-------------|---------|
| Thread ID | Thread identifier | `thread-abc123` |
| Chat ID | Chat session identifier | `chat-xyz789` |
| Time Range | ISO timestamps for start~end | `2026-02-08T14:30:00+08:00 ~ 2026-02-08T14:45:00+08:00` |
| Agent Mode | Agent execution mode | `agent`, `plan`, `duet`, `review` |
| Stop Reason | Completion reason (optional) | `end_turn`, `max_tokens`, `cancelled` |
| Tool Calls | Number of tool calls | `15` |

### Message Formatting Rules

| Message Type | Format |
|--------------|--------|
| User message | `user:`<br>`<user_query>`<br>`{text}`<br>`</user_query>` |
| Assistant text | `assistant:`<br>`{text}` |
| Tool call | `[Tool call] {toolName}`<br>`{truncated params}` |
| Tool result | `[Tool result] {toolName}`<br>`{truncated result}` |
| Error | `[Error]`<br>`{error message}` |

## Conversation Unit Grouping

One transcript file = One conversation unit:
- **Starts**: User message
- **Includes**: All Agent responses, tool calls, tool results
- **Ends**: Before next user message or conversation end

## Truncation Limits

| Content Type | Limit |
|--------------|-------|
| Tool params | 200 chars |
| Tool results | 200 chars |
| Total file size | 20KB |
| Filename query | 50 chars |

## Storage Location

```
.leslie/threads/<thread-id>/.meta/transcripts/
```

## File Cleanup

- **Max files**: 50 per Thread
- **Cleanup**: Delete oldest when exceeding limit
- **Sorting**: Files naturally sort by timestamp in filename

## Generation Timing

- **When**: After Thread execution completes
- **How**: CLI programmatically generates from Message List
- **Signal**: Process termination triggers generation
- **ACP**: CLI accesses conversation history directly

## Examples

### Example 1: Simple Conversation

**Filename**: `20260208-1430-implement-user-login.txt`

**Content**:
```
Thread ID: thread-abc123
Chat ID: chat-xyz789
Time Range: 2026-02-08T14:30:00+08:00 ~ 2026-02-08T14:35:00+08:00
Agent Mode: agent
Stop Reason: end_turn
Tool Calls: 5
---

user:
<user_query>
Implement user login functionality
</user_query>

A:
I'll help you implement user login. Let me check the project structure first.

[Tool call] list_files
{"path": "src"}

[Tool result] list_files
src/
├── components/
├── pages/
└── utils/

A:
I see the structure. Let me create the login component.

[Tool call] write_to_file
{"path": "src/components/Login.tsx", "content": "..."}

[Tool result] write_to_file
File created successfully

A:
Login component created successfully.
```

### Example 2: Long Query with Sanitization

**Input Query**: `帮我修复这个bug：TypeError: Cannot read property 'name' of undefined!!!`

**Sanitized Filename**: `20260208-1545-帮我修复这个bug-TypeError-Cannot-read-pr.txt`

(Special chars replaced, truncated to 50 chars)

## Related Decisions

| Decision | Relationship |
|----------|-------------|
| D01 Asset Management | Transcript is a read-only asset type |
| D03 AGENTS.md Content | Documents transcript usage |

## Implementation Reference

Based on: `ide-agent/packages/agent/src/agents/review/transcript/TranscriptWriter.ts`

---
← [Back to outline](../outline.md)
