/**
 * Sidebar: the resizable left column hosting the file tree (VSCode style).
 * Re-roots when the session cwd changes (session switch follows the store).
 * @module dsh-workbench-window/client-sidebar
 */
import { useEffect, useSyncExternalStore } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { api } from '../api.ts'
import { FileTree } from './FileTree.tsx'
import { GitPanel } from './GitPanel.tsx'
import { SearchPanel } from './SearchPanel.tsx'
import type { WorkspaceStore } from '../state/workspace-store.ts'
import { NS } from '../locales.ts'
import css from '../styles/root.module.css'

/** One sidebar view. */
export type SidebarView = 'files' | 'git' | 'tasks' | 'search' | 'settings'

/** Props for the sidebar. */
export interface SidebarProps {
  view: SidebarView
  onViewChange(view: SidebarView): void
  store: WorkspaceStore
  t: TranslateNS<typeof NS>
}

/** The sidebar component (file tree seat). */
export function Sidebar({ view, onViewChange, store, t }: SidebarProps) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)

  // Bind the session cwd into the store so the tree re-roots on switch.
  useEffect(() => {
    if (state.sessionId === undefined) return
    let cancelled = false
    api.sessionCwd({ sessionId: state.sessionId })
      .then(({ cwd }) => { if (!cancelled) store.reduce(s => ({ ...s, sessionId: state.sessionId, cwd })) })
      .catch(() => { /* keep the previous cwd; the tree shows its own error */ })
    return () => { cancelled = true }
  }, [state.sessionId, store])

  return (
    <aside className={css.sidebar}>
      <div className={css.sidebarHeader}>
        <span className={css.sidebarTitle}>资源管理器</span>
        <span className={css.sidebarActions}>
          <button type="button" className={css.iconBtn} title="刷新" aria-label="刷新">↻</button>
        </span>
      </div>
      <div className={css.sidebarTabs}>
        {(['files', 'git', 'tasks'] as const).map(key => (
          <button key={key} type="button"
            className={`${css.sidebarTab} ${view === key ? css.sidebarTabActive : ''}`}
            onClick={() => onViewChange(key)}>
            {{ files: '文件', git: 'Git', tasks: '任务' }[key]}
          </button>
        ))}
      </div>
      {view === 'files' ? (
        <div className={css.sidebarBody}>
          {state.cwd !== undefined ? <div className={css.cwdBar} title={state.cwd}>{state.cwd.split(/[\\/]/).pop()}</div> : null}
          <FileTree
            scope={state.sessionId === undefined ? undefined : { sessionId: state.sessionId, cwd: state.cwd }}
            expanded={state.expanded}
            selected={state.selected}
            onToggleExpanded={(path) => store.reduce(toggleExpanded(path))}
            onSelect={(path) => store.reduce(s => ({ ...s, selected: path }))}
            onOpen={(path) => store.reduce(openTab(path))}
          />
        </div>
      ) : view === 'git' ? (
        <div className={css.sidebarBody}>
          <GitPanel
            scope={state.sessionId === undefined ? undefined : { sessionId: state.sessionId, cwd: state.cwd }}
            onOpenDiff={(path, staged) => store.reduce(openDiffTab(path, staged))}
            t={t}
          />
        </div>
      ) : view === 'search' ? (
        <div className={css.sidebarBody}>
          <SearchPanel
            scope={state.sessionId === undefined ? undefined : { sessionId: state.sessionId, cwd: state.cwd }}
            onOpen={(path) => store.reduce(openTab(path))}
            t={t}
          />
        </div>
      ) : view === 'settings' ? (
        <div className={css.sidebarPlaceholder}>管理（开发中）</div>
      ) : (
        <div className={css.sidebarPlaceholder}>后台任务（开发中）</div>
      )}
    </aside>
  )
}

/** Immutable expand/collapse toggle. */
function toggleExpanded(path: string): (s: import('../state/workspace-store.ts').WorkspaceState) => import('../state/workspace-store.ts').WorkspaceState {
  return (s) => {
    const next = new Set(s.expanded)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    return { ...s, expanded: next }
  }
}

/** Immutable open-diff-tab reducer（git 变更：打开一个 diff 标签）。 */
function openDiffTab(path: string, staged: boolean): (s: import('../state/workspace-store.ts').WorkspaceState) => import('../state/workspace-store.ts').WorkspaceState {
  return (s) => {
    const id = `diff:${path}:${staged ? 'staged' : 'worktree'}`
    const existing = s.tabs.find(tab => tab.id === id)
    const tabs = existing === undefined
      ? [...s.tabs, { id, title: `${path.split('/').pop() ?? path} (diff)`, kind: 'diff' as const, diffPath: path, staged }]
      : s.tabs
    return { ...s, tabs, activeTabId: id }
  }
}

/** Immutable open-tab reducer. */
function openTab(path: string): (s: import('../state/workspace-store.ts').WorkspaceState) => import('../state/workspace-store.ts').WorkspaceState {
  return (s) => {
    const id = `editor:${path}`
    const existing = s.tabs.find(tab => tab.id === id)
    const tabs = existing === undefined
      ? [...s.tabs, { id, path, title: path.split('/').pop() ?? path, kind: 'file' as const }]
      : s.tabs
    return { ...s, tabs, activeTabId: id }
  }
}
