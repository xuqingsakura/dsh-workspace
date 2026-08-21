import type { Context } from './context-types.ts';
import { type WorkspaceConfig } from './config.ts';
/** Plugin identity for cordis.yml rows. */
export declare const name = "dsh-workbench-window";
/** Services required before mounting. */
export declare const inject: string[];
export type { WorkspaceConfig } from './config.ts';
export { resolveWorkspaceConfig } from './config.ts';
/** Content type for a path extension (binary-safe fallback). */
export declare function mediaTypeForPath(path: string): string;
/**
 * Plugin body: register the JSON API, the media route, and the lazy-bundle
 * route, all behind the browser-trust fence.
 * @param ctx - the host cordis context.
 * @param config - optional cordis.yml config section.
 */
export declare function apply(ctx: Context, config?: Partial<WorkspaceConfig>): void;
//# sourceMappingURL=index.d.ts.map