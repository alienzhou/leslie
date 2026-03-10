import React, { useEffect, useMemo, useState } from 'react';
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
  updatedAt: number;
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
  cwd: string;
  selectedThreadId: string | null;
  threads: Record<string, ThreadView>;
  order: string[];
  pendingApprovals: ApprovalRequest[];
  filterMode: 'all' | 'active';
  activeTab: 'detail' | 'runtime' | 'global';
  runtimeScrollOffset: number;
  detailScrollOffset: number;
  globalScrollOffset: number;
  showHelp: boolean;
  globalLogLines: string[];
  showGlobalOverlay: boolean;
  globalOverlayScrollOffset: number;
}

class TuiStore {
  private listeners = new Set<() => void>();

  private state: UiState;

  private static readonly GLOBAL_LOG_MAX_LINES = 500;
  private static readonly THREAD_LOG_MAX_LINES = 500;

  public constructor(title: string, objectiveId: string, cwd: string) {
    this.state = {
      title,
      objectiveId,
      cwd,
      selectedThreadId: null,
      threads: {},
      order: [],
      pendingApprovals: [],
      filterMode: 'all',
      activeTab: 'detail',
      runtimeScrollOffset: 0,
      detailScrollOffset: 0,
      globalScrollOffset: 0,
      showHelp: false,
      globalLogLines: [],
      showGlobalOverlay: false,
      globalOverlayScrollOffset: 0,
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
      updatedAt: Date.now(),
    };
    const nextLines = input.appendLine
      ? [...current.lines.slice(-(TuiStore.THREAD_LOG_MAX_LINES - 1)), input.appendLine]
      : current.lines;
    if (input.appendLine) {
      const globalLine = `[${input.id}] ${input.appendLine}`;
      const nextGlobal = [...this.state.globalLogLines.slice(-(TuiStore.GLOBAL_LOG_MAX_LINES - 1)), globalLine];
      this.state = { ...this.state, globalLogLines: nextGlobal };
    }
    const next: ThreadView = {
      ...current,
      status: input.status ?? current.status,
      parentId: input.parentId === undefined ? current.parentId : input.parentId,
      lastLine: input.appendLine ?? current.lastLine,
      lines: nextLines,
      updatedAt: Date.now(),
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
          updatedAt: Date.now(),
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
          updatedAt: Date.now(),
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
      runtimeScrollOffset: 0,
      detailScrollOffset: 0,
      globalScrollOffset: 0,
    };
    this.emit();
  }

  public toggleTab(): void {
    const nextTab =
      this.state.activeTab === 'detail' ? 'runtime' : this.state.activeTab === 'runtime' ? 'global' : 'detail';
    this.state = { ...this.state, activeTab: nextTab };
    this.emit();
  }

  public setTab(tab: 'detail' | 'runtime' | 'global'): void {
    if (this.state.activeTab === tab) {
      return;
    }
    this.state = { ...this.state, activeTab: tab };
    this.emit();
  }

  public appendGlobalLog(line: string): void {
    const nextGlobal = [...this.state.globalLogLines.slice(-(TuiStore.GLOBAL_LOG_MAX_LINES - 1)), line];
    this.state = { ...this.state, globalLogLines: nextGlobal };
    this.emit();
  }

  public scrollActivePane(delta: number): void {
    if (this.state.activeTab === 'runtime') {
      const nextOffset = Math.max(0, this.state.runtimeScrollOffset + delta);
      if (nextOffset === this.state.runtimeScrollOffset) {
        return;
      }
      this.state = { ...this.state, runtimeScrollOffset: nextOffset };
      this.emit();
      return;
    }
    if (this.state.activeTab === 'global') {
      const nextOffset = Math.max(0, this.state.globalScrollOffset + delta);
      if (nextOffset === this.state.globalScrollOffset) {
        return;
      }
      this.state = { ...this.state, globalScrollOffset: nextOffset };
      this.emit();
      return;
    }
    const nextOffset = Math.max(0, this.state.detailScrollOffset + delta);
    if (nextOffset === this.state.detailScrollOffset) {
      return;
    }
    this.state = { ...this.state, detailScrollOffset: nextOffset };
    this.emit();
  }

