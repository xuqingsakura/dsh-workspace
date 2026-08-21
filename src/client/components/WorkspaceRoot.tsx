/**
 * 工作台根布局：独立工作台窗口（VSCode 风格）。作为 `workspace.shell` seat 的
 * 宿主，在 ?dshWindow=workspace 时拥有整个窗口：菜单栏、活动栏、侧边栏、
 * 中间编辑/浏览器列、对话（renderConversation 桥）、底部终端。
 *
 * 列布局：侧边栏 | 编辑/浏览器 | 对话 默认 1:2:1，可拖拽；活动栏与侧边栏
 * 占满整列高度，底部终端只位于编辑+对话下方。
 * @module dsh-workbench-window/client-root
 */
import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { WorkspaceStore } from '../state/workspace-store.ts'
import type { WorkspaceShellOwnerProps } from '../shell-slot.d.ts'
import { ActivityBar, type ActivityView } from './ActivityBar.tsx'
import { Sidebar, type SidebarView } from './Sidebar.tsx'
import { Editor } from './Editor.tsx'
import { BottomTerminal } from './BottomTerminal.tsx'
import { BrowserPanel } from './BrowserPanel.tsx'
import { SessionSwitcher } from './SessionSwitcher.tsx'
import css from '../styles/root.module.css'

/** 工作台根 props（框架共享 + owner + store）。 */
/** 会话列表快照（宽松结构，避免依赖 api-remotes 的 client bundle purity 门禁）。 */
export interface SessionListSnapshot {
  ids: string[]
  byId: Record<string, { title?: string }>
  current: string | undefined
}

/** 会话服务的最小面（open 切换 + list 只读）。 */
export interface SessionsLike {
  open(id: string): void
  list: { getSnapshot(): SessionListSnapshot; subscribe(listener: () => void): () => void }
}

export type WorkspaceRootProps =
  PropsRuntime<'workspace.shell'>
  & PropsLocale<'workbench'>
  & WorkspaceShellOwnerProps
  & { store: WorkspaceStore; sessions: SessionsLike }

/** 拖拽列宽（像素）；undefined 表示未拖拽（1:1:1）。 */
interface Columns {
  sidebar: number
  editor: number
}

/** 一次拖拽会话（指针起点 + 拖拽开始时冻结的列宽）。 */
interface DragSession {
  side: 'sidebar' | 'editor'
  startX: number
  base: Columns
}

/** 可调整列的合理范围（VSCode 风格下限/上限）。 */
const MIN_SIDEBAR = 180
const MAX_SIDEBAR = 760
const MIN_EDITOR = 260
const MAX_EDITOR = 1100

/** 把像素宽夹在 [min, max] 内。 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** 活动栏图标 -> 侧边栏视图映射（VSCode 风格：点击图标切换侧边栏）。 */
const ACTIVITY_TO_SIDEBAR: Record<ActivityView, SidebarView> = {
  explorer: 'files',
  scm: 'git',
  search: 'search',
  settings: 'settings',
  browser: 'files',
  tasks: 'tasks',
}

/** 侧边栏视图 -> 活动栏图标反向映射（点侧边栏 tab 时同步高亮）。 */
const SIDEBAR_TO_ACTIVITY: Record<SidebarView, ActivityView> = {
  files: 'explorer',
  git: 'scm',
  search: 'search',
  settings: 'settings',
  tasks: 'tasks',
  browser: 'explorer',
}

/** 中间列视图：编辑器 或 浏览器（浏览器放阅读区，占大空间）。 */
type CenterView = 'editor' | 'browser'

/** 菜单栏定义：每个菜单下的条目。 */
const MENUS: Record<string, Array<{ id: string; label: string }>> = {
  '文件': [
    { id: 'refresh', label: '刷新' },
  ],
  '编辑': [
    { id: 'copyPath', label: '复制当前文件路径' },
  ],
  '查看': [
    { id: 'files', label: '资源管理器' },
    { id: 'git', label: '源代码管理' },
    { id: 'search', label: '搜索' },
    { id: 'browser', label: '浏览器' },
    { id: 'tasks', label: '任务' },
  ],
  '转到': [
    { id: 'goFile', label: '转到文件（搜索）' },
    { id: 'goGit', label: '转到源代码管理' },
  ],
  '终端': [
    { id: 'openTerminal', label: '打开终端' },
  ],
  '帮助': [
    { id: 'about', label: '关于' },
  ],
}

