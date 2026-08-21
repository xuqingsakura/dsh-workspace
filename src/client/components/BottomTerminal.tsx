/**
 * Bottom terminal: the VSCode-style terminal strip at the window bottom.
 * Renders the prototype-style terminal panel (one persistent shell per
 * session with prompt, input, clear, and close). Without a bound session it
 * shows a quiet hint with the close affordance.
 * @module dsh-workbench-window/client-terminal
 */
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { TerminalPanel } from './TerminalPanel.tsx'
import { NS } from '../locales.ts'
import css from '../styles/root.module.css'

/** Props for the bottom terminal. */
export interface BottomTerminalProps {
  open: boolean
  onClose(): void
  /** The bound session; undefined shows a hint instead of spawning shells. */
  sessionId: string | undefined
  t: TranslateNS<typeof NS>
}

/** The bottom terminal strip. */
export function BottomTerminal({ open, onClose, sessionId, t }: BottomTerminalProps) {
  if (!open) return null
  if (sessionId === undefined) {
    return (
      <div className={css.bottomPanel}>
        <div className={css.bottomTabs}>
          <span className={css.bottomTabActive}>终端</span>
          <span className={css.bottomTabsSpacer} />
          <button type="button" className={css.iconBtn} aria-label="关闭终端" title="关闭终端" onClick={onClose}>×</button>
        </div>
        <div className={css.bottomBody}>选择会话以打开终端</div>
      </div>
    )
  }
  return (
    <div className={css.bottomPanel}>
      <TerminalPanel sessionId={sessionId} onClose={onClose} t={t} />
    </div>
  )
}
