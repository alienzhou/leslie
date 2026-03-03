# D03: spawn 语义 — create thread + start agent（绑定）

**Status**: ✅ Confirmed
**Related Outline**: [Back to Outline](../outline.md)

---

## 📋 Background

### Problem
`leslie spawn` 应该只创建 Thread 记录，还是同时启动 Agent？

---

## ✅ Final Decision

**spawn = create thread + start agent**，两者目前绑定执行。

- 代码层面拆分为两步（create + run），为未来灵活性预留（创建 Thread 后可能不一定 run agent）
- 当前始终绑定：spawn 即创建并启动
- Agent 通过 Bash 调用 `leslie spawn` 时，子 Agent 阻塞式运行，完成后父 Agent 继续

### 执行模型

深度优先、串行执行：
```
Agent A spawn → 子 Agent B 阻塞运行 → B 完成 → A 继续
                  ↓ B 也可 spawn
                  子 Agent C 阻塞运行 → C 完成 → B 继续
```

### Decision Rationale
1. 最简模型，不需要调度器
2. 代码拆分保留未来扩展空间（并发执行、非 Agent 任务等）

---

## 🔗 Related Links
- [D30 SDK Usage Conventions](../../../2026-02-24/sdk-replaces-acp/decisions/D30-sdk-usage-conventions.md)
