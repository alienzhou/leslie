# 用 Claude Agent SDK 替代 ACP 协议层

> Discussion Date: 2026-02-24
> Context: 实现 spawn 实际启动 Agent 时，发现 ACP 协议层（D01, D16-17）可被官方 SDK 替代

## 🔵 Current Focus
- Q1: D01（ACP 协议选型）是否需要 supersede？SDK 和 ACP 的关系是什么？
- Q2: D16-17（ACP 集成方案）如何更新？哪些设计仍然成立？

## ⚪ Pending
- Q3: 现有 `acp/` 目录下的代码如何处理（HttpAcpClient, MockAcpClient）？
- Q4: 架构图和 AGENTS.md 中的 ACP 引用是否需要更新？

## ✅ Confirmed
(Empty)

## ❌ Rejected
(Empty)

## 📚 Background

### 原始决策（2026-02-04）
- **D01**: 选择 ACP 作为 Agent 通信协议（JSON-RPC 2.0）
- **D16**: Thread = ACP Session，每个 Thread 对应一个 Claude Code 进程
- **D17**: 通过 Skill 注入能力，而非 MCP

### 现状（2026-02-24）
- `@anthropic-ai/claude-agent-sdk`（v0.2.50）已成熟，提供 `query()` 一站式封装
- SDK 内部不走 ACP 协议，而是用 Claude Code CLI 的原生 `stream-json` 格式
- 现有 `HttpAcpClient` 基于 HTTP 传输，与本地子进程模式不匹配
- ACP 更适合编辑器场景（Zed 等），Leslie 作为 CLI 编排器用 SDK 更直接

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
- [D01 ACP 选型](../../2026-02-04/multi-thread-agent-orchestration/decisions/D01-acp-protocol-selection.md)
- [D16-17 ACP 集成](../../2026-02-04/multi-thread-agent-orchestration/decisions/D16-17-acp-integration.md)
