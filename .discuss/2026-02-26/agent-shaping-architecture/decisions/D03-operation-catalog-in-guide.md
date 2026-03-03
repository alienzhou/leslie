# D03: 操作定义全量写入 leslie_system_guide，Skill 体系延后

**Status**: ✅ Confirmed
**Related Outline**: [Back to Outline](../outline.md)

---

## 📋 Background

### Problem
Agent 需要了解 Leslie 的 Thread 操作（spawn/reference/lifecycle/transfer/inject）。D18-19 设计了 atomic/composite Skill 体系，但在 A+B 方案下需要重新审视其定位。

### Constraints
- 当前操作数量有限（5 个核心操作）
- AGENTS.md 已有 `<leslie_system_guide>` 注入机制
- Skill 按需加载需要额外的 `use_skill` 机制

---

## 🎯 Objective

确定操作知识的载体和注入方式。

---

## 📊 Solution Comparison

| Solution | Description | Advantages | Disadvantages | Decision |
|----------|-------------|------------|---------------|----------|
| 扩展 leslie_system_guide | 在现有 guide block 中补充操作语义 + 行为策略 | 简单、零额外机制、一次 init 即生效 | Guide 内容变长 | ✅ |
| D18-19 Skill 体系 | atomic/composite Skill 文件，Agent 按需 use_skill 加载 | token 高效（按需）、可扩展 | 需实现 use_skill 机制、MVP 阶段 ROI 低 | ❌ (deferred) |

---

## ✅ Final Decision

### Chosen Solution
将全部操作定义写入 `<leslie_system_guide>`，版本升级至 2.0.0。

新增内容：
- 每个操作的语义说明 + When to / When NOT to
- 六条 Behavior Guidelines（行为策略）
- Agent 身份声明（"You are running inside a Leslie Thread"）

### Decision Rationale
1. 5 个操作 + 行为策略的 token 量可控，不需要按需加载
2. 复用已有的 `AgentsGuideManager` → AGENTS.md 注入链路
3. 避免实现 Skill 加载机制带来的额外复杂度

---

## ❌ Rejected Solutions

### D18-19 Skill 体系（MVP 阶段）
- **Rejection Reason**: 当前操作数量少，全量注入 token 成本可接受；Skill 加载机制 ROI 低
- **Reconsideration**: 当操作定义增长到 token 成本显著（如 10+ 操作 / 复合工作流定义）时，拆分为按需加载的 Skill

---

## 🔗 Related Links

- [D01 Agent Shaping 双层方案](./D01-agent-shaping-dual-layer.md)
- [D18-19 Skill Design](../../../2026-02-04/multi-thread-agent-orchestration/decisions/D18-19-skill-design.md)
