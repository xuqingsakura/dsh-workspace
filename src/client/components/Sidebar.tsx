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
import { BrowserPanel } from './BrowserPanel.tsx'
import { TasksPanel } from './TasksPanel.tsx'
import type { WorkspaceStore } from '../state/workspace-store.ts'
import { NS } from '../locales.ts'
import css from '../styles/root.module.css'

/** One sidebar view. */
export type SidebarView = 'files' | 'git' | 'tasks' | 'browser' | 'search' | 'settings'

/** Props for the sidebar. */
export interface SidebarProps {
  view: SidebarView
  onViewChange(view: SidebarView): void
  store: WorkspaceStore
  /** 文件树刷新令牌（新建文件/文件夹后自增，触发重载）。 */
  refreshToken?: number
  t: TranslateNS<typeof NS>
}

/** 侧边栏标题随视图变化。 */
const VIEW_TITLE: Record<SidebarView, string> = {
  files: '资源管理器',
  git: '源代码管理',
  search: '搜索',
  settings: '设置',
  browser: '浏览器',
  tasks: '任务',
}

/** The sidebar component (file tree seat). */
export function Sidebar({ view, onViewChange, store, refreshToken, t }: SidebarProps) {
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
        <span className={css.sidebarTitle}>{VIEW_TITLE[view]}</span>
        <span className={css.sidebarActions}>
          <button type="button" className={css.iconBtn} title="刷新" aria-label="刷新">↻</button>
        </span>
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
            refreshToken={refreshToken}
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
        <div className={css.sidebarBody}>
          <div className={css.sidebarPlaceholder}>
            <div className={css.settingsHint}>设置请在主窗口操作</div>
            <button type="button" className={css.iconBtn} onClick={() => window.close()}>返回主窗口</button>
          </div>
        </div>
      ) : view === 'browser' ? (
        <div className={css.sidebarBody}>
          <BrowserPanel t={t} />
        </div>
      ) : (
        <div className={css.sidebarBody}>
          <TasksPanel
            scope={state.sessionId === undefined ? undefined : { sessionId: state.sessionId, cwd: state.cwd }}
            t={t}
          />
        </div>
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
