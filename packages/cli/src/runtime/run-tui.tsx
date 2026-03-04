import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, render } from 'ink';

interface ThreadView {
  id: string;
  status: string;
  parentId: string | null;
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
    threads: Array<{ id: string; status: string; parentId: string | null }>,
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
          lastLine: '',
          lines: [],
        };
        changed = true;
        continue;
      }
      if (existing.status !== thread.status || existing.parentId !== thread.parentId) {
        nextThreads[thread.id] = { ...existing, status: thread.status, parentId: thread.parentId };
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
    if (this.state.order.length === 0) {
      return;
    }
    const selected = this.state.selectedThreadId;
    const index = selected ? this.state.order.indexOf(selected) : 0;
    const base = index >= 0 ? index : 0;
    const nextIndex = Math.min(this.state.order.length - 1, Math.max(0, base + delta));
    const nextSelected = this.state.order[nextIndex] ?? null;
    this.state = { ...this.state, selectedThreadId: nextSelected };
    this.emit();
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
    }
  });

  const threadRows = state.order.map((id) => state.threads[id]).filter(Boolean) as ThreadView[];

  return (
    <Box flexDirection="column">
      <Text>
        leslie run | objective={state.objectiveId} | {state.title}
      </Text>
      <Box>
        <Box width={48} flexDirection="column" marginRight={2}>
          <Text>Threads</Text>
          {threadRows.map((thread) => {
            const selectedMark = thread.id === state.selectedThreadId ? '>' : ' ';
            const relation = thread.parentId ? ` <- ${thread.parentId}` : '';
            return (
              <Text key={thread.id}>
                {selectedMark} [{thread.status}] {thread.id}
                {relation}
              </Text>
            );
          })}
        </Box>
        <Box flexDirection="column" flexGrow={1}>
          <Text>Logs ({selected?.id ?? 'none'})</Text>
          {(selected?.lines ?? []).slice(-18).map((line, index) => (
            <Text key={`${selected?.id ?? 'none'}-${index}`}>{line}</Text>
          ))}
        </Box>
      </Box>
      {pendingApproval ? (
        <Box marginTop={1} flexDirection="column">
          <Text>
            Approval needed: [{pendingApproval.threadId}] {pendingApproval.toolName}
          </Text>
          <Text>{pendingApproval.inputPreview}</Text>
          <Text>Press y to allow, n to deny</Text>
        </Box>
      ) : (
        <Text>Up/Down: select thread | Waiting for events...</Text>
      )}
    </Box>
  );
}

export interface RunTui {
  updateThread: (input: { id: string; status?: string; parentId?: string | null; appendLine?: string }) => void;
  setThreadsSnapshot: (threads: Array<{ id: string; status: string; parentId: string | null }>) => void;
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
