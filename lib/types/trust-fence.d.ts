/**
 * Browser trust fence for the /workspace routes. Mirrors the /api gateway's
 * policy: only loopback hosts and the web runtime's `trustedHosts` (LAN IP
 * literals sampled at boot plus `--trusted-host` authorities) may call the
 * plugin routes. The fence reads the live service value per request so a
 * replaced trust list takes effect without a plugin restart.
 * @module dsh-workbench-window/trust-fence
 */
import type { WorkspaceHttpRequest } from './context-types.ts';
/** Whether a hostname is a loopback literal. */
export declare function isLoopbackHostname(hostname: string): boolean;
/**
 * Decide whether a request is trusted to reach the workspace routes.
 * @param request - the incoming request.
 * @param trustedHosts - the web runtime's live trust list.
 * @returns true when the caller is loopback or listed.
 */
export declare function isTrustedApiRequest(request: WorkspaceHttpRequest, trustedHosts: readonly string[]): boolean;
//# sourceMappingURL=trust-fence.d.ts.map