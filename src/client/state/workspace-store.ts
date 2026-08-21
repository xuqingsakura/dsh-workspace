/**
 * Workspace client store: one per activation, created in `apply` and shared
 * across the activity bar, sidebar, editor, and conversation seats. Follows
 * the DSH store discipline: exported `createWorkspaceStore()` factory (no
 * module-level singleton), read through `useStore`, write through actions.
 * @module dsh-workbench-window/client-state
 */

/** 一个打开的编辑器标签：普通文件或 git 变更差异。 */
export interface EditorTab {
  /** 稳定标签 id（file 用 editor: 前缀，diff 用 diff: 前缀，避免冲突）。 */
  id: string
  /** 显示标签（basename）。 */
  title: string
  /** 标签类型：file=普通文件；diff=git 变更差异。 */
  kind: 'file' | 'diff'
  /** file 标签：文件路径（相对会话 cwd）。 */
  path?: string
  /** diff 标签：变更文件路径。 */
  diffPath?: string
  /** diff 标签：true=对比暂存区(index)，false=对比工作区。 */
  staged?: boolean
}

/** The workspace layout state. */
export interface WorkspaceState {
  /** The active session binding (undefined until a session lands). */
  sessionId: string | undefined
  /** The session's authoritative cwd (drives the file tree root). */
  cwd: string | undefined
  /** Expanded directory paths (absolute, normalized). */
  expanded: Set<string>
  /** Selected file path (highlighted in the tree). */
  selected: string | undefined
  /** Open editor tabs, most recent last. */
  tabs: EditorTab[]
  /** The active editor tab id. */
  activeTabId: string | undefined
  /** Whether the detached workbench window mode is active. */
  detached: boolean
}

/** Store actions (the complete mutation API). */
export interface WorkspaceActions {
  bindSession(sessionId: string, cwd: string): void
  toggleExpanded(path: string): void
  selectFile(path: string): void
  openTab(path: string): void
  openDiffTab(path: string, staged: boolean): void
  closeTab(tabId: string): void
  activateTab(tabId: string): void
}

/** Default tab title from a path (basename, or the whole path fallback). */
function titleOf(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const index = normalized.lastIndexOf('/')
  return index >= 0 ? normalized.slice(index + 1) : normalized
}

export interface WorkspaceStore {
  getSnapshot(): WorkspaceState
  subscribe(listener: () => void): () => void
  reduce(recipe: (state: WorkspaceState) => WorkspaceState): void
}

/**
 * Create a workspace store instance (call once per activation).
 * @returns the store handle with snapshot/subscribe/reduce.
 */
export function createWorkspaceStore(): WorkspaceStore {
  let state: WorkspaceState = {
    sessionId: undefined,
    cwd: undefined,
    expanded: new Set(),
    selected: undefined,
    tabs: [],
    activeTabId: undefined,
    detached: new URLSearchParams(window.location.search).get('dshWindow') === 'workspace',
  }
  const listeners = new Set<() => void>()

  const getSnapshot = (): WorkspaceState => state

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }

  const reduce = (recipe: (draft: WorkspaceState) => WorkspaceState): void => {
    const next = recipe(state)
    if (next === state) return
    state = next
    for (const listener of [...listeners]) listener()
  }

  return { getSnapshot, subscribe, reduce }
}

/** The bound actions for one store instance (built in apply). */
export function createWorkspaceActions(store: WorkspaceStore): WorkspaceActions {
  const tabIdOf = (path: string): string => `editor:${path}`
  return {
    bindSession: (sessionId, cwd) => {
      store.reduce((s) => {
        if (s.sessionId === sessionId && s.cwd === cwd) return s
        // Switching sessions re-roots the tree and drops per-session tab state.
        return { ...s, sessionId, cwd, expanded: new Set(), selected: undefined, tabs: [], activeTabId: undefined }
      })
    },
    toggleExpanded: (path) => {
      store.reduce((s) => {
        const next = new Set(s.expanded)
        if (next.has(path)) next.delete(path)
        else next.add(path)
        return { ...s, expanded: next }
      })
    },
    selectFile: (path) => {
      store.reduce((s) => (s.selected === path ? s : { ...s, selected: path }))
    },
    openTab: (path) => {
      store.reduce((s) => {
        const id = tabIdOf(path)
        const existing = s.tabs.find(tab => tab.id === id)
        const tabs = existing === undefined ? [...s.tabs, { id, path, title: titleOf(path), kind: 'file' as const }] : s.tabs
        return { ...s, tabs, activeTabId: id }
      })
    },
    openDiffTab: (path, staged) => {
      store.reduce((s) => {
        const id = `diff:${path}:${staged ? 'staged' : 'worktree'}`
        const existing = s.tabs.find(tab => tab.id === id)
        const tabs = existing === undefined
          ? [...s.tabs, { id, title: `${titleOf(path)} (diff)`, kind: 'diff' as const, diffPath: path, staged }]
          : s.tabs
        return { ...s, tabs, activeTabId: id }
      })
    },
    closeTab: (tabId) => {
      store.reduce((s) => {
        const index = s.tabs.findIndex(tab => tab.id === tabId)
        if (index === -1) return s
        const tabs = s.tabs.filter(tab => tab.id !== tabId)
        const activeTabId = s.activeTabId === tabId
          ? (tabs[Math.min(index, tabs.length - 1)]?.id ?? undefined)
          : s.activeTabId
        return { ...s, tabs, activeTabId }
      })
    },
    activateTab: (tabId) => {
      store.reduce((s) => (s.activeTabId === tabId ? s : { ...s, activeTabId: tabId }))
    },
  }
}
