# Thread 自动编排 + 终端 UI 多 Thread 展示

## 🔵 Current Focus

### Q6: 一体化命令 → `leslie run --title "..."` ✅ 已确认思路 B
- 新增 `leslie run` 命令，内部串联 create objective + spawn + runAgent

### Q8: 并发执行模型
- 之前说"串行执行"被挑战：Agent 为什么不能 spawn 多个子 Thread？
- 用户提出三种父 Agent 行为：
  1. 不等待，继续执行（fire-and-forget）
  2. 挂起，等待所有 spawn 的 agent 结束（fork-join）
  3. 挂起，等待部分 spawn 的 agent 结束（selective wait）
- 这涉及 spawn 的阻塞/非阻塞语义和 Agent 的挂起/恢复机制

## ⚪ Pending

### Q7: 当前输出可见性问题

### Q4: ink UI 集成方案
- 确认用 ink，基础流程跑通后再集成

### Q5: 与 oclif 的集成方式

## ✅ Confirmed

### C1: 终端 UI 选用 ink → [D01](decisions/D01-ink-terminal-ui.md)
### C2: 扁平 Agent 架构（无 meta-agent） → [D02](decisions/D02-flat-agent-architecture.md)
### C3: 实现优先级（先运行后展示）
### C4: spawn = create thread + start agent（目前绑定） → [D03](decisions/D03-spawn-semantics.md)
### C5: Agent 拆分引导策略（AGENTS.md 引导，观察迭代）
### C6: 一体化命令选用思路 B — `leslie run --title "..."`

## ❌ Rejected

### R1: meta-agent 编排器 → [D02](decisions/D02-flat-agent-architecture.md)
### R2: 内置 Scheduler / 拓扑模板 → [D02](decisions/D02-flat-agent-architecture.md)
### R3: 思路 A（增强 objective create）
- Reason: `run` 语义更直觉，`objective create` 保持纯粹
