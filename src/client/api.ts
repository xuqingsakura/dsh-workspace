/**
 * Typed fetch wrapper over the /workspace JSON API. Every call posts to
 * `/workspace/api` with the sessionId. Failures surface as
 * {@link WorkspaceApiError} with the wire code.
 * @module dsh-workbench-window/client-api
 */

/** One wire failure. */
export class WorkspaceApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

import type { WorkbenchTerminalReadResult, WorkbenchTerminalSpawnResult } from '../workbench-types.ts'

/** One directory entry (host fs-tree shape). */
export interface FsEntry {
  name: string
  path: string
  isDir: boolean
  hidden: boolean
  isSymlink: boolean
  broken: boolean
}

/** One directory listing result. */
export interface FsListing {
  entries: FsEntry[]
  truncated: boolean
}

/** The session scope threaded through every call. */
export interface SessionScope {
  sessionId: string
  cwd?: string
}

/** One request's session scope payload (cwd only when known). */
function scopePayload(scope: SessionScope, extra: Record<string, unknown>): Record<string, unknown> {
  return { sessionId: scope.sessionId, ...(scope.cwd !== undefined && scope.cwd !== '' ? { cwd: scope.cwd } : {}), ...extra }
}

async function call<T>(method: string, payload: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch('/workspace/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...payload, method }),
      signal,
    })
  } catch (error) {
    throw new WorkspaceApiError('network', error instanceof Error ? error.message : String(error))
  }
  const parsed: { ok?: boolean; value?: unknown; error?: { code?: string; message?: string } } | null
    = await response.json().catch(() => null)
  if (!response.ok || parsed === null || parsed.ok !== true || parsed.value === undefined) {
    throw new WorkspaceApiError(
      parsed?.error?.code ?? 'http',
      parsed?.error?.message ?? `HTTP ${response.status}`,
    )
  }
  return parsed.value as T
}

/** The workspace API surface (session scope threaded through every call). */
export const api = {
  sessionCwd: (scope: SessionScope, signal?: AbortSignal) =>
    call<{ sessionId: string; cwd: string; root: string }>('session.cwd', scopePayload(scope, {}), signal),
  fsList: (scope: SessionScope, path: string, signal?: AbortSignal) =>
    call<FsListing>('fs.list', scopePayload(scope, { path }), signal),
  fsRead: (scope: SessionScope, path: string, signal?: AbortSignal) =>
    call<{ path: string; content: string; binary: boolean; truncated: boolean; size: number; version: string }>('fs.read', scopePayload(scope, { path }), signal),
  fsWrite: (scope: SessionScope, path: string, content: string, version?: string) =>
    call<{ ok: true; version?: string }>('fs.write', scopePayload(scope, { path, content, ...(version !== undefined ? { version } : {}) })),
  fsMkdir: (scope: SessionScope, path: string) =>
    call<{ ok: true }>('fs.mkdir', scopePayload(scope, { path })),
  fsRename: (scope: SessionScope, path: string, nextPath: string) =>
    call<{ ok: true }>('fs.rename', scopePayload(scope, { path, nextPath })),
  fsRemove: (scope: SessionScope, path: string, recursive: boolean) =>
    call<{ ok: true }>('fs.remove', scopePayload(scope, { path, recursive })),
  terminalSpawn: (scope: SessionScope, cwd?: string) =>
    call<WorkbenchTerminalSpawnResult>('terminal.spawn', scopePayload(scope, cwd !== undefined && cwd !== '' ? { cwd } : {})),
  terminalWrite: (scope: SessionScope, id: string, data: string) =>
    call<{ ok: true }>('terminal.write', scopePayload(scope, { id, data })),
  terminalRead: (scope: SessionScope, id: string) =>
    call<WorkbenchTerminalReadResult>('terminal.read', scopePayload(scope, { id })),
  terminalClose: (scope: SessionScope, id: string) =>
    call<{ ok: true }>('terminal.close', scopePayload(scope, { id })),
  terminalCloseSession: (scope: SessionScope) =>
    call<{ ok: true }>('terminal.closeSession', scopePayload(scope, {})),
}

/** Absolute URL of the media route for one path (images only). */
export function mediaUrl(scope: SessionScope, path: string): string {
  const params = new URLSearchParams({ sessionId: scope.sessionId, path })
  if (scope.cwd !== undefined && scope.cwd !== '') params.set('cwd', scope.cwd)
  return `/workspace/file?${params.toString()}`
}
