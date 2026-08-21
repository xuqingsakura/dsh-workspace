/**
 * Workspace client store: one per activation, created in `apply` and shared
 * across the activity bar, sidebar, editor, and conversation seats. Follows
 * the DSH store discipline: exported `createWorkspaceStore()` factory (no
 * module-level singleton), read through `useStore`, write through actions.
 * @module dsh-workbench-window/client-state
 */
/** One open editor tab. */
export interface EditorTab {
    /** Stable tab id (path-derived). */
    id: string;
    /** File path relative to the session cwd (display + fetch key). */
    path: string;
    /** Display label (basename). */
    title: string;
}
/** The workspace layout state. */
export interface WorkspaceState {
    /** The active session binding (undefined until a session lands). */
    sessionId: string | undefined;
    /** The session's authoritative cwd (drives the file tree root). */
    cwd: string | undefined;
    /** Expanded directory paths (absolute, normalized). */
    expanded: Set<string>;
    /** Selected file path (highlighted in the tree). */
    selected: string | undefined;
    /** Open editor tabs, most recent last. */
    tabs: EditorTab[];
    /** The active editor tab id. */
    activeTabId: string | undefined;
    /** Whether the detached workbench window mode is active. */
    detached: boolean;
}
/** Store actions (the complete mutation API). */
export interface WorkspaceActions {
    bindSession(sessionId: string, cwd: string): void;
    toggleExpanded(path: string): void;
    selectFile(path: string): void;
    openTab(path: string): void;
    closeTab(tabId: string): void;
    activateTab(tabId: string): void;
}
export interface WorkspaceStore {
    getSnapshot(): WorkspaceState;
    subscribe(listener: () => void): () => void;
    reduce(recipe: (state: WorkspaceState) => WorkspaceState): void;
}
/**
 * Create a workspace store instance (call once per activation).
 * @returns the store handle with snapshot/subscribe/reduce.
 */
export declare function createWorkspaceStore(): WorkspaceStore;
/** The bound actions for one store instance (built in apply). */
export declare function createWorkspaceActions(store: WorkspaceStore): WorkspaceActions;
//# sourceMappingURL=workspace-store.d.ts.map