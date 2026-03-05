#!/usr/bin/env bash
set -euo pipefail

# 打印边界线，方便阅读
line() {
  printf '%s\n' "------------------------------------------------------------"
}

# 统一输出 KV
kv() {
  local key="$1"
  local value="${2:-}"
  printf '%-28s %s\n' "${key}:" "${value}"
}

# 过滤与宿主相关的环境变量
print_filtered_env() {
  local source_label="$1"
  local raw="$2"
  local pattern='^(CURSOR_|VSCODE_|CLAUDE_|CODEX_|TERM_PROGRAM=|TERMINAL_EMULATOR=|ELECTRON_|IDE_|SSH_|TMUX=|CI=|LANG=|SHELL=|PWD=|HOME=)'

  echo "[$source_label]"
  if [[ -z "$raw" ]]; then
    echo "(empty)"
    return
  fi

  # 按空白切分，抽取 KEY=VALUE 风格字段
  # 注意：带空格的 VALUE 可能被截断，这里用于线索采集而非精确还原
  local out
  if command -v rg >/dev/null 2>&1; then
    out="$(printf '%s' "$raw" | tr ' ' '\n' | rg "$pattern" || true)"
  else
    out="$(printf '%s' "$raw" | tr ' ' '\n' | grep -E "$pattern" || true)"
  fi
  if [[ -z "$out" ]]; then
    echo "(no matching env vars)"
  else
    printf '%s\n' "$out" | sort -u
  fi
}

main() {
  echo "Agent Environment Inspection"
  line
  kv "timestamp" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  kv "hostname" "$(hostname)"
  kv "user" "${USER:-unknown}"
  kv "cwd" "$(pwd)"
  kv "shell" "${SHELL:-unknown}"
  kv "pid" "$$"
  kv "ppid" "$PPID"
  line

  echo "Current process filtered env:"
  print_filtered_env "env" "$(env)"
  line

  echo "Process chain (current -> ancestors):"
  local pid
  pid="$$"
  local depth
  depth=0
  while [[ "$pid" =~ ^[0-9]+$ ]] && [[ "$pid" -gt 1 ]] && [[ $depth -lt 8 ]]; do
    local ppid comm args
    ppid="$(ps -o ppid= -p "$pid" | xargs || true)"
    comm="$(ps -o comm= -p "$pid" | xargs || true)"
    args="$(ps -o args= -p "$pid" | xargs || true)"

    echo
    kv "depth" "$depth"
    kv "pid" "$pid"
    kv "ppid" "${ppid:-unknown}"
    kv "comm" "${comm:-unknown}"
    kv "args" "${args:-unknown}"

    # macOS 上可通过 ps eww 获取该进程导出的环境片段
    local envline
    envline="$(ps eww -p "$pid" -o command= | awk 'NR==1{print; exit}' || true)"
    print_filtered_env "ps eww pid=$pid" "$envline"

    if [[ -z "${ppid:-}" ]] || [[ ! "$ppid" =~ ^[0-9]+$ ]] || [[ "$ppid" -le 1 ]]; then
      break
    fi
    pid="$ppid"
    depth=$((depth + 1))
  done

  line
  echo "Done."
}

main "$@"
