# 用 Claude Agent SDK 替代 ACP 协议层

> Discussion Date: 2026-02-24
> Context: 实现 spawn 实际启动 Agent 时，发现 ACP 协议层（D01, D16-17）可被官方 SDK 替代

## 🔵 Current Focus
- Q6: permissionMode = 默认前台交互审批，所有工具都需用户确认
- Q11: **多 Thread 前台交互模型** — 多个 Thread 同时需要审批时如何展示？CLI 能否分区/多 Tab？

## ⚪ Pending
- Q8: session resume 如何映射到 SDK 的 `options.resume`？
- Q10: 流式输出的消费方式——CLI 展示格式、日志持久化
- Q12: CLI TUI 框架选型（Ink? blessed? 其他？）

## ✅ Confirmed

### D29: SDK 替代 ACP 协议层
- **决策**: 采用 `@anthropic-ai/claude-agent-sdk` 替代 ACP 协议层
- **文档**: [D29-sdk-replaces-acp](./decisions/D29-sdk-replaces-acp.md)

### D30: SDK 使用约定（Q6 + Q7 + Q9）
- **文档**: [D30-sdk-usage-conventions](./decisions/D30-sdk-usage-conventions.md)
- Q7: 单轮 `query(prompt: string)` 优先，inject 用 `resume` 接续
- Q9: `settingSources: ["project"]`，加载项目配置
- Q6: `permissionMode: "default"` + `canUseTool` 交互审批，所有工具需用户确认

### 以下设计不变
- Thread = Claude Code 进程（D16 核心）
- Skill 注入能力（D17）
- Objective-Thread 模型（D23-26）
- CLI 设计（D12-15, D27-28）

## ❌ Rejected
- 继续使用 ACP 协议层自行实现
- canUseTool 方案 A（默认全部 allow）— 用户希望保留控制权

## 📚 Background

### 多 Thread 前台交互 — 核心矛盾

三个目标互相冲突：
1. **透明性**：看到每个 Thread 在做什么
2. **控制权**：审批每个工具调用
3. **并行性**：多 Thread 同时运行

如果所有 Thread 都前台交互审批，用户成为瓶颈，并行性丧失。

### CLI 多区域/多 Tab 技术方案

| 方案 | 技术 | 复杂度 | 体验 |
|------|------|--------|------|
| A. 单 Thread 前台 | 基本 readline | 低 | 一次只操作一个 Thread |
| B. 多 Terminal 窗口 | 每个 Thread 一个 shell | 低 | 依赖终端模拟器 |
| C. TUI 分区 | Ink / blessed / terminal-kit | 中 | 类 htop/lazygit |
| D. Focus + Queue | 一个前台 + 审批队列 | 中 | 类通知中心 |
| E. Web UI | packages/web | 高 | 最灵活 |

### Node.js TUI 框架
| 框架 | 特点 | Stars | 适合 |
|------|------|-------|------|
| **Ink** | React for CLI，组件化 | 27k+ | 复杂交互式 CLI |
| **blessed** | 底层终端 UI，类 ncurses | 11k+ | Dashboard 类 |
| **terminal-kit** | 全功能终端工具包 | 3k+ | 低层控制 |
| **@clack/prompts** | 漂亮的交互式提示 | 5k+ | 简单 prompt |

## 🔗 Related
- [原始 outline](../../2026-02-04/multi-thread-agent-orchestration/outline.md)
- [D27-28 CLI 双能力](../../2026-02-04/multi-thread-agent-orchestration/decisions/D27-28-cli-dual-capabilities.md) — Human 交互层

## 📂 Discussion Artifacts

### Decisions
- [D29-sdk-replaces-acp](./decisions/D29-sdk-replaces-acp.md) — SDK 替代 ACP 协议层
- [D30-sdk-usage-conventions](./decisions/D30-sdk-usage-conventions.md) — SDK 使用约定（单轮、project settings、交互审批）
