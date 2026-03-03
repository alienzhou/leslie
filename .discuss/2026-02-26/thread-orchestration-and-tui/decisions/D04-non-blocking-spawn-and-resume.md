# D04: 非阻塞 spawn + 事件驱动唤醒机制

**Status**: ✅ Confirmed
**Related Outline**: [Back to Outline](../outline.md)

---

## 📋 Background

### Problem
Agent 调用 `leslie spawn` 时，如果阻塞等待子 Agent 完成，父 Agent 无法并发 spawn 多个子 Thread。需要非阻塞 spawn 以支持真并发。

### Constraints
- Claude Agent SDK 的 Bash 工具调用是同步的
- spawn = create + start 绑定（C4/D03）
- `leslie run` 是监控器+渲染器，不是调度器（C8）

---

## 🎯 Objective

支持父 Agent 并发 spawn 多个子 Thread，并在需要时挂起等待子 Thread 完成后被唤醒。

---

## ✅ Final Decision

### 1. 非阻塞 spawn
- `leslie spawn` 启动子 Agent 在后台进程运行，立即返回 thread ID
- 父 Agent 可连续 spawn 多个，实现真并发
- 父 Agent 完成后可选择：继续做事 / 结束 / 挂起等待

### 2. 父 Agent 三种行为模式

| 模式 | 描述 | 操作 |
|------|------|------|
| Fire-and-forget | spawn 后继续做自己的事，不管子 Thread | 无需额外操作 |
| 做完自己的事后结束 | spawn 后继续工作，完成后 done | `leslie lifecycle --action done` |
| 挂起等待 | spawn 后挂起，等子 Thread 完成再恢复 | `leslie lifecycle --action suspend` |

### 3. 事件驱动唤醒机制

`leslie run` 监控器检测到条件满足时自动唤醒：

```
子 Thread 完成
  → 查找父 Thread
  → 父 Thread 状态 == suspended?
  → 父的所有子 Thread 都 done?
  → 是 → core.runAgent(parentThreadId) 恢复父 Agent（via session resume）
```

### Decision Rationale
1. 非阻塞是实现并发的前提
2. 唤醒逻辑自然放在 `leslie run` 监控器中——它已经在 watch 所有 Thread 状态
3. 现有零件支持：`session_id` 存储、SDK resume、`lifecycle suspend/resume`、`relations.children`

### 需要新增的实现
1. `leslie spawn` 后台进程模式（fork 子进程运行 Agent）
2. `leslie run` 监控循环中加入"子完成 → 检查父 → resume"逻辑

### MVP 限制
- 仅支持"等待所有子 Thread 完成"再唤醒
- 不支持选择性等待（部分子 Thread 完成即唤醒），后续扩展

---

## 🔗 Related Links
- [D03 spawn 语义](./D03-spawn-semantics.md)
- [D02 扁平 Agent 架构](./D02-flat-agent-architecture.md)
- [D30 SDK Usage Conventions](../../../2026-02-24/sdk-replaces-acp/decisions/D30-sdk-usage-conventions.md)
