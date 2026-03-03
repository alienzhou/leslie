# Thread 自动编排 + 终端 UI 多 Thread 展示

## 🔵 Current Focus

### Q6: Objective → 自动 spawn 首个 Thread 的命令设计
- `leslie objective create` 目前只创建 Objective 记录
- 需要一个一体化命令：创建 Objective → spawn 首个 Thread → 运行 Agent
- 是修改 `objective create` 还是新增命令（如 `leslie run`）？

### Q7: 当前输出可见性问题
- 用户反馈"中间有很多过程没有输出"
- 需要排查 Agent 运行过程中输出渲染是否完整

## ⚪ Pending

### Q4: ink UI 集成方案
- 确认用 ink，基础流程跑通后再集成
- Thread 关系是网状（spawn 构成树 + reference 构成图）

### Q5: 与 oclif 的集成方式

## ✅ Confirmed

### C1: 终端 UI 选用 ink
- React for CLI，Flexbox 布局，支持多 panel + 实时流式输出
- Thread 关系是网状结构（非纯树），展示时需考虑
- 在运行流程跑通后集成

### C2: 扁平 Agent 架构（无 meta-agent）
- 所有 Agent 完全平级，都可以 spawn / reference / transfer
- 创建 Objective 时自动启动一个普通 Agent
- 不引入编排 Agent / Scheduler（MVP 阶段）

### C3: 实现优先级
- 第一步：Objective → 自动 spawn + 运行 Thread（跑通基本流）
- 第二步：ink UI 多 Thread 展示
- 原则：先运行，后展示；先简单，后复杂

### C4: spawn = create thread + start agent（目前绑定）
- `leslie spawn` 创建 Thread 的同时也启动 Agent
- 代码层面拆分为两步（create + run），是为未来灵活性预留
- 当前两者始终绑定执行
- 当 Agent 通过 Bash 调用 `leslie spawn` 时，子 Agent 阻塞式运行（完成后父 Agent 继续）

### C5: Agent 拆分引导策略
- 通过 AGENTS.md 中的 Behavior Guidelines 引导 Agent 主动拆分
- 先观察效果，不够再加强措辞或增加机制

## ❌ Rejected

### R1: meta-agent 编排器（MVP 阶段）
### R2: 内置 Scheduler / 拓扑模板
### R3: spawn 时仅创建不启动
- Reason: spawn 与 agent 启动目前绑定，简化流程
