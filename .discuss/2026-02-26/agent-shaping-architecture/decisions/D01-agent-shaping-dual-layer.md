# D01: Agent Shaping 双层方案 (A+B)

**Status**: ✅ Confirmed
**Related Outline**: [Back to Outline](../outline.md)

---

## 📋 Background

### Problem
Leslie spawn 启动的 Agent 无法感知 Thread 体系。Agent 只收到裸 intent 文本，不知道自己在 Thread 里，不知道可用的操作，也不会主动拆分任务。

### Constraints
- SDK `systemPrompt` 使用 `preset: 'claude_code'`，不便自定义
- Agent 通过 `settingSources: ['project']` 加载 AGENTS.md
- `ThreadContextBuilder` 已实现但未接入 prompt 构建

---

## 🎯 Objective

让 Agent 启动后具备三个感知：我是谁（Thread 上下文）、我能做什么（操作定义）、我该怎么做（行为策略）。

---

## 📊 Solution Comparison

| Solution | Description | Advantages | Disadvantages | Decision |
|----------|-------------|------------|---------------|----------|
| A: 仅动态 prompt | 每次 runAgent 时拼装全部信息到 prompt | 灵活、可定制 | 操作定义重复注入、token 开销大 | ❌ |
| B: 仅静态 AGENTS.md | 操作知识 + 上下文全写 AGENTS.md | 一次写入持续生效 | 无法注入动态信息（thread ID、assets） | ❌ |
| A+B: 双层 | AGENTS.md 承载静态操作知识，prompt 注入动态上下文 | 关注点分离、token 高效 | 需维护两处 | ✅ |

---

## ✅ Final Decision

### Chosen Solution
**A+B 双层方案**：
- **B 层（静态）**：`<leslie_system_guide>` in AGENTS.md — 操作语义、行为策略、CLI 命令格式
- **A 层（动态）**：`<thread_context>` XML 注入 prompt — thread ID、objective、assets、references

### Decision Rationale
1. 操作定义（spawn/reference/lifecycle 等）不随 Thread 变化，放 AGENTS.md 避免重复注入
2. Thread 上下文（ID、assets、refs）每次不同，必须动态注入
3. 现有 `ThreadContextBuilder` + `AgentsGuideManager` 可直接复用

### Implementation
- `packages/cli/src/templates/leslie-system-guide.md` → 扩充操作语义 + 行为策略（version 2.0.0）
- `packages/core/src/leslie-core.ts` → `runAgent()` 调用 `contextBuilder.build()` 拼装 prompt

---

## ❌ Rejected Solutions

### 仅动态 prompt
- **Rejection Reason**: 操作定义是静态知识，每次注入浪费 token
- **Reconsideration**: 如果 AGENTS.md 加载机制出问题或不可靠

### 仅静态 AGENTS.md
- **Rejection Reason**: 无法携带当前 Thread 的动态上下文
- **Reconsideration**: N/A

---

## 🔗 Related Links

- [D22 Human-Agent Parity](../../../2026-02-04/multi-thread-agent-orchestration/decisions/D22-human-agent-parity.md)
- [D29 SDK Replaces ACP](../../../2026-02-24/sdk-replaces-acp/decisions/D29-sdk-replaces-acp.md)
- [D30 SDK Usage Conventions](../../../2026-02-24/sdk-replaces-acp/decisions/D30-sdk-usage-conventions.md)
- [D18-19 Skill Design](../../../2026-02-04/multi-thread-agent-orchestration/decisions/D18-19-skill-design.md)
