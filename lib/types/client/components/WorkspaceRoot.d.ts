import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { WorkspaceStore } from '../state/workspace-store.ts';
import type { WorkspaceShellOwnerProps } from '../shell-slot.d.ts';
/** Full props of the workspace root (framework share + owner + store). */
export type WorkspaceRootProps = PropsRuntime<'workspace.shell'> & PropsLocale<'workbench'> & WorkspaceShellOwnerProps & {
    store: WorkspaceStore;
};
/**
 * The detached workspace window root: one full-window VSCode-style layout.
 * @param props - framework share, the conversation bridge, and the store.
 */
export declare function WorkspaceRoot({ renderConversation, store, t }: WorkspaceRootProps): import("react").JSX.Element;
//# sourceMappingURL=WorkspaceRoot.d.ts.map