import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { WorkspaceStore } from '../state/workspace-store.ts';
import { NS } from '../locales.ts';
/** One sidebar view. */
export type SidebarView = 'files' | 'git' | 'tasks' | 'browser' | 'search' | 'settings';
/** Props for the sidebar. */
export interface SidebarProps {
    view: SidebarView;
    onViewChange(view: SidebarView): void;
    store: WorkspaceStore;
    /** 文件树刷新令牌（新建文件/文件夹后自增，触发重载）。 */
    refreshToken?: number;
    t: TranslateNS<typeof NS>;
}
/** The sidebar component (file tree seat). */
export declare function Sidebar({ view, onViewChange, store, refreshToken, t }: SidebarProps): import("react").JSX.Element;
//# sourceMappingURL=Sidebar.d.ts.map