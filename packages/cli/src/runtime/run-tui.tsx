import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, render } from 'ink';

interface ThreadView {
  id: string;
  status: string;
  parentId: string | null;
  children: string[];
  referencesTo: string[];
  referencedBy: string[];
  lastLine: string;
  lines: string[];
}

interface ApprovalRequest {
  id: string;
  threadId: string;
  toolName: string;
  inputPreview: string;
  resolve: (allow: boolean) => void;
}

interface UiState {
  title: string;
  objectiveId: string;
  selectedThreadId: string | null;
  threads: Record<string, ThreadView>;
  order: string[];
  pendingApprovals: ApprovalRequest[];
  filterMode: 'all' | 'active';
  logScrollOffset: number;
  showHelp: boolean;
}

class TuiStore {
  private listeners = new Set<() => void>();

  private state: UiState;

  public constructor(title: string, objectiveId: string) {
    this.state = {
      title,
      objectiveId,
      selectedThreadId: null,
      threads: {},
      order: [],
      pendingApprovals: [],
      filterMode: 'all',
      logScrollOffset: 0,
      showHelp: false,
    };
  }

  public getState(): UiState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public updateThread(input: {
    id: string;
    status?: string;
    parentId?: string | null;
    appendLine?: string;
  }): void {
    const current = this.state.threads[input.id] ?? {
      id: input.id,
      status: 'active',
      parentId: null,
      children: [],
      referencesTo: [],
      referencedBy: [],
      lastLine: '',
      lines: [],
    };
    const nextLines = input.appendLine
      ? [...current.lines.slice(-79), input.appendLine]
      : current.lines;
    const next: ThreadView = {
      ...current,
      status: input.status ?? current.status,
      parentId: input.parentId === undefined ? current.parentId : input.parentId,
      lastLine: input.appendLine ?? current.lastLine,
      lines: nextLines,
    };
    this.state = {
      ...this.state,
      threads: {
        ...this.state.threads,
        [input.id]: next,
      },
      order: this.state.order.includes(input.id) ? this.state.order : [...this.state.order, input.id],
      selectedThreadId: this.state.selectedThreadId ?? input.id,
    };
    this.emit();
  }

  public setThreadsSnapshot(
    threads: Array<{
      id: string;
      status: string;
      parentId: string | null;
      children?: string[];
      referencesTo?: string[];
      referencedBy?: string[];
    }>,
  ): void {
    let changed = false;
    const nextThreads = { ...this.state.threads };
    for (const thread of threads) {
      const existing = nextThreads[thread.id];
      if (!existing) {
        nextThreads[thread.id] = {
          id: thread.id,
          status: thread.status,
          parentId: thread.parentId,
          children: thread.children ?? [],
          referencesTo: thread.referencesTo ?? [],
          referencedBy: thread.referencedBy ?? [],
          lastLine: '',
          lines: [],
        };
        changed = true;
        continue;
      }
      const nextChildren = thread.children ?? existing.children;
      const nextReferencesTo = thread.referencesTo ?? existing.referencesTo;
      const nextReferencedBy = thread.referencedBy ?? existing.referencedBy;
      if (
        existing.status !== thread.status ||
        existing.parentId !== thread.parentId ||
        existing.children.join(',') !== nextChildren.join(',') ||
        existing.referencesTo.join(',') !== nextReferencesTo.join(',') ||
        existing.referencedBy.join(',') !== nextReferencedBy.join(',')
      ) {
        nextThreads[thread.id] = {
          ...existing,
          status: thread.status,
          parentId: thread.parentId,
          children: nextChildren,
          referencesTo: nextReferencesTo,
          referencedBy: nextReferencedBy,
        };
        changed = true;
      }
    }
    if (!changed) {
      return;
    }
    this.state = {
      ...this.state,
      threads: nextThreads,
      order: Object.keys(nextThreads).sort((a, b) => a.localeCompare(b)),
      selectedThreadId:
        this.state.selectedThreadId && nextThreads[this.state.selectedThreadId]
          ? this.state.selectedThreadId
          : (Object.keys(nextThreads).sort((a, b) => a.localeCompare(b))[0] ?? null),
    };
    this.emit();
  }

  public moveSelection(delta: -1 | 1): void {
    const visibleOrder = this.visibleOrder();
    if (visibleOrder.length === 0) {
      return;
    }
    const selected = this.state.selectedThreadId;
    const index = selected ? visibleOrder.indexOf(selected) : 0;
    const base = index >= 0 ? index : 0;
    const nextIndex = Math.min(visibleOrder.length - 1, Math.max(0, base + delta));
    const nextSelected = visibleOrder[nextIndex] ?? null;
    this.state = { ...this.state, selectedThreadId: nextSelected };
    this.emit();
  }

  public toggleFilterMode(): void {
    const nextMode = this.state.filterMode === 'all' ? 'active' : 'all';
    const visibleOrder = this.visibleOrder(nextMode);
    this.state = {
      ...this.state,
      filterMode: nextMode,
      selectedThreadId:
        this.state.selectedThreadId && visibleOrder.includes(this.state.selectedThreadId)
          ? this.state.selectedThreadId
          : (visibleOrder[0] ?? null),
      logScrollOffset: 0,
    };
    this.emit();
  }

