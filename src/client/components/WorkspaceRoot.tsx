/**
 * Workspace root: the detached workspace-window layout (VSCode style). Rendered
 * as the `workspace.shell` occupant when the host boots with
 * ?dshWindow=workspace — it owns the whole window: menu bar, activity bar,
 * sidebar file tree, center editor, the conversation via the render bridge,
 * the bottom terminal, and the status bar.
 *
 * Column layout: sidebar | editor | chat default to a 1:2:1 split (editor twice the others); dragging a
 * handle converts that column to a fixed pixel width (the chat absorbs the
 * remainder). The activity bar and sidebar span the full body height, and the
 * bottom terminal lives under the editor+chat row only, so opening it never
 * shrinks the left rail nor covers the file tree.
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
import { StatusBar } from './StatusBar.tsx'
import css from '../styles/root.module.css'

/** Full props of the workspace root (framework share + owner + store). */
export type WorkspaceRootProps =
  PropsRuntime<'workspace.shell'>
  & PropsLocale<'workbench'>
  & WorkspaceShellOwnerProps
  & { store: WorkspaceStore }

/** Dragged column widths in pixels; undefined means "not dragged yet" (1:1:1). */
interface Columns {
  sidebar: number
  editor: number
}

/** One active drag session (pointer origin + widths frozen at drag start). */
interface DragSession {
  side: 'sidebar' | 'editor'
  startX: number
  base: Columns
}

/** Sanity bounds for the resizable columns (VSCode-like floor/ceiling). */
const MIN_SIDEBAR = 180
const MAX_SIDEBAR = 760
const MIN_EDITOR = 260
const MAX_EDITOR = 1100

/** Clamp a pixel width into [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * The detached workspace window root: one full-window VSCode-style layout.
 * @param props - framework share, the conversation bridge, and the store.
 */
export function WorkspaceRoot({ renderConversation, store, t }: WorkspaceRootProps) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const [activity, setActivity] = useState<ActivityView>('explorer')
  const [sidebarView, setSidebarView] = useState<SidebarView>('files')
  const [terminalOpen, setTerminalOpen] = useState(false)
  // undefined = untouched: the three columns split 1:2:1 (editor widest).
  const [columns, setColumns] = useState<Columns | undefined>(undefined)

  const rowRef = useRef<HTMLDivElement | null>(null)
  const sideRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<DragSession | null>(null)

  /** Measure the current columns so an untouched layout can seed a drag base. */
  const measureBase = useCallback((): Columns => {
    const side = sideRef.current
    const row = rowRef.current
    return {
      sidebar: side === null ? 0 : Math.round(side.getBoundingClientRect().width),
      editor: row === null || row.children[0] === undefined ? 0 : Math.round(row.children[0].getBoundingClientRect().width),
    }
  }, [])

  /** Pointer down: freeze the base widths and capture the pointer. */
  const onHandleDown = useCallback((side: 'sidebar' | 'editor') => (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { side, startX: event.clientX, base: columns ?? measureBase() }
  }, [columns, measureBase])

  /** Pointer move: resize the dragged column; chat keeps the remainder. */
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

  // Inline flex: an untouched column stays flexible (1:1:1); a dragged one
  // becomes a fixed flex-basis so the chat absorbs the remaining width.
  const paneStyle = (width: number | undefined): React.CSSProperties | undefined =>
    width === undefined ? undefined : { flex: `0 0 ${width}px` }

  return (
    <div className={css.root}>
      <nav className={css.menubar} aria-label="菜单栏">
        {['文件', '编辑', '查看', '转到', '终端', '帮助'].map(label => (
          <button key={label} type="button" className={css.menubarItem}
            onClick={label === '终端' ? () => { setTerminalOpen(true) } : undefined}>{label}</button>
        ))}
      </nav>
      <div className={css.body}>
        <ActivityBar active={activity} onSelect={setActivity} />
        <div ref={sideRef} className={css.sidePane} style={paneStyle(columns?.sidebar)}>
          <Sidebar view={sidebarView} onViewChange={setSidebarView} store={store} />
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
              <Editor scope={state.sessionId === undefined ? undefined : { sessionId: state.sessionId, cwd: state.cwd }}
                tabs={state.tabs} activeTabId={state.activeTabId} t={t}
                onActivate={(id) => { store.reduce(s => ({ ...s, activeTabId: id })) }}
                onClose={(id) => { store.reduce(closeTab(id)) }} />
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
            <div className={css.chatPane}>
              {renderConversation()}
            </div>
          </div>
          <BottomTerminal open={terminalOpen} onClose={() => { setTerminalOpen(false) }} sessionId={state.sessionId} t={t} />
        </div>
      </div>
      <StatusBar />
    </div>
  )
}

/** Immutable close-tab reducer (keeps the active tab valid). */
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
