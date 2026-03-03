# Thread 自动编排 + 终端 UI 多 Thread 展示

## 🔵 Current Focus

### Q9: 挂起等待的唤醒机制
- 父 Agent spawn 多个子 Thread（非阻塞）后挂起自己
- 子 Thread 完成后，谁来唤醒父 Agent？怎么唤醒？
- 需要一个"检测子完成 → resume 父"的机制

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
### C6: 一体化命令 `leslie run --title "..."` → [D05](decisions/D05-leslie-run-command.md)
### C7: 非阻塞 spawn + 事件驱动唤醒 → [D04](decisions/D04-non-blocking-spawn-and-resume.md)
- spawn 启动子 Agent 在后台进程运行，立即返回 thread ID
- 父 Agent 可连续 spawn 多个，实现真并发
- 父 Agent 完成后可选择：继续做事 / 结束 / 挂起等待子 Thread
- 唤醒机制：`leslie run` 检测子完成 → resume 父 Agent（via session_id）

### C8: `leslie run` = 监控器 + 渲染器 → [D05](decisions/D05-leslie-run-command.md)
- 不是调度器，不负责启动子 Thread（spawn 自己启动）
- 职责：创建 Objective → spawn 首个 Thread → 监控所有 Thread 状态 → 渲染输出 → 事件驱动唤醒
- 持续运行直到 Objective 下所有 Thread 完成

## ❌ Rejected

### R1-R3: (同前)
### R4: 外部调度循环启动子 Thread
- spawn 直接启动，不需要调度器
