# 用 Claude Agent SDK 替代 ACP 协议层

> Discussion Date: 2026-02-24
> Context: 实现 spawn 实际启动 Agent 时，发现 ACP 协议层（D01, D16-17）可被官方 SDK 替代

## 🔵 Current Focus
- Q5: `query()` 的 Options 如何配置？Leslie 应该控制哪些参数，透传哪些？
- Q6: permissionMode 策略——Agent 执行时应该自动 bypass 还是让用户控制？
- Q7: spawn 是单轮（发 prompt 等结果）还是多轮（支持持续对话）？

## ⚪ Pending
- Q8: session resume 如何映射到 SDK 的 `options.resume`？
- Q9: settingSources 策略——Leslie 是隔离运行还是加载项目配置？
- Q10: 流式输出的消费方式——CLI 展示格式、日志持久化

## ✅ Confirmed

### D29: SDK 替代 ACP 协议层
- **决策**: 采用 `@anthropic-ai/claude-agent-sdk` 替代 ACP 协议层
- **文档**: [D29-sdk-replaces-acp](./decisions/D29-sdk-replaces-acp.md)
- **影响范围**:
  - D01 (ACP 选型) → superseded
  - D16 (Thread = Session) → 协议层 superseded，核心设计保留
  - D17 (Skill 注入) → 不变
  - 代码: 已删除 HttpAcpClient/MockAcpClient/AcpTypes

### 以下设计不变
- Thread = Claude Code 进程（D16 核心）
- Skill 注入能力（D17）
- Objective-Thread 模型（D23-26）
- CLI 设计（D12-15, D27-28）

## ❌ Rejected
- 继续使用 ACP 协议层自行实现（工作量大、与本地子进程模式不匹配）

## 📚 Background

### SDK 核心 API

```typescript
// 启动 Agent
const q = query({
  prompt: "实现用户注册功能",
  options: {
    cwd: "/path/to/project",
    permissionMode: "bypassPermissions",
    settingSources: ["project"],
    systemPrompt: { type: "preset", preset: "claude_code" },
    maxTurns: 50,
    // ...
  }
});

// 流式消费
for await (const msg of q) {
  // msg.type: "assistant" | "user" | "result" | "system" | ...
}
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
| `settingSources` | array | 中 — 是否加载项目配置 |
| `systemPrompt` | string/preset | 高 — 可注入 Thread context |
| `maxTurns` | number | 中 — 防止无限循环 |
| `maxBudgetUsd` | number | 低 — 成本控制 |
| `resume` | string | 高 — session 恢复 |
| `abortController` | AbortController | 高 — 取消/暂停 |
| `tools` | array/preset | 中 — 工具限制 |
| `mcpServers` | Record | 低 — MCP 扩展 |

### 关键差异对比表

| 维度 | ACP 协议 | Claude Agent SDK |
|------|----------|-----------------|
| 抽象层级 | 低层协议（JSON-RPC） | 高层 SDK（函数调用） |
| 通信方式 | stdin/stdout JSON-RPC 或 HTTP | 子进程 + stream-json |
| 消息模型 | session/new, session/prompt | query() AsyncGenerator |
| 流式输出 | session/update notification | AsyncGenerator<SDKMessage> |
| Resume | session/load | options.resume |
| 维护方 | ACP 社区标准 | Anthropic 官方 |
| 适用场景 | 编辑器 ↔ Agent | 程序 ↔ Claude Code |

## 🔗 Related
- [原始 outline](../../2026-02-04/multi-thread-agent-orchestration/outline.md)
- [D01 ACP 选型](../../2026-02-04/multi-thread-agent-orchestration/decisions/D01-acp-protocol-selection.md) — superseded
- [D16-17 ACP 集成](../../2026-02-04/multi-thread-agent-orchestration/decisions/D16-17-acp-integration.md) — 协议层 superseded

## 📂 Discussion Artifacts

### Decisions
- [D29-sdk-replaces-acp](./decisions/D29-sdk-replaces-acp.md) — SDK 替代 ACP 协议层
