# 用 Claude Agent SDK 替代 ACP 协议层

> Discussion Date: 2026-02-24
> Context: 实现 spawn 实际启动 Agent 时，发现 ACP 协议层（D01, D16-17）可被官方 SDK 替代

## 🔵 Current Focus
- Q8: session resume 如何映射到 SDK 的 `options.resume`？
- Q10: 流式输出的消费方式——CLI 展示格式、日志持久化

## ⚪ Pending
(Empty)

## ⏸️ Deferred
- Q11: 多 Thread 前台交互模型 — MVP 先单 Thread，后续根据实际使用模式再设计
- Q12: CLI TUI 框架选型 — 依赖 Q11，一起 defer

## ✅ Confirmed

### D29: SDK 替代 ACP 协议层
- **文档**: [D29-sdk-replaces-acp](./decisions/D29-sdk-replaces-acp.md)

### D30: SDK 使用约定（Q6 + Q7 + Q9）
- **文档**: [D30-sdk-usage-conventions](./decisions/D30-sdk-usage-conventions.md)
- Q7: 单轮 `query(prompt: string)` 优先，inject 用 `resume` 接续
- Q9: `settingSources: ["project"]`，加载项目配置
- Q6: `permissionMode: "default"` + `canUseTool` 交互审批，所有工具需用户确认

### Q5/Q11 → MVP 单 Thread 前台交互
- spawn 默认前台运行，用户在终端实时看到输出并审批
- 多 Thread 场景：用户开多个终端窗口各自 spawn
- 渐进信任路径：先全审批 → 观察 Agent 行为 → 按需放松到 acceptEdits/bypass

### 以下设计不变
- Thread = Claude Code 进程（D16 核心）
- Skill 注入能力（D17）
- Objective-Thread 模型（D23-26）
- CLI 设计（D12-15, D27-28）

## ❌ Rejected
- 继续使用 ACP 协议层自行实现
- canUseTool 方案 A（默认全部 allow）— 用户希望保留控制权

## 📚 Background

### SDK 权限体系

权限检查顺序：Hooks → Permission Rules → Permission Mode → `canUseTool` callback

#### permissionMode 选项
| Mode | 行为 | 适用场景 |
|------|------|----------|
| `default` | 不自动批准任何工具 | **Leslie MVP 默认** |
| `acceptEdits` | 自动批准文件编辑 | 渐进信任阶段 |
| `bypassPermissions` | 跳过所有权限检查 | CI/完全信任 |
| `plan` | 不执行工具，只规划 | 方案预览 |

### 多 Thread 交互模型（deferred）

| 路线 | 描述 | 阶段 |
|------|------|------|
| 1. 单 Thread 前台 | 一个终端一个 Thread | **MVP** |
| 2. Focus + Queue | 前台 + 审批队列 | V2 |
| 3. TUI / Web | 分区界面 | Future |

## 🔗 Related
- [原始 outline](../../2026-02-04/multi-thread-agent-orchestration/outline.md)
- [D27-28 CLI 双能力](../../2026-02-04/multi-thread-agent-orchestration/decisions/D27-28-cli-dual-capabilities.md)

## 📂 Discussion Artifacts

### Decisions
- [D29-sdk-replaces-acp](./decisions/D29-sdk-replaces-acp.md) — SDK 替代 ACP 协议层
- [D30-sdk-usage-conventions](./decisions/D30-sdk-usage-conventions.md) — SDK 使用约定
