# 用 Claude Agent SDK 替代 ACP 协议层

> Discussion Date: 2026-02-24
> Context: 实现 spawn 实际启动 Agent 时，发现 ACP 协议层（D01, D16-17）可被官方 SDK 替代

## 🔵 Current Focus
(All questions resolved)

## ⚪ Pending
(Empty)

## ✅ Confirmed

### D29: SDK 替代 ACP 协议层
- **决策**: 采用 `@anthropic-ai/claude-agent-sdk` 替代 ACP 协议层
- **文档**: [D29-sdk-replaces-acp](./decisions/D29-sdk-replaces-acp.md)
- **影响范围**:
  - D01 (ACP 选型) → superseded
  - D16 (Thread = Session) → 协议层 superseded，核心设计保留
  - D17 (Skill 注入) → 不变
  - 代码: 移除 HttpAcpClient/MockAcpClient，新建 AgentRunner

### 以下设计不变
- Thread = Claude Code 进程（D16 核心）
- Skill 注入能力（D17）
- Objective-Thread 模型（D23-26）
- CLI 设计（D12-15, D27-28）

## ❌ Rejected
- 继续使用 ACP 协议层自行实现（工作量大、与本地子进程模式不匹配）

## 📚 Background

### 关键差异

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
