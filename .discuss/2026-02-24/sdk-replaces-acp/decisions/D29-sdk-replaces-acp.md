# D29: 用 Claude Agent SDK 替代 ACP 协议层

> Status: ✅ Confirmed
> Decision Date: 2026-02-24
> Supersedes: D01 (ACP 协议选型), D16 (Thread = ACP Session) 中的协议层部分

## 📋 Background

### Problem
实现 `leslie spawn` 实际启动 Claude Code 时，发现：
1. 现有 `HttpAcpClient` 假设 HTTP 传输，不匹配本地子进程模式
2. ACP 是低层协议（JSON-RPC 2.0），需要自行实现消息收发、流式输出、进程管理
3. `@anthropic-ai/claude-agent-sdk`（v0.2.50）已成熟，一站式封装了上述所有能力

### Constraints
- 仍需保持 Thread = Claude Code 进程 的核心映射（D16 核心不变）
- Skill 注入能力的方式不受影响（D17 不变）
- 需要支持流式输出展示

## 🎯 Objective

选择最合适的方式让 Leslie 启动和管理 Claude Code 进程。

## 📊 Solution Comparison

| 方案 | 描述 | 优势 | 劣势 | 决策 |
|------|------|------|------|------|
| A: ACP 协议 | 自实现 JSON-RPC 2.0 over stdin/stdout | 标准化、协议可控 | 工作量大、重复造轮子、HTTP 实现与本地模式不匹配 | ❌ |
| B: Claude Agent SDK | 使用 `@anthropic-ai/claude-agent-sdk` 的 `query()` | 官方维护、一站式、流式输出内置、resume 支持 | 依赖 Anthropic SDK 版本 | ✅ |

## ✅ Final Decision

### Chosen Solution
采用 `@anthropic-ai/claude-agent-sdk` 作为 Leslie 与 Claude Code 的通信层。

核心 API：
- `query({ prompt, options })` → 启动 Claude Code 并获取 `AsyncGenerator<SDKMessage>`
- `options.resume` → 恢复已有 session
- `options.cwd` → 指定工作目录
- `options.permissionMode` → 权限控制

### 映射关系更新

| Thread 概念 | 旧 (ACP) | 新 (SDK) |
|------------|----------|----------|
| 启动 Thread | `session/new` | `query({ prompt })` |
| 发送任务 | `session/prompt` | `query()` 多轮 streaming input |
| 接收输出 | `session/update` | `AsyncGenerator<SDKMessage>` |
| 恢复 Thread | `session/load` | `query({ options: { resume } })` |
| 取消 Thread | `session/cancel` | `abortController.abort()` |

### 代码影响
- 移除 `HttpAcpClient`、`MockAcpClient`
- 新建 `AgentRunner`（基于 SDK `query()`）
- `AcpClient` 接口废弃

### Decision Rationale
1. SDK 已封装子进程管理、stdin/stdout 通信、消息解析
2. 官方维护，跟随 Claude Code 版本演进
3. `AsyncGenerator` 天然支持流式输出
4. ACP 更适合编辑器场景，Leslie 作为 CLI 编排器用 SDK 更直接

## ❌ Rejected Solution

### ACP 协议
- **Rejection Reason**: 抽象层级过低，需要大量自实现工作；现有 `HttpAcpClient` 与本地子进程模式不匹配
- **Reconsideration**: 若未来 Leslie 需要作为 ACP Server 被编辑器调用，可重新引入 ACP（但作为 Server 而非 Client）

## 🔗 Related
- [D01 ACP 选型](../../../2026-02-04/multi-thread-agent-orchestration/decisions/D01-acp-protocol-selection.md) — superseded
- [D16-17 ACP 集成](../../../2026-02-04/multi-thread-agent-orchestration/decisions/D16-17-acp-integration.md) — 协议层 superseded，核心设计保留
- [D17 Skill 注入](../../../2026-02-04/multi-thread-agent-orchestration/decisions/D16-17-acp-integration.md) — 不变

---
← [Back to outline](../outline.md)
