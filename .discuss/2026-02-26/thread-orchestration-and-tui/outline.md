# Thread 自动编排 + 终端 UI 多 Thread 展示

## 🔵 Current Focus

### Q3: Objective → 自动启动首个 Thread 的实现
- 创建 Objective 时自动 spawn 一个普通 Thread
- 该 Thread 的 Agent 与其他 Agent 完全平级
- Agent 根据任务复杂度自行决定是否 spawn 子 Thread
- 先跑通基本流程再优化

## ⚪ Pending

### Q4: ink UI 集成方案
- 确认用 ink，但在基础流程跑通后再做
- 需要处理网状关系（reference 导致非纯树结构）的展示

### Q5: 与 oclif 的集成方式

## ✅ Confirmed

### C1: 终端 UI 选用 ink
- React for CLI，Flexbox 布局，支持多 panel + 实时流式输出
- Thread 关系是网状（spawn 构成树 + reference 构成图），非纯树
- 在运行流程跑通后集成

### C2: 扁平 Agent 架构（无 meta-agent）
- 所有 Agent 完全平级，都可以 spawn / reference / transfer
- 创建 Objective 时自动启动一个普通 Agent
- 不引入编排 Agent / Scheduler（MVP 阶段）
- 后续根据实际问题再做架构升级

### C3: 实现优先级
- 第一步：Objective → 自动 spawn + 运行 Thread（跑通基本流）
- 第二步：ink UI 多 Thread 展示
- 原则：先运行，后展示；先简单，后复杂

## ❌ Rejected

### R1: meta-agent 编排器（MVP 阶段）
- Reason: 保持架构简单，所有 Agent 平级
- Reconsideration: 当多 Thread 协作出现反复拆分/监控需求时

### R2: 内置 Scheduler / 拓扑模板
- Reason: 过度设计，先让 Agent 自主决策