  public toggleHelp(): void {
    this.state = { ...this.state, showHelp: !this.state.showHelp };
    this.emit();
  }

  public toggleGlobalOverlay(): void {
    this.state = {
      ...this.state,
      showGlobalOverlay: !this.state.showGlobalOverlay,
      globalOverlayScrollOffset: this.state.showGlobalOverlay ? 0 : this.state.globalOverlayScrollOffset,
    };
    this.emit();
  }

  public scrollGlobalOverlay(delta: number): void {
    const nextOffset = Math.max(0, this.state.globalOverlayScrollOffset + delta);
    if (nextOffset === this.state.globalOverlayScrollOffset) {
      return;
    }
    this.state = { ...this.state, globalOverlayScrollOffset: nextOffset };
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

function ageLabel(updatedAt: number, now: number): string {
  const sec = Math.max(0, Math.floor((now - updatedAt) / 1000));
  if (sec < 2) {
    return 'now';
  }
  if (sec < 60) {
    return `${sec}s`;
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min}m`;
  }
  const hour = Math.floor(min / 60);
  return `${hour}h`;
}

function statusIcon(status: string): string {
  if (status === 'active') return '●';
  if (status === 'completed') return '✓';
  if (status === 'suspended') return '◆';
  if (status === 'cancelled') return '✗';
  return '○';
}

function buildRelationTree(threads: ThreadView[]): Array<{ text: string; color?: string }> {
  const lines: Array<{ text: string; color?: string }> = [];
  const threadMap = new Map(threads.map((t) => [t.id, t]));
  const roots = threads.filter((t) => !t.parentId || !threadMap.has(t.parentId));

  function renderNode(thread: ThreadView, prefix: string, isLast: boolean, isRoot: boolean): void {
    const connector = isRoot ? '' : isLast ? '└── ' : '├── ';
    const icon = statusIcon(thread.status);
    const color = threadStatusColor(thread.status);
    const shortId = thread.id.length > 20 ? thread.id.slice(0, 20) : thread.id;
    lines.push({
      text: `${prefix}${connector}${icon} ${shortId}  [${formatThreadStatus(thread.status)}]`,
      color,
    });
    const childPrefix = prefix + (isRoot ? '' : isLast ? '    ' : '│   ');
    const children = threads.filter((t) => t.parentId === thread.id);
    for (let i = 0; i < children.length; i++) {
      renderNode(children[i]!, childPrefix, i === children.length - 1, false);
    }
  }

  if (roots.length === 0) {
    lines.push({ text: '(no threads)', color: 'gray' });
    return lines;
  }

  lines.push({ text: '╭─ Thread Hierarchy', color: 'cyan' });
  lines.push({ text: '│' });
  for (let i = 0; i < roots.length; i++) {
    renderNode(roots[i]!, '│  ', i === roots.length - 1, true);
    if (i < roots.length - 1) {
      lines.push({ text: '│' });
    }
  }
  lines.push({ text: '│' });
  lines.push({ text: '╰─' });

  const refs = threads.flatMap((t) =>
    t.referencesTo.filter((ref) => threadMap.has(ref)).map((ref) => ({ from: t.id, to: ref })),
  );
  if (refs.length > 0) {
    lines.push({ text: '' });
    lines.push({ text: '╭─ Cross References', color: 'yellow' });
    lines.push({ text: '│' });
    for (const r of refs) {
      const fromShort = r.from.length > 16 ? r.from.slice(0, 16) : r.from;
      const toShort = r.to.length > 16 ? r.to.slice(0, 16) : r.to;
      lines.push({ text: `│  ${fromShort}  ───→  ${toShort}`, color: 'yellow' });
    }
    lines.push({ text: '│' });
    lines.push({ text: '╰─' });
  }

  const orphanRefs = threads.flatMap((t) =>
    t.referencesTo.filter((ref) => !threadMap.has(ref)).map((ref) => ({ from: t.id, to: ref })),
  );
  const externalRefs = threads.flatMap((t) =>
    t.referencedBy.filter((ref) => !threadMap.has(ref)).map((ref) => ({ from: ref, to: t.id })),
  );
  if (orphanRefs.length > 0 || externalRefs.length > 0) {
    lines.push({ text: '' });
    lines.push({ text: '╭─ External References', color: 'gray' });
    lines.push({ text: '│' });
    for (const r of orphanRefs) {
      const fromShort = r.from.length > 16 ? r.from.slice(0, 16) : r.from;
      const toShort = r.to.length > 16 ? r.to.slice(0, 16) : r.to;
      lines.push({ text: `│  ${fromShort}  ···→  ${toShort} (external)`, color: 'gray' });
    }
    for (const r of externalRefs) {
      const fromShort = r.from.length > 16 ? r.from.slice(0, 16) : r.from;
      const toShort = r.to.length > 16 ? r.to.slice(0, 16) : r.to;
      lines.push({ text: `│  ${fromShort}  ···→  ${toShort} (external)`, color: 'gray' });
    }
    lines.push({ text: '│' });
    lines.push({ text: '╰─' });
  }

  return lines;
}

function GlobalRelationOverlay({
  store,
  threads,
  viewport,
}: {
  store: TuiStore;
  threads: ThreadView[];
  viewport: { columns: number; rows: number };
}) {
  const state = useStore(store);
  const treeLines = useMemo(() => buildRelationTree(threads), [threads]);

  useInput((_input, key) => {
    if (_input === 'G' || key.escape) {
      store.toggleGlobalOverlay();
    } else if (_input.toLowerCase() === 'j' || key.downArrow) {
      store.scrollGlobalOverlay(1);
    } else if (_input.toLowerCase() === 'k' || key.upArrow) {
      store.scrollGlobalOverlay(-1);
    }
  });

  const cols = viewport.columns;
  const rows = viewport.rows;
  const contentHeight = Math.max(6, rows - 8);
  const maxStart = Math.max(0, treeLines.length - contentHeight);
  const start = Math.max(0, maxStart - state.globalOverlayScrollOffset);
  const end = Math.min(treeLines.length, start + contentHeight);
  const pageLines = treeLines.slice(start, end);

  const statusCounts = threads.reduce(
    (acc, t) => {
      if (t.status === 'active') acc.running += 1;
      else if (t.status === 'completed') acc.done += 1;
      else if (t.status === 'suspended') acc.suspended += 1;
      else acc.other += 1;
      return acc;
    },
    { running: 0, done: 0, suspended: 0, other: 0 },
  );

  return (
    <Box flexDirection="column" paddingX={2} height={rows}>
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
        height={rows - 2}
      >
        <Box justifyContent="space-between" marginBottom={1}>
          <Text color="cyanBright" bold>
            {'  '}Global Thread Relation Graph
          </Text>
          <Text color="gray">
            {threads.length} threads{'  '}
            <Text color="green">● {statusCounts.running}</Text>{'  '}
            <Text color="blue">✓ {statusCounts.done}</Text>{'  '}
            <Text color="yellow">◆ {statusCounts.suspended}</Text>
          </Text>
        </Box>
        <Text color="gray">{'═'.repeat(Math.max(20, cols - 12))}</Text>
        <Box flexDirection="column" flexGrow={1}>
          {pageLines.map((line, index) => (
            <Text key={`overlay-${index}`} color={line.color as never}>
              {'  '}{truncateLine(line.text, Math.max(30, cols - 16))}
            </Text>
          ))}
        </Box>
        {treeLines.length > contentHeight ? (
          <Box marginTop={1}>
            <Text color="gray">
              {start + 1}-{end} / {treeLines.length}{'  '}[J/K or ↑/↓ to scroll]
            </Text>
          </Box>
        ) : null}
      </Box>
      <Box>
        <Text color="black" backgroundColor="white">
          {' [Shift+G / Esc] Close '}
          {' [J/K] Scroll '}
        </Text>
      </Box>
    </Box>
  );
}

function TuiApp({ store }: { store: TuiStore }) {
  const state = useStore(store);
  const [viewport, setViewport] = useState({
    columns: process.stdout.columns ?? 120,
    rows: process.stdout.rows ?? 40,
  });
  const [frame, setFrame] = useState(0);
  const selected = state.selectedThreadId ? state.threads[state.selectedThreadId] : null;
  const pendingApproval = state.pendingApprovals[0];
  const now = Date.now();
  const spinnerFrames = ['|', '/', '-', '\\'];
  const spinner = spinnerFrames[frame % spinnerFrames.length] ?? '|';

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((value) => value + 1);
    }, 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onResize = () => {
      setViewport({
        columns: process.stdout.columns ?? 120,
        rows: process.stdout.rows ?? 40,
      });
    };
    process.stdout.on('resize', onResize);
    return () => {
      process.stdout.off('resize', onResize);
    };
  }, []);

  useInput((_input, key) => {
    if (state.showGlobalOverlay) {
      return;
    }
    if (pendingApproval) {
      if (_input.toLowerCase() === 'y') {
        store.resolveTopApproval(true);
      } else if (_input.toLowerCase() === 'n') {
        store.resolveTopApproval(false);
      }
      return;
    }
    if (_input === 'G') {
      store.toggleGlobalOverlay();
    } else if (key.upArrow) {
      store.moveSelection(-1);
    } else if (key.downArrow) {
      store.moveSelection(1);
    } else if (_input === '?') {
      store.toggleHelp();
    } else if (_input.toLowerCase() === 'f') {
      store.toggleFilterMode();
    } else if (key.tab || _input.toLowerCase() === 't') {
      store.toggleTab();
    } else if (_input.toLowerCase() === 'd' || _input.toLowerCase() === 'o') {
      store.setTab('detail');
    } else if (_input.toLowerCase() === 'r' || _input.toLowerCase() === 'l') {
      store.setTab('runtime');
    } else if (_input === 'g' || _input.toLowerCase() === 's') {
      store.setTab('global');
    } else if (_input.toLowerCase() === 'j') {
      store.scrollActivePane(1);
    } else if (_input.toLowerCase() === 'k') {
      store.scrollActivePane(-1);
    }
  });

  const visibleOrder =
    state.filterMode === 'all'
      ? state.order
      : state.order.filter((id) => state.threads[id]?.status === 'active');
  const threadRows = visibleOrder.map((id) => state.threads[id]).filter(Boolean) as ThreadView[];
  const columns = viewport.columns;
  const rows = viewport.rows;
  const dashboardHeight = Math.max(24, rows - 1);
  const bodyHeight = Math.max(10, dashboardHeight - 8 - (state.showHelp ? 7 : 0));
  const leftPaneWidth = Math.max(52, Math.floor(columns * 0.42));
  const rightPaneWidth = Math.max(40, columns - leftPaneWidth - 6);
  const objectiveWidth = Math.max(12, Math.floor(columns * 0.2));
  const titleWidth = Math.max(24, columns - objectiveWidth - 32);

  const selectedLines = selected?.lines ?? [];
  const logWindowSize = Math.max(6, bodyHeight - 8);
  const maxStart = Math.max(0, selectedLines.length - logWindowSize);
  const start = Math.max(0, maxStart - state.runtimeScrollOffset);
  const end = Math.min(selectedLines.length, start + logWindowSize);
  const pageLines = selectedLines.slice(start, end);
  const selectedIndex = selected ? threadRows.findIndex((thread) => thread.id === selected.id) : 0;
  const leftListWindowSize = Math.max(3, bodyHeight - 5);
  const leftStart = Math.max(0, Math.min(Math.max(0, selectedIndex), Math.max(0, threadRows.length - leftListWindowSize)));
  const leftEnd = Math.min(threadRows.length, leftStart + leftListWindowSize);
  const leftRows = threadRows.slice(leftStart, leftEnd);
  const globalLogLines = state.globalLogLines;
  const detailLines = useMemo(() => {
    if (!selected) {
      return ['Select a thread to inspect details.'];
    }
    const messageLines = selected.lines.length > 0 ? selected.lines : ['(no captured messages yet)'];
    return [
      `id: ${selected.id}`,
      `status: ${formatThreadStatus(selected.status)}`,
      `parent: ${selected.parentId ?? '-'}`,
      `children (${selected.children.length}): ${selected.children.join(', ') || '-'}`,
      `refs_to (${selected.referencesTo.length}): ${selected.referencesTo.join(', ') || '-'}`,
      `referenced_by (${selected.referencedBy.length}): ${selected.referencedBy.join(', ') || '-'}`,
      `last update: ${ageLabel(selected.updatedAt, now)} ago`,
      `last message: ${selected.lastLine || '(no updates yet)'}`,
      '',
      'captured messages:',
      ...messageLines.map((line) => `- ${line}`),
    ];
  }, [selected, now]);
  const detailWindowSize = Math.max(6, bodyHeight - 8);
  const detailMaxStart = Math.max(0, detailLines.length - detailWindowSize);
  const detailStart = Math.max(0, detailMaxStart - state.detailScrollOffset);
  const detailEnd = Math.min(detailLines.length, detailStart + detailWindowSize);
  const detailPageLines = detailLines.slice(detailStart, detailEnd);
  const globalRelationLines = useMemo(() => {
    const lines: string[] = [];
    for (const thread of threadRows) {
      lines.push(`${thread.id} [${formatThreadStatus(thread.status)}]`);
      lines.push(`  parent <- ${thread.parentId ?? '-'}`);
      lines.push(`  children -> ${thread.children.join(', ') || '-'}`);
      lines.push(`  refs_to -> ${thread.referencesTo.join(', ') || '-'}`);
      lines.push(`  referenced_by <- ${thread.referencedBy.join(', ') || '-'}`);
      lines.push('');
    }
    if (lines.length === 0) {
      lines.push('(no threads in current filter)');
    }
    return lines;
  }, [threadRows]);
  const globalLines = useMemo(
    () => [...globalRelationLines, '--- recent runtime events ---', ...globalLogLines],
    [globalRelationLines, globalLogLines],
  );
  const globalWindowSize = Math.max(6, bodyHeight - 8);
  const globalMaxStart = Math.max(0, globalLines.length - globalWindowSize);
  const globalStart = Math.max(0, globalMaxStart - state.globalScrollOffset);
  const globalEnd = Math.min(globalLines.length, globalStart + globalWindowSize);
  const globalPageLines = globalLines.slice(globalStart, globalEnd);
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

  if (state.showGlobalOverlay) {
    return (
      <GlobalRelationOverlay
        store={store}
        threads={threadRows}
        viewport={viewport}
      />
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} height={dashboardHeight}>
      <Box flexDirection="column" marginBottom={1}>
        <Text>
          <Text color="cyanBright" bold>Leslie</Text> <Text color="gray">|</Text> Obj:{' '}
          <Text color="cyan">{truncateLine(state.objectiveId, objectiveWidth)}</Text> <Text color="gray">|</Text>{' '}
          <Text color="white">{truncateLine(state.title, titleWidth)}</Text>
        </Text>
        <Text>
          <Text color="gray">Threads:</Text> {statusCount.total} total (<Text color="green">{statusCount.active}</Text> running, <Text color="blue">{statusCount.completed}</Text> done) <Text color="gray">|</Text> <Text color="gray">Filter:</Text> <Text color="cyan">{state.filterMode}</Text> <Text color="gray">|</Text> <Text color="gray">Tab:</Text> <Text color="cyan">{state.activeTab}</Text>
        </Text>
        <Text color="gray">
          cwd: {truncateLine(state.cwd, Math.max(60, columns - 8))}
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
          <Text>tab/t: switch right pane tab (detail/runtime/global)</Text>
          <Text>d/r/g: jump to detail/runtime/global pane</Text>
          <Text>Shift+G: open fullscreen global relation graph</Text>
          <Text>f: toggle thread filter (all/running only)</Text>
          <Text>j/k: scroll active right pane</Text>
          <Text>?: toggle this help panel</Text>
          <Text>Approval mode: y allow, n deny</Text>
        </Box>
      ) : null}
      <Box flexGrow={1} minHeight={bodyHeight} height={bodyHeight}>
        <Box
          width={leftPaneWidth}
          height={bodyHeight}
          flexDirection="column"
          marginRight={1}
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
        >
          {leftRows.map((thread) => {
            const isSelected = thread.id === state.selectedThreadId;
            const runningMark = thread.status === 'active' ? spinner : ' ';
            const color = isSelected ? 'cyanBright' : 'white';
            return (
              <Box key={thread.id} flexDirection="column" marginTop={1}>
                <Text color={color} bold={isSelected}>
                  {isSelected ? '▶ ' : '  '}
                  <Text color={threadStatusColor(thread.status)}>[{formatThreadStatus(thread.status)}]</Text> {thread.id}{' '}
                  <Text color={thread.status === 'active' ? 'green' : 'gray'}>{runningMark}</Text>
                </Text>
                <Text color={isSelected ? 'cyan' : 'gray'}>
                  {'    '}
                  {truncateLine(thread.lastLine || '(no updates yet)', Math.max(24, leftPaneWidth - 10))}
                </Text>
              </Box>
            );
          })}
          {threadRows.length === 0 ? <Text color="gray">(no threads in current filter)</Text> : null}
          {threadRows.length > leftListWindowSize ? (
            <Text color="gray">
              list window: {leftStart + 1}-{leftEnd} / {threadRows.length}
            </Text>
          ) : null}
        </Box>
        <Box
          flexDirection="column"
          flexGrow={1}
          width={rightPaneWidth}
          height={bodyHeight}
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
        >
          <Text color="white" bold>
            {state.activeTab === 'detail'
              ? `Thread Detail (${selected?.id ?? 'none'})`
              : state.activeTab === 'runtime'
                ? `Thread Runtime (${selected?.id ?? 'none'})`
                : 'Global Relation Graph'}
          </Text>
          <Text color="gray">{'─'.repeat(rightPaneWidth - 4)}</Text>
          {state.activeTab === 'detail' ? (
            <>
              {detailPageLines.map((line, index) => (
                <Text key={`detail-${index}`}>{truncateLine(line, Math.max(30, rightPaneWidth - 6))}</Text>
              ))}
              <Box marginTop={1}>
                <Text color="gray">
                  detail window: {detailLines.length === 0 ? 0 : detailStart + 1}-{detailEnd} / {detailLines.length}
                </Text>
              </Box>
            </>
          ) : state.activeTab === 'global' ? (
            <>
              {globalPageLines.map((line, index) => (
                <Text key={`global-${index}`}>{truncateLine(line, Math.max(30, rightPaneWidth - 6))}</Text>
              ))}
              <Box marginTop={1}>
                <Text color="gray">
                  global window: {globalLines.length === 0 ? 0 : globalStart + 1}-{globalEnd} / {globalLines.length}
                </Text>
              </Box>
            </>
          ) : (
            <>
              {pageLines.map((line, index) => (
                <Text key={`${selected?.id ?? 'none'}-${index}`}>
                  {truncateLine(line.trimEnd().replace(/\t/g, '  '), Math.max(30, rightPaneWidth - 6))}
                </Text>
              ))}
              <Box marginTop={1}>
                {selected ? (
                  <Text color="gray">
                    log window: {selectedLines.length === 0 ? 0 : start + 1}-{end} / {selectedLines.length}
                  </Text>
                ) : (
                  <Text color="gray">Select a thread to view runtime.</Text>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
      <Box marginTop={1} flexDirection="column">
        {pendingApproval ? (
          <Box flexDirection="column" borderStyle="single" borderColor="yellow" paddingX={1} marginBottom={1}>
            <Text>
              <Text color="yellowBright" bold>Approval needed:</Text> [{pendingApproval.threadId}] {pendingApproval.toolName}
            </Text>
            <Text>{pendingApproval.inputPreview}</Text>
            <Text color="yellow">Press y to allow, n to deny</Text>
          </Box>
        ) : null}
        <Box>
          <Text color="black" backgroundColor="white">
            {' [↑/↓] Select '}
            {' [T] Switch Tab '}
            {' [D/R/G] Jump Tab '}
            {' [Shift+G] Graph '}
            {' [F] Filter '}
            {' [J/K] Scroll '}
            {' [?] Help '}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export interface RunTui {
  updateThread: (input: { id: string; status?: string; parentId?: string | null; appendLine?: string }) => void;
  appendGlobalLog: (line: string) => void;
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

export function createRunTui(title: string, objectiveId: string, cwd: string): RunTui {
  const store = new TuiStore(title, objectiveId, cwd);
  const app = render(<TuiApp store={store} />);

  return {
    updateThread: (input) => store.updateThread(input),
    appendGlobalLog: (line) => store.appendGlobalLog(line),
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
