# Thread 自动编排 + 终端 UI 多 Thread 展示

## 🔵 Current Focus

### Q7: 当前输出可见性问题（待排查）
### Q4: ink UI 集成方案（基础流程跑通后）

## ⚪ Pending

### Q5: 与 oclif 的集成方式

## ✅ Confirmed

### C1: 终端 UI 选用 ink → [D01](decisions/D01-ink-terminal-ui.md)
### C2: 扁平 Agent 架构（无 meta-agent） → [D02](decisions/D02-flat-agent-architecture.md)
### C3: 实现优先级（先运行后展示）
### C4: spawn = create thread + start agent（绑定） → [D03](decisions/D03-spawn-semantics.md)
### C5: Agent 拆分引导策略（AGENTS.md 引导，观察迭代）
### C6: 一体化命令 `leslie run --title "..."` → [D05](decisions/D05-leslie-run-command.md)

### C7: 非阻塞 spawn + 事件驱动唤醒 → [D04](decisions/D04-non-blocking-spawn-and-resume.md)
- spawn 启动子 Agent 在后台进程运行，立即返回 thread ID
- 父 Agent 可连续 spawn 多个，实现真并发

### C8: `leslie run` = 监控器 + 渲染器 → [D05](decisions/D05-leslie-run-command.md)
- 不是调度器，不负责启动子 Thread（spawn 自己启动）
- 职责：创建 Objective → spawn 首个 Thread → 监控 → 渲染输出 → 事件驱动唤醒

### C9: 事件驱动，非轮询
- 不轮询。每个 Thread 完成时产生事件/回调
- `leslie run` 的监控器响应事件，检查是否需要唤醒挂起的父 Thread
- 实现方式：子 Agent 进程退出 → 回调 → 更新状态 → 检查 resume 条件

## ❌ Rejected

### R1-R3: (同前)
### R4: 外部调度循环（spawn 直接启动）
### R5: 轮询式监控
- Reason: 每个 Thread 完成时必然有状态上报，监控器直接响应事件即可
