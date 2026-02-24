# D30: SDK 使用约定

> Status: ✅ Confirmed
> Decision Date: 2026-02-24
> Related: D29 (SDK 替代 ACP)

## 📋 Background

D29 确认了用 `@anthropic-ai/claude-agent-sdk` 替代 ACP 协议层。本文档记录 SDK `query()` 的具体使用约定。

## ✅ Decisions

### 1. 单轮模式优先（Q7）

spawn 使用 `query(prompt: string)` 单轮模式：
- 传入 intent 作为 prompt，Agent 自主跑完
- 后续 inject 通过 `options.resume` 起新 `query()` 接续 session
- 不使用 `AsyncIterable<SDKUserMessage>` 多轮流式输入（MVP 阶段）

**Rationale**: 与 Thread lifecycle 状态机吻合（active → done/cancelled），实现简单。

### 2. settingSources: ["project"]（Q9）

```typescript
settingSources: ["project"]
```

- 加载项目配置（`.claude/settings.json`、`CLAUDE.md`/`AGENTS.md`）
- 不加载 `"user"` 级配置，避免个人设置干扰编排行为
- 保证 Agent 了解项目规范

**Rationale**: Leslie 的 Agent 在项目里工作，需要遵守项目规范。

### 3. 交互式审批（Q6）

```typescript
permissionMode: "default",
canUseTool: async (toolName, input) => {
  // 展示工具请求，等待用户 y/n
}
```

- `permissionMode: "default"` — 不自动批准任何操作
- 所有工具调用通过 `canUseTool` 回调展示给用户审批
- 默认前台模式，用户在终端交互确认

**Rationale**: 用户希望保留控制权（Human-Agent Parity D22）。

### 4. 典型 query 调用

```typescript
const abortController = new AbortController();

const q = query({
  prompt: thread.intent,
  options: {
    cwd: workspaceRoot,
    permissionMode: "default",
    settingSources: ["project"],
    systemPrompt: { type: "preset", preset: "claude_code" },
    canUseTool: async (toolName, input) => {
      // Leslie 的交互审批逻辑
    },
    abortController,
  }
});

for await (const msg of q) {
  // 流式处理 SDKMessage
}
```

### 5. Session Resume（Q8）

从首条 `SDKMessage` 的 `session_id` 字段获取 session ID，写入 `ThreadInfo.session_id`。
恢复 Thread 时：

```typescript
query({
  prompt: "继续任务",
  options: { resume: thread.session_id }
})
```

**Rationale**: 与现有 ThreadInfo 结构自然契合，只需加一个字段。

### 6. 前台输出格式（Q10）

| SDKMessage type | 展示方式 |
|----------------|---------|
| `assistant` | 直接打印文本 |
| `tool_use` (in assistant) | `[tool] ToolName: summary` + 等待审批 |
| `result` | `[done] 耗时/花费摘要` |
| `system` | 省略或灰色 |

完整 SDKMessage JSON 同步写入 thread 目录的 transcript 文件备查。

**Rationale**: 前台交互以可读性优先；完整数据写文件保证可追溯。

### 7. MVP 单 Thread 前台交互（Q5/Q11）

- spawn 默认前台运行，用户实时看到输出并审批
- 多 Thread：用户开多个终端窗口各自 spawn
- 渐进信任路径：全审批 → 观察行为 → 按需放松到 acceptEdits/bypass

**Rationale**: 先把单 Thread 跑通，多 Thread 调度根据实际使用模式再设计。

## ❌ Rejected

- **canUseTool 方案 A（默认全部 allow）**：用户希望保留控制权
- **settingSources: ["user", "project", "local"]**：个人配置可能干扰编排
- **多轮流式输入（MVP）**：复杂度过高，先单轮验证

## 🔗 Related
- [D29 SDK 替代 ACP](./D29-sdk-replaces-acp.md)
- [D22 Human-Agent Parity](../../../2026-02-04/multi-thread-agent-orchestration/decisions/D22-human-agent-parity.md)

---
← [Back to outline](../outline.md)
