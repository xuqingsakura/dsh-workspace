import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { WorkspaceStore } from '../state/workspace-store.ts';
import type { WorkspaceShellOwnerProps } from '../shell-slot.d.ts';
/** 工作台根 props（框架共享 + owner + store）。 */
/** 会话列表快照（宽松结构，避免依赖 api-remotes 的 client bundle purity 门禁）。 */
export interface SessionListSnapshot {
    ids: string[];
    byId: Record<string, {
        title?: string;
    }>;
    current: string | undefined;
}
/** 会话服务的最小面（open 切换 + list 只读）。 */
export interface SessionsLike {
    open(id: string): void;
    list: {
        getSnapshot(): SessionListSnapshot;
        subscribe(listener: () => void): () => void;
    };
}
export type WorkspaceRootProps = PropsRuntime<'workspace.shell'> & PropsLocale<'workbench'> & WorkspaceShellOwnerProps & {
    store: WorkspaceStore;
    sessions: SessionsLike;
};
/**
 * 工作台根组件。
 * @param props - 框架共享、对话桥、store。
 */
export declare function WorkspaceRoot({ renderConversation, store, sessions, t }: WorkspaceRootProps): import("react").JSX.Element;
//# sourceMappingURL=WorkspaceRoot.d.ts.map