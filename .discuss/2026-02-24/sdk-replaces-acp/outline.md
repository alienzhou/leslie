# 用 Claude Agent SDK 替代 ACP 协议层

> Discussion Date: 2026-02-24
> Status: ✅ Complete

## 🔵 Current Focus
(All resolved)

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
- Q6: `permissionMode: "default"` + `canUseTool` 交互审批

### Q5/Q11 → MVP 单 Thread 前台交互
- spawn 默认前台运行，用户在终端实时看到输出并审批
- 多 Thread 场景：用户开多个终端窗口各自 spawn
- 渐进信任路径：先全审批 → 观察 Agent 行为 → 按需放松

### Q8 → session resume
- 从首条 SDKMessage 拿到 `session_id`，写入 ThreadInfo
- resume 时传 `options.resume: thread.session_id`

### Q10 → 输出格式
- `assistant` → 直接打印文本
- `tool_use` → `[tool] ToolName: summary` + 等待审批
- `result` → `[done] 耗时/花费摘要`
- `system` → 省略或灰色
- 完整 SDKMessage JSON 写入 transcript 文件备查

### 以下设计不变
- Thread = Claude Code 进程（D16 核心）
- Skill 注入能力（D17）
- Objective-Thread 模型（D23-26）
- CLI 设计（D12-15, D27-28）

## ❌ Rejected
- 继续使用 ACP 协议层自行实现
- canUseTool 方案 A（默认全部 allow）

## 🔗 Related
- [原始 outline](../../2026-02-04/multi-thread-agent-orchestration/outline.md)
- [D27-28 CLI 双能力](../../2026-02-04/multi-thread-agent-orchestration/decisions/D27-28-cli-dual-capabilities.md)

## 📂 Discussion Artifacts

### Decisions
- [D29-sdk-replaces-acp](./decisions/D29-sdk-replaces-acp.md) — SDK 替代 ACP 协议层
- [D30-sdk-usage-conventions](./decisions/D30-sdk-usage-conventions.md) — SDK 使用约定
