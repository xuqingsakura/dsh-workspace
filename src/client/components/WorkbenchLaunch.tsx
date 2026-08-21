/**
 * Sidebar-foot launch action: opens the detached workspace window bound to the
 * current session (VSCode-style workbench). Rendered beside Settings in the
 * sidebar foot (the `sidebar.footer.action` seat), so the user always has a
 * one-click entry to the workbench window even before opening a conversation.
 * @module dsh-workbench-window/client-launch
 */
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the official ui-sidebar SlotMap merge so
// PropsRuntime<'sidebar.footer.action'> resolves its owner share.
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { NS } from '../locales.ts'
import css from '../styles/launch.module.css'

/** Full props for the sidebar-foot workbench launch action. */
export type WorkbenchLaunchProps =
  PropsRuntime<'sidebar.footer.action'>
  & PropsLocale<typeof NS>
  & { openWorkbench(): void }

/**
 * The sidebar-foot button that opens the detached workbench window.
 * @param props - the shell owner share (wide flag), the opener, and locale.
 */
export function WorkbenchLaunch({ wide, openWorkbench, t }: WorkbenchLaunchProps) {
  return (
    <button type="button" className={css.launch} onClick={openWorkbench} title={t('actions.workbench')} aria-label={t('actions.workbench')}>
      <span className={css.icon} aria-hidden="true">
        {/* VSCode-style split layout glyph (three panes). */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="2.5" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="6.5" y="2.5" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="6.5" y="8.5" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </span>
      {wide ? <span className={css.label}>{t('actions.workbench')}</span> : null}
    </button>
  )
}
