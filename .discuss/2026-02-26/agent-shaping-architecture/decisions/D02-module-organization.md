# D02: 核心模块采用方案 α（runAgent 编排）

**Status**: ✅ Confirmed
**Related Outline**: [Back to Outline](../outline.md)

---

## 📋 Background

### Problem
确定了 A+B 双层方案后，需要决定 prompt 构建逻辑放在哪里。

### Constraints
- `AgentRunner` 当前职责纯粹：调 SDK `query()` + 收消息
- `ThreadContextBuilder` 已存在但未接入

---

## 🎯 Objective

确定 prompt 构建（读 Thread → 构建 context XML → 拼装 prompt）的代码组织方式。

---

## 📊 Solution Comparison

| Solution | Description | Advantages | Disadvantages | Decision |
|----------|-------------|------------|---------------|----------|
| α: runAgent 编排 | 在 `LeslieCore.runAgent()` 中调用 contextBuilder + 拼装 prompt，AgentRunner 保持纯粹 | 简单、不增实体、职责清晰 | runAgent 会稍微变长 | ✅ |
| β: AgentConfigurator 类 | 新建类封装 prompt 构建逻辑 | 单一职责、可独立测试 | MVP 阶段过度抽象 | ❌ |

---

## ✅ Final Decision

### Chosen Solution
**方案 α**：`LeslieCore.runAgent()` 负责编排 prompt 构建，`AgentRunner` 只做 SDK 调用。

### Decision Rationale
如无必要，勿增实体。prompt 构建逻辑只有两行（`contextBuilder.build()` + 字符串拼接），不值得新建类。

---

## ❌ Rejected Solutions

### 方案 β: AgentConfigurator 类
- **Rejection Reason**: MVP 阶段 prompt 构建逻辑简单，不需要额外抽象
- **Reconsideration**: 当 prompt 构建逻辑复杂化（如 Skill 按需加载、多种 Agent 类型）时可提取

---

## 🔗 Related Links

- [D01 Agent Shaping 双层方案](./D01-agent-shaping-dual-layer.md)
