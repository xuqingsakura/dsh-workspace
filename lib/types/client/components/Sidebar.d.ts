import type { WorkspaceStore } from '../state/workspace-store.ts';
/** One sidebar view. */
export type SidebarView = 'files' | 'git' | 'tasks';
/** Props for the sidebar. */
export interface SidebarProps {
    view: SidebarView;
    onViewChange(view: SidebarView): void;
    store: WorkspaceStore;
}
/** The sidebar component (file tree seat). */
export declare function Sidebar({ view, onViewChange, store }: SidebarProps): import("react").JSX.Element;
//# sourceMappingURL=Sidebar.d.ts.map