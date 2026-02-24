# 用 Claude Agent SDK 替代 ACP 协议层

> Discussion Date: 2026-02-24
> Context: 实现 spawn 实际启动 Agent 时，发现 ACP 协议层（D01, D16-17）可被官方 SDK 替代

## 🔵 Current Focus
- Q5: `query()` 的 Options 如何配置？Leslie 应该控制哪些参数，透传哪些？
- Q6: permissionMode 策略 — 默认 `acceptEdits`，通过 `canUseTool` 支持人工介入

## ⚪ Pending
- Q8: session resume 如何映射到 SDK 的 `options.resume`？
- Q10: 流式输出的消费方式——CLI 展示格式、日志持久化

## ✅ Confirmed

### D29: SDK 替代 ACP 协议层
- **决策**: 采用 `@anthropic-ai/claude-agent-sdk` 替代 ACP 协议层
- **文档**: [D29-sdk-replaces-acp](./decisions/D29-sdk-replaces-acp.md)

### Q7 → 先做单轮
- spawn 发一个 intent，Agent 自主跑完（单轮 `query(prompt: string)`）
- 后续 inject 通过 `resume` 起新 `query()` 接续 session

### Q9 → settingSources: ["project"]
- 加载项目配置（CLAUDE.md/AGENTS.md），不加载 user 级配置
- 保证 Agent 了解项目规范，同时避免个人配置干扰

### 以下设计不变
- Thread = Claude Code 进程（D16 核心）
- Skill 注入能力（D17）
- Objective-Thread 模型（D23-26）
- CLI 设计（D12-15, D27-28）

## ❌ Rejected
- 继续使用 ACP 协议层自行实现（工作量大、与本地子进程模式不匹配）

## 📚 Background

### SDK 权限体系

权限检查顺序：Hooks → Permission Rules → Permission Mode → `canUseTool` callback

#### permissionMode 选项
| Mode | 行为 | 适用场景 |
|------|------|----------|
| `default` | 不自动批准任何工具 | 需要完全控制 |
| `acceptEdits` | 自动批准文件编辑（Write/Edit/mkdir/rm 等） | **Leslie 默认** |
| `bypassPermissions` | 跳过所有权限检查 | CI/完全信任 |
| `plan` | 不执行工具，只规划 | 方案预览 |

#### canUseTool 回调
```typescript
canUseTool: async (toolName, input) => {
  // 被 permissionMode 未覆盖的工具会走到这里（如 Bash 命令）
  // 可以：allow / deny / 修改 input 后 allow
  return { behavior: "allow", updatedInput: input };
  // 或
  return { behavior: "deny", message: "reason" };
}
```

可以在运行时动态切换 mode：`await q.setPermissionMode("bypassPermissions")`

### SDK 核心 API

```typescript
const q = query({
  prompt: "实现用户注册功能",
  options: {
    cwd: "/path/to/project",
    permissionMode: "acceptEdits",
    settingSources: ["project"],
    systemPrompt: { type: "preset", preset: "claude_code" },
    canUseTool: async (toolName, input) => { /* ... */ },
    abortController: new AbortController(),
  }
});
for await (const msg of q) { /* ... */ }
```

### SDKMessage 类型
| Type | 含义 | 包含信息 |
|------|------|----------|
| `assistant` | Agent 回复 | 文本、tool_use blocks |
| `user` | 用户输入 | 原始 prompt |
| `result` | 最终结果 | duration, cost, usage, errors |
| `system` | 系统消息 | 状态变更等 |

### 关键 Options
| Option | 类型 | Leslie 关注度 |
|--------|------|-------------|
| `cwd` | string | 高 — Thread 工作目录 |
| `permissionMode` | enum | 高 — 决定 Agent 自主程度 |
| `canUseTool` | callback | 高 — 人工介入审批 |
| `settingSources` | array | 中 — 是否加载项目配置 |
| `systemPrompt` | string/preset | 高 — 可注入 Thread context |
| `maxTurns` | number | 中 — 防止无限循环 |
| `maxBudgetUsd` | number | 低 — 成本控制 |
| `resume` | string | 高 — session 恢复 |
| `abortController` | AbortController | 高 — 取消/暂停 |
| `tools` | array/preset | 中 — 工具限制 |
| `mcpServers` | Record | 低 — MCP 扩展 |

## 🔗 Related
- [原始 outline](../../2026-02-04/multi-thread-agent-orchestration/outline.md)
- [D01 ACP 选型](../../2026-02-04/multi-thread-agent-orchestration/decisions/D01-acp-protocol-selection.md) — superseded
- [D16-17 ACP 集成](../../2026-02-04/multi-thread-agent-orchestration/decisions/D16-17-acp-integration.md) — 协议层 superseded

## 📂 Discussion Artifacts

### Decisions
- [D29-sdk-replaces-acp](./decisions/D29-sdk-replaces-acp.md) — SDK 替代 ACP 协议层
