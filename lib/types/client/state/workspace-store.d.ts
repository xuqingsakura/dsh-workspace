/**
 * Workspace client store: one per activation, created in `apply` and shared
 * across the activity bar, sidebar, editor, and conversation seats. Follows
 * the DSH store discipline: exported `createWorkspaceStore()` factory (no
 * module-level singleton), read through `useStore`, write through actions.
 * @module dsh-workbench-window/client-state
 */
/** 一个打开的编辑器标签：普通文件或 git 变更差异。 */
export interface EditorTab {
    /** 稳定标签 id（file 用 editor: 前缀，diff 用 diff: 前缀，避免冲突）。 */
    id: string;
    /** 显示标签（basename）。 */
    title: string;
    /** 标签类型：file=普通文件；diff=git 变更差异。 */
    kind: 'file' | 'diff';
    /** file 标签：文件路径（相对会话 cwd）。 */
    path?: string;
    /** diff 标签：变更文件路径。 */
    diffPath?: string;
    /** diff 标签：true=对比暂存区(index)，false=对比工作区。 */
    staged?: boolean;
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
    openDiffTab(path: string, staged: boolean): void;
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