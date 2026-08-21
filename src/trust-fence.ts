/**
 * Browser trust fence for the /workspace routes. Mirrors the /api gateway's
 * policy: only loopback hosts and the web runtime's `trustedHosts` (LAN IP
 * literals sampled at boot plus `--trusted-host` authorities) may call the
 * plugin routes. The fence reads the live service value per request so a
 * replaced trust list takes effect without a plugin restart.
 * @module dsh-workbench-window/trust-fence
 */
import type { WorkspaceHttpRequest } from './context-types.ts'

/** Loopback hostnames accepted without consulting the trust list. */
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0'])

/** Whether a hostname is a loopback literal. */
export function isLoopbackHostname(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname.toLowerCase())
}

/** Extract the hostname from a request Host header (`host[:port]`). */
function hostnameOf(request: WorkspaceHttpRequest): string {
  const raw = request.headers['host']
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === undefined) return ''
  // Strip an IPv6 bracket or a trailing port.
  const withoutPort = value.startsWith('[') ? value.slice(1, value.indexOf(']')) : value.split(':')[0]
  return (withoutPort ?? '').toLowerCase()
}

/**
 * Decide whether a request is trusted to reach the workspace routes.
 * @param request - the incoming request.
 * @param trustedHosts - the web runtime's live trust list.
 * @returns true when the caller is loopback or listed.
 */
export function isTrustedApiRequest(request: WorkspaceHttpRequest, trustedHosts: readonly string[]): boolean {
  const hostname = hostnameOf(request)
  if (hostname === '') return false
  if (isLoopbackHostname(hostname)) return true
  return trustedHosts.some(host => host.toLowerCase() === hostname)
}
