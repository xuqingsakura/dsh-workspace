/**
 * Editor column: tab strip (wheel-scrollable, no horizontal scrollbar) plus
 * the active tab's content. File content is rendered through FileViewer —
 * Markdown previews stay rendered, every other text file opens in the
 * CodeMirror editor with syntax highlighting and an explicit save (Ctrl+S or
 * the header button).
 * @module dsh-workbench-window/client-editor
 */
import { useCallback, useRef } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { api, type SessionScope } from '../api.ts'
import type { WorkbenchReadResult, WorkbenchWriteResult } from '../../workbench-types.ts'
import { FileViewer } from './FileViewer.tsx'
import { DiffViewer } from './DiffViewer.tsx'
import { NS } from '../locales.ts'
import type { EditorTab } from '../state/workspace-store.ts'
import css from '../styles/editor.module.css'

/** Props for the editor column. */
export interface EditorProps {
  scope: SessionScope | undefined
  tabs: EditorTab[]
  activeTabId: string | undefined
  onActivate(tabId: string): void
  onClose(tabId: string): void
  /** 把当前文件的保存函数注册给上层（菜单栏「保存」触发）。 */
  onRegisterSave?: (fn: (() => Promise<void>) | undefined) => void
  t: TranslateNS<typeof NS>
}

/** The editor column component. */
export function Editor({ scope, tabs, activeTabId, onActivate, onClose, onRegisterSave, t }: EditorProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const active = tabs.find(tab => tab.id === activeTabId)

  // Stable read/write verbs (FileViewer re-loads when the verb identity
  // changes; the cwd is the only drifting input and it is session-owned).
  const readText = useCallback(async (sessionId: string, path: string): Promise<WorkbenchReadResult> => {
    const result = await api.fsRead({ sessionId, cwd: scope?.cwd }, path)
    return { content: result.content, truncated: result.truncated, binary: result.binary, size: result.size, version: result.version }
  }, [scope?.cwd])
  const writeText = useCallback(async (sessionId: string, path: string, content: string, version: string): Promise<WorkbenchWriteResult> => {
    const result = await api.fsWrite({ sessionId, cwd: scope?.cwd }, path, content, version)
    return { version: result.version ?? '' }
  }, [scope?.cwd])

  // Wheel-scroll the tab strip horizontally without a visible scrollbar.
  const onWheel = (event: React.WheelEvent): void => {
    const strip = stripRef.current
    if (strip === null || strip.scrollWidth <= strip.clientWidth) return
    event.preventDefault()
    strip.scrollLeft += event.deltaY > 0 ? 40 : -40
  }

  return (
    <div className={css.root}>
      {tabs.length > 0 ? (
        <div ref={stripRef} className={css.tabs} onWheel={onWheel} role="tablist">
        {tabs.map(tab => (
          <div key={tab.id} role="tab" aria-selected={tab.id === activeTabId}
            className={`${css.tab} ${tab.id === activeTabId ? css.tabActive : ''}`}
            onClick={() => onActivate(tab.id)}>
            <span className={css.tabTitle}>{tab.title}</span>
            <button type="button" className={css.tabClose} aria-label="关闭"
              onClick={(e) => { e.stopPropagation(); onClose(tab.id) }}>×</button>
          </div>
        ))}
        </div>
      ) : null}
      <div className={css.content}>
        {active === undefined || scope === undefined
          ? null
          : active.kind === 'diff'
            ? <DiffViewer scope={scope} path={active.diffPath ?? ''} staged={active.staged === true}
                onClose={() => onClose(active.id)} t={t} />
            : <FileViewer sessionId={scope.sessionId} path={active.path ?? ''} readText={readText} writeText={writeText} t={t} onRegisterSave={onRegisterSave} />}
      </div>
    </div>
  )
}


