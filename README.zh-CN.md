# Leslie

> 多线程 Agent 编排框架，基于人机对等协作理念

[![npm version](https://img.shields.io/npm/v/@vibe-x-ai/leslie.svg)](https://www.npmjs.com/package/@vibe-x-ai/leslie)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](./README.md) | 中文

## 概述

Leslie 是一个多线程 Agent 编排框架，基于 **人机对等协作（Human-Agent Parity）** 的核心理念构建。

传统的 Agent 系统：
> 人类分配任务 → Agent 自动分解执行 → 产出结果

Leslie 的设计理念：
> 人类 ↔ Agent 是**对等的**，双方都可以发起、干预、求助

## 核心概念

### Objective（目标）
顶层任务单元，所有 Thread 都归属于某个 Objective。

### Thread（线程）
执行单元，对应一个 Agent Session。支持：
- 生命周期管理（spawn, pause, resume, terminate）
- 状态共享（artifacts, reference）
- 中断恢复（context snapshot + replay）

### 三种交互模式

| 模式 | 描述 |
|-----|------|
| Human → Agent | 人类派发任务，Agent 分解执行 |
| Agent → Human | Agent 遇到困难，主动求助人类 |
| Human Intervention | 人类随时介入、暂停、纠正 Agent |

## 安装

```bash
npm install -g @vibe-x-ai/leslie
# 或
pnpm add -g @vibe-x-ai/leslie
```

## 快速开始

```bash
# 创建一个 Objective
leslie objective create "Build a REST API for user management"

# 启动一个 Thread
leslie spawn --intent "Design database schema"

# 查看运行中的 Thread
leslie list

# 连接到一个 Thread 查看状态
leslie connect thread-abc123
```

## CLI 命令

### 基础命令

| 命令 | 描述 |
|-----|------|
| `leslie spawn` | 创建新 Thread |
| `leslie list` | 列出所有 Thread |
| `leslie status <id>` | 查看 Thread 状态 |
| `leslie connect <id>` | 连接到运行中的 Thread |

### Objective 管理

| 命令 | 描述 |
|-----|------|
| `leslie objective create` | 创建 Objective |
| `leslie objective list` | 列出所有 Objective |
| `leslie objective status <id>` | 查看 Objective 状态 |

### 生命周期控制

| 命令 | 描述 |
|-----|------|
| `leslie lifecycle --action suspend` | 暂停 Thread |
| `leslie lifecycle --action resume` | 恢复 Thread |
| `leslie lifecycle --action cancel` | 取消 Thread |

### 协作命令

| 命令 | 描述 |
|-----|------|
| `leslie reference` | 建立 Thread 间引用 |
| `leslie merge` | 合并多个 Thread 产出 |
| `leslie transfer` | 控制权转移 |
| `leslie inject` | 向 Thread 注入信息 |

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI 接口                                │
│         leslie spawn / list / connect / objective            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Objective Manager                          │
│   - Objective 生命周期                                       │
│   - Objective 下的 Thread 编排                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Thread Manager                            │
│   - Thread 生命周期 (spawn, pause, resume, terminate)        │
│   - 状态机 & 事件分发                                        │
│   - 共享机制 (artifacts, reference)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Storage  │   │   ACP    │   │  IPC /   │
    │ (SQLite) │   │  Client  │   │ Headless │
    └──────────┘   └────┬─────┘   └──────────┘
                        │
                        ▼
               ┌────────────────┐
               │  Claude Code   │
               │  (via ACP)     │
               └────────────────┘
```

## 技术栈

| 技术 | 版本 | 用途 |
|-----|------|-----|
| TypeScript | 5.x | 类型安全 |
| Node.js | 22.x | 运行时 |
| oclif | 4.x | CLI 框架 |
| better-sqlite3 | 11.x | 本地存储 |
| ACP | - | Agent 通信协议 |

## 项目结构

```
leslie/
├── packages/
│   ├── core/                # @vibe-x-ai/leslie-core
│   │   ├── src/
│   │   │   ├── objective/   # Objective 管理
│   │   │   ├── thread/      # Thread 生命周期
│   │   │   ├── storage/     # SQLite + FS
│   │   │   └── acp/         # ACP Client
│   │   └── package.json
│   │
│   ├── cli/                 # @vibe-x-ai/leslie-cli
│   │   ├── src/commands/
│   │   └── package.json
│   │
│   └── web/                 # @vibe-x-ai/leslie-web (未来)
│
├── pnpm-workspace.yaml
└── package.json
```

## 开发

```bash
# 克隆仓库
git clone git@github.com:vibe-x-ai/leslie.git
cd leslie

# 安装依赖
pnpm install

# 构建
pnpm build

# 本地测试
pnpm dev
```

## 设计文档

详细的设计决策记录在 `.discuss/` 目录：

- [架构设计讨论](.discuss/2026-02-04/multi-thread-agent-orchestration/outline.md)
- [技术栈选型](.discuss/2026-02-04/tech-stack-implementation/outline.md)
- [人机对等协作设计](.discuss/2026-02-04/multi-thread-agent-orchestration/decisions/D22-human-agent-parity.md)

## 协议

- **Agent 通信**: [ACP (Agent Client Protocol)](https://agentclientprotocol.com/)
- **Thread 原语**: 基于 Tier 1-3 Thread Primitives 设计

## License

MIT © [vibe-x-ai](https://github.com/vibe-x-ai)