/**
 * 工作台根组件。
 * @param props - 框架共享、对话桥、store。
 */
export function WorkspaceRoot({ renderConversation, store, sessions, t }: WorkspaceRootProps) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const sessionState = useSyncExternalStore(sessions.list.subscribe, sessions.list.getSnapshot)
  const [activity, setActivity] = useState<ActivityView>('explorer')
  const [sidebarView, setSidebarView] = useState<SidebarView>('files')
  const [centerView, setCenterView] = useState<CenterView>('editor')
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | undefined>(undefined)
  /** 是否折叠右侧对话区（折叠后阅读区伸展占满）。 */
  const [chatCollapsed, setChatCollapsed] = useState(false)
  // undefined = 未拖拽：三列按 1:2:1 弹性分配。
  const [columns, setColumns] = useState<Columns | undefined>(undefined)

  const rowRef = useRef<HTMLDivElement | null>(null)
  const sideRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<DragSession | null>(null)

  /** 点击活动栏图标：切换高亮、联动侧边栏；浏览器切到中间列。 */
  const onActivitySelect = useCallback((view: ActivityView): void => {
    setActivity(view)
    if (view === 'browser') {
      setCenterView('browser')
      setSidebarView('files')
    } else {
      setCenterView('editor')
      setSidebarView(ACTIVITY_TO_SIDEBAR[view])
    }
  }, [])

  /** 点击侧边栏视图变化：切换视图并同步活动栏高亮。 */
  const onSidebarViewChange = useCallback((view: SidebarView): void => {
    setSidebarView(view)
    setActivity(SIDEBAR_TO_ACTIVITY[view])
    if (view === 'browser') setCenterView('browser')
  }, [])

  /** 菜单项选择处理。 */
  const onMenuSelect = useCallback((menu: string, id: string): void => {
    setOpenMenu(undefined)
    if (id === 'openTerminal') { setTerminalOpen(true); return }
    if (id === 'refresh') { window.location.reload(); return }
    if (id === 'copyPath') {
      const active = state.tabs.find(tab => tab.id === state.activeTabId)
      if (active !== undefined && active.path !== undefined) void navigator.clipboard?.writeText(active.path)
      return
    }
    if (menu === '查看') {
      if (id === 'browser') { setCenterView('browser'); setActivity('browser'); return }
      onSidebarViewChange(id as SidebarView)
      return
    }
    if (menu === '转到') {
      if (id === 'goFile') onSidebarViewChange('search')
      else if (id === 'goGit') onSidebarViewChange('git')
      return
    }
    if (id === 'about') { window.alert('DeepSeek Harness 工作台 v0.1.0'); return }
  }, [state.tabs, state.activeTabId, onSidebarViewChange])

  /** 测量当前列宽，供未拖拽布局做拖拽基准。 */
  const measureBase = useCallback((): Columns => {
    const side = sideRef.current
    const row = rowRef.current
    return {
      sidebar: side === null ? 0 : Math.round(side.getBoundingClientRect().width),
      editor: row === null || row.children[0] === undefined ? 0 : Math.round(row.children[0].getBoundingClientRect().width),
    }
  }, [])

  /** 指针按下：冻结基准列宽并捕获指针。 */
  const onHandleDown = useCallback((side: 'sidebar' | 'editor') => (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { side, startX: event.clientX, base: columns ?? measureBase() }
  }, [columns, measureBase])

  /** 指针移动：调整被拖列，对话吸收剩余宽度。 */
  const onHandleMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const session = dragRef.current
    if (session === null || !event.currentTarget.hasPointerCapture(event.pointerId)) return
    const delta = event.clientX - session.startX
    const next: Columns = { ...session.base }
    if (session.side === 'sidebar') {
      next.sidebar = clamp(session.base.sidebar + delta, MIN_SIDEBAR, MAX_SIDEBAR)
    } else {
      next.editor = clamp(session.base.editor + delta, MIN_EDITOR, MAX_EDITOR)
    }
    setColumns(next)
  }, [])

  const onHandleUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
  }, [])

  // 内联 flex：未拖拽列保持弹性（1:1:1），拖拽后固定为像素 flex-basis。
  const paneStyle = (width: number | undefined): React.CSSProperties | undefined =>
    width === undefined ? undefined : { flex: `0 0 ${width}px` }

  return (
    <div className={css.root}>
      <nav className={css.menubar} aria-label="菜单栏">
        {Object.keys(MENUS).map(label => (
          <div key={label} className={css.menuWrap}>
            <button type="button" className={css.menubarItem}
              onClick={() => setOpenMenu(openMenu === label ? undefined : label)}>{label}</button>
            {openMenu === label ? (
              <div className={css.menuDropdown}>
                {(MENUS[label] ?? []).map(item => (
                  <button key={item.id} type="button" className={css.menuItem}
                    onClick={() => onMenuSelect(label, item.id)}>{item.label}</button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
      <div className={css.body}>
        <ActivityBar active={activity} onSelect={onActivitySelect} />
        <div ref={sideRef} className={css.sidePane} style={paneStyle(columns?.sidebar)}>
          <Sidebar view={sidebarView} onViewChange={onSidebarViewChange} store={store} t={t} />
        </div>
        <div
          className={css.handle}
          data-side="sidebar"
          role="separator"
          aria-orientation="vertical"
          onPointerDown={onHandleDown('sidebar')}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
        />
        <div className={css.mainCol}>
          <div ref={rowRef} className={css.rightRow}>
            <div className={css.editorPane} style={paneStyle(columns?.editor)}>
              {centerView === 'browser'
                ? <BrowserPanel t={t} />
                : <Editor scope={state.sessionId === undefined ? undefined : { sessionId: state.sessionId, cwd: state.cwd }}
                    tabs={state.tabs} activeTabId={state.activeTabId} t={t}
                    onActivate={(id) => { store.reduce(s => ({ ...s, activeTabId: id })) }}
                    onClose={(id) => { store.reduce(closeTab(id)) }} />}
            </div>
            <div
              className={css.handle}
              data-side="editor"
              role="separator"
              aria-orientation="vertical"
              onPointerDown={onHandleDown('editor')}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
            />
            {chatCollapsed ? (
              <div className={css.chatRestore}>
                <button type="button" className={css.chatRestoreBtn} title="还原对话区" aria-label="还原对话区"
                  onClick={() => setChatCollapsed(false)}>◧</button>
              </div>
            ) : (
              <div className={css.chatPane}>
                <div className={css.chatHeader}>
                  <SessionSwitcher
                    ids={sessionState.ids}
                    byId={sessionState.byId}
                    current={sessionState.current}
                    onOpen={(id) => sessions.open(id)}
                    t={t}
                  />
                  <span className={css.chatHeaderSpacer} />
                  <button type="button" className={css.iconBtn} title="最小化对话区" aria-label="最小化对话区"
                    onClick={() => setChatCollapsed(true)}>—</button>
                </div>
                <div className={css.chatBody}>
                  {renderConversation()}
                </div>
              </div>
            )}
          </div>
          <BottomTerminal open={terminalOpen} onClose={() => { setTerminalOpen(false) }} sessionId={state.sessionId} t={t} />
        </div>
      </div>
    </div>
  )
}

/** 不可变关闭标签 reducer（保持活动标签有效）。 */
function closeTab(tabId: string): (s: import('../state/workspace-store.ts').WorkspaceState) => import('../state/workspace-store.ts').WorkspaceState {
  return (s) => {
    const index = s.tabs.findIndex(tab => tab.id === tabId)
    if (index === -1) return s
    const tabs = s.tabs.filter(tab => tab.id !== tabId)
    const activeTabId = s.activeTabId === tabId
      ? (tabs[Math.min(index, tabs.length - 1)]?.id ?? undefined)
      : s.activeTabId
    return { ...s, tabs, activeTabId }
  }
}
