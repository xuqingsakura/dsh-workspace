/**
 * Wire helpers for the /workspace JSON API: bounded body reading, response
 * writing, and the shared error envelope. Every API method returns
 * `{ok: true, value}` on success and `{ok: false, error: {code, message}}`
 * (HTTP 4xx/5xx matching the code) on failure.
 * @module dsh-workbench-window/wire
 */
import type { WorkspaceHttpRequest, WorkspaceHttpResponse } from './context-types.ts'

/** Machine-readable error codes of the workspace API. */
export type WorkspaceErrorCode =
  | 'bad-request'
  | 'not-found'
  | 'forbidden'
  | 'method-error'
  | 'conflict'
  | 'fs-error'
  | 'git-error'
  | 'pty-error'
  | 'internal'

/** One API failure with its wire code and HTTP status. */
export class WorkspaceError extends Error {
  constructor(
    readonly code: WorkspaceErrorCode,
    message: string,
    readonly status = 400,
  ) {
    super(message)
  }
}

/** Body size bound of one JSON request (defense against unbounded reads). */
const MAX_BODY_BYTES = 1 << 20

/** Success envelope of one API method. */
export interface WorkspaceOk<T> { ok: true; value: T }

/** Failure envelope of one API method. */
export interface WorkspaceErr { ok: false; error: { code: WorkspaceErrorCode; message: string } }

/** Read and parse the JSON request body (bounded; malformed → bad-request). */
export async function readJsonBody(req: WorkspaceHttpRequest): Promise<unknown> {
  const chunks: Uint8Array[] = []
  let total = 0
  for await (const chunk of req) {
    const bytes = typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk
    total += bytes.length
    if (total > MAX_BODY_BYTES) {
      throw new WorkspaceError('bad-request', 'request body too large')
    }
    chunks.push(bytes)
  }
  const text = new TextDecoder().decode(concatBytes(chunks))
  if (text.trim() === '') return {}
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new WorkspaceError('bad-request', 'request body is not valid JSON')
  }
}

/** Concatenate byte chunks without a Node Buffer dependency (browser-safe). */
function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const size = chunks.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(size)
  let offset = 0
  for (const part of chunks) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

/** Write a JSON response with the given status. */
export function writeJson(res: WorkspaceHttpResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

/** Write the success envelope. */
export function writeOk(res: WorkspaceHttpResponse, value: unknown): void {
  writeJson(res, 200, { ok: true, value })
}

/** Write the failure envelope for any thrown value (unknown → internal 500). */
export function writeError(res: WorkspaceHttpResponse, error: unknown): void {
  if (error instanceof WorkspaceError) {
    writeJson(res, error.status, { ok: false, error: { code: error.code, message: error.message } })
    return
  }
  const message = error instanceof Error ? error.message : String(error)
  writeJson(res, 500, { ok: false, error: { code: 'internal', message } })
}

/** Narrow an unknown payload value to a string, else throw bad-request. */
export function requireString(payload: unknown, key: string): string {
  const record = payload as Record<string, unknown> | null
  const value = record?.[key]
  if (typeof value !== 'string' || value === '') {
    throw new WorkspaceError('bad-request', `missing or invalid "${key}"`)
  }
  return value
}
