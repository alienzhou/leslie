# D05: `leslie run` 一体化命令 — 监控器 + 渲染器

**Status**: ✅ Confirmed
**Related Outline**: [Back to Outline](../outline.md)

---

## 📋 Background

### Problem
用户需要一条命令完成：创建 Objective → spawn 首个 Thread → 运行 Agent → 监控全部 Thread 直到完成。

---

## 📊 Solution Comparison

| Solution | Description | Decision |
|----------|-------------|----------|
| A: 增强 `objective create` | 加 `--run` flag | ❌ |
| B: 新增 `leslie run` | 独立命令，语义清晰 | ✅ |

---

## ✅ Final Decision

新增 `leslie run --title "..."` 命令。

### 职责
1. 创建 Objective
2. spawn 首个 Thread（intent = title）
3. 监控 Objective 下所有 Thread 状态
4. 事件驱动唤醒挂起的父 Thread（D04）
5. 持续运行直到所有 Thread 完成
6. 渲染输出（未来用 ink）

### 不是调度器
- 不负责决定启动哪些 Thread（spawn 自己启动）
- 不负责任务分配
- 只监控 + 渲染 + 在条件满足时唤醒

### Decision Rationale
- `run` 语义直觉（"运行这个目标"）
- `objective create` 保持纯粹（只创建记录）

---

## 🔗 Related Links
- [D04 非阻塞 spawn + 唤醒](./D04-non-blocking-spawn-and-resume.md)
- [D01 ink 终端 UI](./D01-ink-terminal-ui.md)
