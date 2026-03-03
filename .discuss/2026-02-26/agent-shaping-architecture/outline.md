# Agent Shaping 架构：让 Agent 感知并使用 Leslie Thread 体系

## 🔵 Current Focus
(Empty — 讨论完成，已进入实现)

## ⚪ Pending
(Empty)

## ✅ Confirmed

### C1: A+B 双层方案 → [D01](decisions/D01-agent-shaping-dual-layer.md)
- AGENTS.md `<leslie_system_guide>` 提供静态操作知识（不变的部分）
- prompt 注入动态上下文（thread ID、objective、assets 等变化的部分）

### C2: 核心模块采用方案 α → [D02](decisions/D02-module-organization.md)
- 在 `LeslieCore.runAgent()` 中编排 prompt 构建流程
- `AgentRunner` 保持纯粹，只负责调 SDK + 收消息

### C3: 操作定义全量写入 `<leslie_system_guide>` → [D03](decisions/D03-operation-catalog-in-guide.md)
- 扩展现有 guide block，加入操作语义 + 行为策略 + CLI 命令示例
- D18-19 Skill 体系暂不实现，作为未来优化方向

### C4: prompt 拼装顺序
- `<thread_context>` XML 在前，intent 在后
- Agent 先看到上下文（我是谁），再看到任务（做什么）

### C5: Agent 通过 Bash 调 Leslie CLI
- 与 Human-Agent Parity (D22) 一致
- 无需 MCP tool（MVP 阶段）

## ❌ Rejected

### R1: 方案 β（新建 AgentConfigurator 类） → [D02](decisions/D02-module-organization.md)
### R2: Skill 体系（MVP 阶段） → [D03](decisions/D03-operation-catalog-in-guide.md)

## 🔗 Implementation

已完成实现：
- `packages/cli/src/templates/leslie-system-guide.md` — 版本 1.1.0 → 2.0.0
- `packages/core/src/leslie-core.ts` — `runAgent()` 接入 ThreadContextBuilder