  public scrollLogs(delta: number): void {
    const nextOffset = Math.max(0, this.state.logScrollOffset + delta);
    if (nextOffset === this.state.logScrollOffset) {
      return;
    }
    this.state = { ...this.state, logScrollOffset: nextOffset };
    this.emit();
  }

  public toggleHelp(): void {
    this.state = { ...this.state, showHelp: !this.state.showHelp };
    this.emit();
  }

  private visibleOrder(mode: 'all' | 'active' = this.state.filterMode): string[] {
    if (mode === 'all') {
      return this.state.order;
    }
    return this.state.order.filter((id) => this.state.threads[id]?.status === 'active');
  }

  public requestApproval(input: {
    id: string;
    threadId: string;
    toolName: string;
    inputPreview: string;
    resolve: (allow: boolean) => void;
  }): void {
    this.state = {
      ...this.state,
      pendingApprovals: [...this.state.pendingApprovals, input],
    };
    this.emit();
  }

  public resolveTopApproval(allow: boolean): void {
    const [head, ...rest] = this.state.pendingApprovals;
    if (!head) {
      return;
    }
    head.resolve(allow);
    this.state = { ...this.state, pendingApprovals: rest };
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

function useStore(store: TuiStore): UiState {
  const [state, setState] = useState(store.getState());
  useEffect(() => store.subscribe(() => setState(store.getState())), [store]);
  return state;
}

function formatThreadStatus(status: string): string {
  if (status === 'active') {
    return 'running';
  }
  if (status === 'suspended') {
    return 'suspended';
  }
  if (status === 'completed') {
    return 'done';
  }
  if (status === 'cancelled') {
    return 'cancelled';
  }
  if (status === 'archived') {
    return 'archived';
  }
  return status;
}

function threadStatusColor(status: string): 'green' | 'yellow' | 'blue' | 'red' | 'gray' {
  if (status === 'active') {
    return 'green';
  }
  if (status === 'suspended') {
    return 'yellow';
  }
  if (status === 'completed') {
    return 'blue';
  }
  if (status === 'cancelled') {
    return 'red';
  }
  return 'gray';
}

function truncateLine(text: string, max = 120): string {
  const line = text.trimEnd().replace(/\t/g, '  ');
  if (line.length <= max) {
    return line;
  }
  return `${line.slice(0, max - 3)}...`;
}

function TuiApp({ store }: { store: TuiStore }) {
  const state = useStore(store);
  const selected = state.selectedThreadId ? state.threads[state.selectedThreadId] : null;
  const pendingApproval = state.pendingApprovals[0];

  useInput((_input, key) => {
    if (pendingApproval) {
      if (_input.toLowerCase() === 'y') {
        store.resolveTopApproval(true);
      } else if (_input.toLowerCase() === 'n') {
        store.resolveTopApproval(false);
      }
      return;
    }
    if (key.upArrow) {
      store.moveSelection(-1);
    } else if (key.downArrow) {
      store.moveSelection(1);
    } else if (_input === '?') {
      store.toggleHelp();
    } else if (_input.toLowerCase() === 'f') {
      store.toggleFilterMode();
    } else if (_input.toLowerCase() === 'j') {
      store.scrollLogs(1);
    } else if (_input.toLowerCase() === 'k') {
      store.scrollLogs(-1);
    }
  });

  const visibleOrder =
    state.filterMode === 'all'
      ? state.order
      : state.order.filter((id) => state.threads[id]?.status === 'active');
  const threadRows = visibleOrder.map((id) => state.threads[id]).filter(Boolean) as ThreadView[];
  const selectedLines = selected?.lines ?? [];
  const logWindowSize = 18;
  const maxStart = Math.max(0, selectedLines.length - logWindowSize);
  const start = Math.max(0, maxStart - state.logScrollOffset);
  const end = Math.min(selectedLines.length, start + logWindowSize);
  const pageLines = selectedLines.slice(start, end);
  const statusCount = state.order.reduce(
    (acc, id) => {
      const status = state.threads[id]?.status ?? 'unknown';
      acc.total += 1;
      if (status === 'active') {
        acc.active += 1;
      } else if (status === 'suspended') {
        acc.suspended += 1;
      } else if (status === 'completed') {
        acc.completed += 1;
      } else {
        acc.other += 1;
      }
      return acc;
    },
    { total: 0, active: 0, suspended: 0, completed: 0, other: 0 },
  );

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={1}
        marginBottom={1}
      >
        <Text color="cyanBright">Leslie Run Dashboard</Text>
        <Text>
          objective: <Text color="cyan">{state.objectiveId}</Text>
        </Text>
        <Text>
          title: <Text color="white">{truncateLine(state.title, 120)}</Text>
        </Text>
        <Text>
          filter: <Text color={state.filterMode === 'all' ? 'blue' : 'green'}>{state.filterMode}</Text> | threads:
          total=<Text color="cyan">{String(statusCount.total)}</Text> running=
          <Text color="green">{String(statusCount.active)}</Text> suspended=
          <Text color="yellow">{String(statusCount.suspended)}</Text> done=
          <Text color="blue">{String(statusCount.completed)}</Text>
          {statusCount.other > 0 ? (
            <Text>
              {' '}
              other=<Text color="gray">{String(statusCount.other)}</Text>
            </Text>
          ) : null}
        </Text>
        <Text color="gray">
          keys: ↑/↓ select thread | f filter | j/k scroll logs | ? help
        </Text>
      </Box>
      {state.showHelp ? (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="yellow"
          paddingX={1}
          marginBottom={1}
        >
          <Text color="yellowBright">Help</Text>
          <Text>↑/↓: move selected thread</Text>
          <Text>f: toggle thread filter (all/running only)</Text>
          <Text>j/k: scroll selected thread logs (newest at bottom)</Text>
          <Text>?: toggle this help panel</Text>
          <Text>Approval mode: y allow, n deny</Text>
        </Box>
      ) : null}
      <Box>
        <Box
          width={64}
          flexDirection="column"
          marginRight={1}
          borderStyle="round"
          borderColor="magenta"
          paddingX={1}
        >
          <Text color="magentaBright">Threads</Text>
          <Text color="gray">filter={state.filterMode}</Text>
          {threadRows.map((thread) => {
            const selectedMark = thread.id === state.selectedThreadId ? '>' : ' ';
            return (
              <Box key={thread.id} flexDirection="column" marginTop={1}>
                <Text>
                  <Text color={thread.id === state.selectedThreadId ? 'cyanBright' : 'gray'}>{selectedMark}</Text>{' '}
                  <Text color={threadStatusColor(thread.status)}>[{formatThreadStatus(thread.status)}]</Text> {thread.id}
                </Text>
                <Text color="gray">
                  {'  '}
                  parent={thread.parentId ?? '-'} | children={thread.children.length} | refs_to={thread.referencesTo.length} |
                  referenced_by={thread.referencedBy.length}
                </Text>
              </Box>
            );
          })}
          {threadRows.length === 0 ? <Text color="gray">(no threads in current filter)</Text> : null}
        </Box>
        <Box
          flexDirection="column"
          flexGrow={1}
          borderStyle="round"
          borderColor="blue"
          paddingX={1}
        >
          <Text color="blueBright">Logs ({selected?.id ?? 'none'})</Text>
          {selected ? (
            <Box flexDirection="column" marginBottom={1}>
              <Text color="gray">parent: {selected.parentId ?? '-'}</Text>
              <Text color="gray">children: {selected.children.join(', ') || '-'}</Text>
              <Text color="gray">refs_to: {selected.referencesTo.join(', ') || '-'}</Text>
              <Text color="gray">referenced_by: {selected.referencedBy.join(', ') || '-'}</Text>
              <Text color="gray">----------------------------------------</Text>
            </Box>
          ) : null}
          {pageLines.map((line, index) => (
            <Text key={`${selected?.id ?? 'none'}-${index}`}>{truncateLine(line, 140)}</Text>
          ))}
          {selected ? (
            <Text color="gray">
              log window: {selectedLines.length === 0 ? 0 : start + 1}-{end} / {selectedLines.length}
            </Text>
          ) : null}
          {!selected ? <Text color="gray">Select a thread to view logs.</Text> : null}
        </Box>
      </Box>
      {pendingApproval ? (
        <Box
          marginTop={1}
          flexDirection="column"
          borderStyle="round"
          borderColor="yellow"
          paddingX={1}
        >
          <Text>
            <Text color="yellowBright">Approval needed:</Text> [{pendingApproval.threadId}] {pendingApproval.toolName}
          </Text>
          <Text>{pendingApproval.inputPreview}</Text>
          <Text color="yellow">Press y to allow, n to deny</Text>
        </Box>
      ) : (
        <Box marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
          <Text color="gray">Waiting for events...</Text>
        </Box>
      )}
    </Box>
  );
}

export interface RunTui {
  updateThread: (input: { id: string; status?: string; parentId?: string | null; appendLine?: string }) => void;
  setThreadsSnapshot: (
    threads: Array<{
      id: string;
      status: string;
      parentId: string | null;
      children?: string[];
      referencesTo?: string[];
      referencedBy?: string[];
    }>,
  ) => void;
  requestApproval: (input: {
    id: string;
    threadId: string;
    toolName: string;
    inputPreview: string;
  }) => Promise<boolean>;
  close: () => void;
}

export function createRunTui(title: string, objectiveId: string): RunTui {
  const store = new TuiStore(title, objectiveId);
  const app = render(<TuiApp store={store} />);

  return {
    updateThread: (input) => store.updateThread(input),
    setThreadsSnapshot: (threads) => store.setThreadsSnapshot(threads),
    requestApproval: (input) =>
      new Promise<boolean>((resolve) => {
        store.requestApproval({
          ...input,
          resolve,
        });
      }),
    close: () => {
      app.unmount();
    },
  };
}
