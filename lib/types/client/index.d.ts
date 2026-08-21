import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type WorkspaceKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Workbench panel copy. */
        workbench: WorkspaceKey;
    }
}
/** Services required before mounting (provided by the client runtime). */
export declare const inject: string[];
/** Whether this renderer is the detached workspace window. */
export declare function isWorkspaceWindow(): boolean;
/**
 * Client plugin body: register the sidebar-foot launch action, the workspace
 * shell (detached window mode), and keep the store bound to the live current
 * session.
 * @param ctx - the client cordis context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map