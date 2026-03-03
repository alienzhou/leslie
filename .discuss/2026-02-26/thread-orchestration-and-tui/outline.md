# Thread 自动编排 + 终端 UI 多 Thread 展示

## 🔵 Current Focus

### Q8: 并发执行模型（重新审视）
- 用户挑战"调度循环"设计：spawn 就是 create + start，为什么不直接启动？
- 核心问题变为：spawn 启动子 Agent 是**阻塞**还是**非阻塞**？
  - 阻塞 → 串行（父等子完成）
  - 非阻塞 → 并发（子进程后台运行，父继续）
- 如果非阻塞，`leslie run` 只需监控 Objective 完成状态，不需要调度循环

## ⚪ Pending

### Q7: 当前输出可见性问题
### Q4: ink UI 集成方案
### Q5: 与 oclif 的集成方式

## ✅ Confirmed

### C1: 终端 UI 选用 ink → [D01](decisions/D01-ink-terminal-ui.md)
### C2: 扁平 Agent 架构（无 meta-agent） → [D02](decisions/D02-flat-agent-architecture.md)
### C3: 实现优先级（先运行后展示）
### C4: spawn = create thread + start agent（绑定） → [D03](decisions/D03-spawn-semantics.md)
### C5: Agent 拆分引导策略（AGENTS.md 引导，观察迭代）
### C6: 一体化命令 `leslie run --title "..."`

## ❌ Rejected

### R1: meta-agent 编排器 → [D02](decisions/D02-flat-agent-architecture.md)
### R2: 内置 Scheduler / 拓扑模板 → [D02](decisions/D02-flat-agent-architecture.md)
### R3: 思路 A（增强 objective create）
### R4: 外部调度循环启动子 Thread（被挑战中）
- 用户观点：spawn 自身就应该直接启动，不需要"别人"来启动
