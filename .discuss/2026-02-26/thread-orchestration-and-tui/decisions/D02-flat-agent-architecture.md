# D02: 扁平 Agent 架构（无 meta-agent）

**Status**: ✅ Confirmed
**Related Outline**: [Back to Outline](../outline.md)

---

## 📋 Background

### Problem
多 Thread 编排需要决定：是否需要一个特殊的"编排 Agent"来管理其他 Agent？

### Constraints
- 保持架构简单，先跑通再优化
- 遵循 Human-Agent Parity (D22)：所有 Agent 使用相同的操作原语

---

## 📊 Solution Comparison

| Solution | Description | Advantages | Disadvantages | Decision |
|----------|-------------|------------|---------------|----------|
| 扁平架构 | 所有 Agent 完全平级，都可 spawn/reference/transfer | 简单、一致、符合 D22 | Agent 可能不主动拆分 | ✅ |
| meta-agent | 专门的编排 Agent 负责分析任务、分配子 Thread | 更智能的拆分 | 复杂、引入特殊角色 | ❌ (deferred) |
| 内置 Scheduler | Leslie 定义拓扑，按模板自动调度 | 可控、确定性 | 过度设计、不灵活 | ❌ |

---

## ✅ Final Decision

**扁平架构**：所有 Agent 完全平级。创建 Objective 时自动启动一个普通 Agent，该 Agent 根据任务自行决定是否 spawn 子 Thread。

### Decision Rationale
先保持简单，观察 Agent 的自主拆分行为，根据实际问题再决定是否引入编排层。

---

## 🔗 Related Links
- [D22 Human-Agent Parity](../../../2026-02-04/multi-thread-agent-orchestration/decisions/D22-human-agent-parity.md)
