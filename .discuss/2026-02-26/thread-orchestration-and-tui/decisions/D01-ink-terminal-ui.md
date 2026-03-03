# D01: 终端 UI 选用 ink

**Status**: ✅ Confirmed
**Related Outline**: [Back to Outline](../outline.md)

---

## 📋 Background

### Problem
Leslie 多 Thread 并发运行时，用户无法看到各 Thread 状态、输出和关系。需要一个终端 UI 方案来展示。

### Constraints
- 需展示实时流式输出（不只是进度条）
- Thread 关系是网状结构（spawn 构成树 + reference 构成图）
- 需与 oclif CLI 框架共存

---

## 📊 Solution Comparison

| Solution | Description | Advantages | Disadvantages | Decision |
|----------|-------------|------------|---------------|----------|
| ink | React for CLI，Flexbox 布局 | 多 panel dashboard、实时流式输出、组件化、生态成熟 | 引入 React 依赖 | ✅ |
| listr2 | 任务树 + 并发进度展示 | Thread 树状结构匹配、简单 | 不擅长展示完整 log 输出 | ❌ |
| blessed | 全功能终端 UI（ncurses） | 强大、分屏 | API 陈旧、过重 | ❌ |

---

## ✅ Final Decision

选用 **ink** 作为终端 UI 框架。在基础运行流程跑通后再集成。

### Decision Rationale
1. 用户需要看到每个 Thread 的实时文本输出，不只是状态
2. Flexbox 布局支持多 panel 设计（树视图 + 输出面板）
3. React 组件化便于迭代 UI
4. 生产验证：Gatsby CLI、Prisma、GitHub Copilot CLI 都在用

---

## 🔗 Related Links
- [ink GitHub](https://github.com/vadimdemedes/ink)
- [@inkjs/ui](https://www.npmjs.com/package/@inkjs/ui)
