/**
 * Local SlotMap augmentation for the fork-specific `workspace.shell` seat.
 *
 * The `workspace.shell` slot is declared by the host (ui-layout's root entry)
 * only in fork builds that ship the detached-workspace bridge (AppFrame
 * renders it when ?dshWindow=workspace). It is NOT part of the upstream
 * `@deepseek-ai/dsh-client-ui-layout` package published to npm, so this plugin
 * declares the owner contract locally rather than importing the fork's types.
 *
 * When the host lacks the seat (bare upstream), the registration is inert —
 * dsh-workbench-window falls back to its in-window workbench toggle.
 * @module dsh-workbench-window/shell-slot
 */
import type { ReactNode } from 'react'
import type {} from '@deepseek-ai/dsh-client-ui-slots'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /**
     * The detached workspace window shell, rendered instead of the three
     * columns while the web UI boots in workspace-window mode
     * (?dshWindow=workspace). OCCUPIED by dsh-workbench-window, which owns the whole
     * window layout. The owner receives a renderConversation bridge so it can
     * place the original conversation (ui-conversation's ConversationRoot)
     * anywhere in its own layout.
     */
    'workspace.shell': { kind: 'single'; scope: 'root'; owner: WorkspaceShellOwnerProps }
  }
}

/** Owner share of the workspace.shell seat (mirrors the host contract). */
export interface WorkspaceShellOwnerProps {
  /**
   * Render the original conversation (ui-conversation's ConversationRoot)
   * into the caller's own layout. Safe to call at most once per render.
   */
  renderConversation(): ReactNode
}
