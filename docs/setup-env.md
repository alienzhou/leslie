# Leslie 运行环境配置

运行 `leslie spawn` 时，SDK 启动的 Claude Code 子进程需要认证。有两种方式：

1. **登录 ClaudeCode**：在 IDE（如 Cursor）中执行 `/login` 完成认证
2. **配置环境变量**：使用自定义 API 端点（如 kwaipilot）时，通过环境变量配置

## 环境变量方式

当使用自定义后端（如 kwaipilot）时，在运行 `leslie` 前设置以下环境变量：

### Bash / Zsh（单次会话）

```bash
export ANTHROPIC_AUTH_TOKEN="Test"
export ANTHROPIC_BASE_URL="http://localhost:3000"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="kwaipilot-default"
export ANTHROPIC_DEFAULT_OPUS_MODEL="kwaipilot-default"
export ANTHROPIC_DEFAULT_SONNET_MODEL="kwaipilot-default"
export ANTHROPIC_MODEL="kwaipilot-default"
```

### 一行命令（便于复制）

```bash
export ANTHROPIC_AUTH_TOKEN="Test" ANTHROPIC_BASE_URL="http://localhost:3000" ANTHROPIC_DEFAULT_HAIKU_MODEL="kwaipilot-default" ANTHROPIC_DEFAULT_OPUS_MODEL="kwaipilot-default" ANTHROPIC_DEFAULT_SONNET_MODEL="kwaipilot-default" ANTHROPIC_MODEL="kwaipilot-default"
```

### 全局配置（推荐，无需每次加 --config）

```bash
# 1. 先 export 环境变量
export ANTHROPIC_AUTH_TOKEN="Test" ANTHROPIC_BASE_URL="http://localhost:3000" \
  ANTHROPIC_DEFAULT_HAIKU_MODEL="kwaipilot-default" ANTHROPIC_DEFAULT_OPUS_MODEL="kwaipilot-default" \
  ANTHROPIC_DEFAULT_SONNET_MODEL="kwaipilot-default" ANTHROPIC_MODEL="kwaipilot-default"

# 2. 生成 ~/.leslie/env（从当前 env 拷贝）
leslie config init --from-env

# 3. 之后直接运行，无需 --config
leslie run --title "Your task"
leslie spawn --intent "Your task" --objective <objective-id>
```

或使用默认模板（不依赖当前 env）：

```bash
leslie config init   # 创建 ~/.leslie/env 默认模板，可手动编辑
```

**加载顺序**：每次运行自动加载 `~/.leslie/env`（存在则加载），`--config` 可覆盖。

### 项目级配置（--config 指定）

```bash
leslie run --config leslie.kwaipilot.env --title "Your task"
leslie spawn --config leslie.kwaipilot.env --intent "..." --objective <id>
```

**实现说明**：CLI 加载配置后，`runAgent` 会将 `process.env` 显式传给 SDK 的 `query(options.env)`，确保 ANTHROPIC_* 等变量到达 Claude Code 子进程。

### 前置执行（单次会话）

在运行 `leslie` 前先执行上述 `export`，再执行目标命令：

```bash
export ANTHROPIC_AUTH_TOKEN="Test" ANTHROPIC_BASE_URL="http://localhost:3000" ANTHROPIC_DEFAULT_HAIKU_MODEL="kwaipilot-default" ANTHROPIC_DEFAULT_OPUS_MODEL="kwaipilot-default" ANTHROPIC_DEFAULT_SONNET_MODEL="kwaipilot-default" ANTHROPIC_MODEL="kwaipilot-default"
leslie spawn --intent "Your task" --objective <objective-id>
```

### 持久化到 Shell 配置

将 `export` 写入 `~/.zshrc` 或 `~/.bashrc`，每次打开终端自动生效：

```bash
# Append to ~/.zshrc
cat >> ~/.zshrc << 'EOF'

# Leslie / kwaipilot env
export ANTHROPIC_AUTH_TOKEN="Test"
export ANTHROPIC_BASE_URL="http://localhost:3000"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="kwaipilot-default"
export ANTHROPIC_DEFAULT_OPUS_MODEL="kwaipilot-default"
export ANTHROPIC_DEFAULT_SONNET_MODEL="kwaipilot-default"
export ANTHROPIC_MODEL="kwaipilot-default"
EOF
```

### 调试相关

| 变量 | 说明 |
|------|------|
| `LESLIE_LOG_SDK=1` | 将 Claude Code 运行时的原始 SDKMessage 流写入 `.leslie/logs/sdk/{threadId}.ndjson`，用于调试 |
| `LESLIE_DEBUG=1` | 启用 debug 日志级别（若已接入 logger） |

### 变量说明

| 变量 | 说明 |
|------|------|
| `ANTHROPIC_AUTH_TOKEN` | API 认证 token |
| `ANTHROPIC_BASE_URL` | API 基础 URL（如 kwaipilot 本地服务） |
| `ANTHROPIC_MODEL` | 默认模型 |
| `ANTHROPIC_DEFAULT_*_MODEL` | 各系列默认模型（Haiku/Opus/Sonnet） |

## Tool 权限策略配置

Leslie 默认会读取项目根目录的 `leslie.permissions.json`，用于控制 Claude Code 的工具授权策略。

- **非 Bash 工具**（Read、Write、Edit 等）：一律放行，不进入确认流
- **Bash 命令**：仅 Bash 走 deny/confirm 规则
  - `bash.deny`：命中即拒绝
  - `bash.confirm`：命中才弹出确认
  - `default`：未命中上述规则时的行为（allow | confirm | deny）
- **配置解析失败**：会在运行时输出 `[leslie] Warning: ...` 到 stderr
- **本地覆盖**：可在 `.leslie/permissions.json` 追加项目私有规则（不会进入 Git）

示例（默认已内置在仓库）：

```json
{
  "default": "allow",
  "bash": {
    "deny": ["\\brm\\s+-rf\\b"],
    "confirm": ["\\bcurl\\b.+\\|\\s*(sh|bash)\\b"]
  }
}
```
