import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { WorkspaceStore } from '../state/workspace-store.ts';
import { NS } from '../locales.ts';
/** One sidebar view. */
export type SidebarView = 'files' | 'git' | 'tasks' | 'search' | 'settings';
/** Props for the sidebar. */
export interface SidebarProps {
    view: SidebarView;
    onViewChange(view: SidebarView): void;
    store: WorkspaceStore;
    t: TranslateNS<typeof NS>;
}
/** The sidebar component (file tree seat). */
export declare function Sidebar({ view, onViewChange, store, t }: SidebarProps): import("react").JSX.Element;
//# sourceMappingURL=Sidebar.d.ts.map