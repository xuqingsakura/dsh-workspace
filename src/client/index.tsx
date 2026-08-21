/**
 * Client half of dsh-workbench-window (direction B: self-drawn workspace window).
 *
 * In detached-window mode (?dshWindow=workspace) the host's AppFrame renders
 * the `workspace.shell` seat and hands this plugin a renderConversation
 * bridge; this plugin registers its WorkspaceRoot there and owns the whole
 * window layout (activity bar / sidebar / editor / conversation / terminal /
 * status bar). The conversation column stays the ORIGINAL DSH display because
 * it is rendered by ui-conversation's ConversationRoot through the bridge.
 *
 * In normal mode (main window) the plugin registers a sidebar-foot "工作台"
 * launch action (opens the detached window for the current session) and keeps
 * the file-tree host routes serving external callers.
 *
 * All state lives in one workspace store created here. Requires the slots,
 * sessions, locale, and sidebar-foot services.
 * @module dsh-workbench-window/client
 */
import { useEffect } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: pulls the official ui-sidebar SlotMap merge for the footer seat.
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from './shell-slot.d.ts'
import { createWorkspaceStore } from './state/workspace-store.ts'
import { WorkspaceRoot, type WorkspaceRootProps } from './components/WorkspaceRoot.tsx'
import { WorkbenchLaunch, type WorkbenchLaunchProps } from './components/WorkbenchLaunch.tsx'
import { en, NS, zh, type WorkspaceKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Workbench panel copy. */
    workbench: WorkspaceKey
  }
}

/** Services required before mounting (provided by the client runtime). */
export const inject = ['slots', 'sessions', 'locale']

/** Whether this renderer is the detached workspace window. */
export function isWorkspaceWindow(): boolean {
  return new URLSearchParams(window.location.search).get('dshWindow') === 'workspace'
}

/** Bridge the desktop shell exposes for opening the detached window. */
interface DesktopBridge {
  openWorkbenchWindow?(sessionId?: string): Promise<unknown>
}

/**
 * Open the detached workbench window bound to the current session (absent in
 * the web browser — the button is then inert).
 */
function openWorkbench(ctx: ClientContext): void {
  const current = ctx.sessions.list.getSnapshot().current
  const desktop = (window as unknown as { dshDesktop?: DesktopBridge }).dshDesktop
  void desktop?.openWorkbenchWindow?.(current === undefined ? undefined : String(current))
}

/**
 * Client plugin body: register the sidebar-foot launch action, the workspace
 * shell (detached window mode), and keep the store bound to the live current
 * session.
 * @param ctx - the client cordis context.
 */
export function apply(ctx: ClientContext): void {
  // Dictionaries follow the DSH i18n system (live language switching).
  ctx.effect(() => {
    const offZh = ctx.locale.register(NS, 'zh', zh)
    const offEn = ctx.locale.register(NS, 'en', en)
    return () => { offZh(); offEn() }
  }, 'dsh-workbench-window: dictionaries')

  const store = createWorkspaceStore()

  // Main window: sidebar-foot entry to the detached workbench window.
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'workbench-launch',
    order: 0,
    locale: NS,
    inject: (): Pick<WorkbenchLaunchProps, 'openWorkbench'> => ({
      openWorkbench: () => openWorkbench(ctx),
    }),
  }, WorkbenchLaunch))

  // Follow the live current session: switch the workspace (and re-root the
  // file tree) when the user changes sessions anywhere in the app.
  ctx.effect(() => {
    const off = ctx.sessions.list.subscribe(() => {
      const current = ctx.sessions.list.getSnapshot().current
      if (current === undefined) return
      store.reduce(s => (s.sessionId === current ? s : { ...s, sessionId: String(current) }))
    })
    return off
  }, 'dsh-workbench-window: session follow')

  // Detached workspace window: own the whole layout through the shell seat.
  if (isWorkspaceWindow()) {
    ctx.slots.inject('workspace.shell', () => ctx.slots.register({
      name: 'workspace.shell',
      locale: NS,
      inject: (): Pick<WorkspaceRootProps, 'store'> => ({ store }),
    }, WorkspaceRoot))
  }
}
