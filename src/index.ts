/**
 * dsh-workbench-window host half: the /workspace JSON API (session cwd, file tree
 * listing, file read/write, git status/log/diff), the /workspace/bundle
 * lazy-chunk route, and the /workspace/ws terminal upgrade. Every route
 * passes the same browser-trust fence as the /api gateway — Host-header
 * loopback or the web runtime's `trustedHosts`.
 *
 * All operations are conversation-scoped: requests carry a sessionId, the
 * session's authoritative cwd comes from the session store, and terminal
 * processes are keyed by session.
 * @module dsh-workbench-window
 */
import { open, readFile, writeFile, mkdir, rename, rm, stat, opendir } from 'node:fs/promises'
import { join as joinPath, resolve as resolvePath, sep as pathSep } from 'node:path'
import type { Context } from './context-types.ts'
import { WorkbenchTerminalHost } from './terminal.ts'
import { resolveWorkspaceConfig, type WorkspaceConfig } from './config.ts'
import { isTrustedApiRequest } from './trust-fence.ts'
import { fsFailure, isWithin, LIST_ENTRY_MAX, normalizePath, rootLabel, type FsEntry } from './fs-tree.ts'
import {
  readJsonBody, requireString, WorkspaceError, writeError, writeJson, writeOk,
} from './wire.ts'
import type { WorkspaceHttpRequest, WorkspaceHttpResponse } from './context-types.ts'

/** Plugin identity for cordis.yml rows. */
export const name = 'dsh-workbench-window'

/** Services required before mounting. */
export const inject = ['webServer', 'sessions', 'webRuntime', 'settings']

export type { WorkspaceConfig } from './config.ts'
export { resolveWorkspaceConfig } from './config.ts'

/** Media content types by extension (images served to the editor/preview). */
const MEDIA_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
}

/** Read-window ceiling for text reads, so one giant file cannot stall the UI. */
const TEXT_READ_LIMIT_BYTES = 1 * 1024 * 1024
/** NUL-probe window for binary detection, matching the tool layer's sniffing. */
const BINARY_PROBE_BYTES = 4096

/**
 * Opaque freshness token: mtime + size. Consumers must not interpret it; they
 * hand it back to fs.write to guard a save against concurrent edits.
 * @param info - the stat result.
 * @returns the token string.
 */
function versionOf(info: { mtimeMs: number; size: number }): string {
  return `${info.mtimeMs}:${info.size}`
}

/**
 * Read one text file with binary detection (NUL probe), size truncation, and
 * a freshness token, mirroring the official workbench read shape.
 * @param target - the absolute file path.
 * @returns content, binary/truncated flags, byte size, and the version token.
 */
async function readTextFile(target: string): Promise<{
  content: string
  binary: boolean
  truncated: boolean
  size: number
  version: string
}> {
  const info = await stat(target)
  const size = info.size
  const version = versionOf(info)
  const binaryOf = (buffer: Buffer): boolean => buffer.subarray(0, Math.min(buffer.length, BINARY_PROBE_BYTES)).includes(0)
  if (size > TEXT_READ_LIMIT_BYTES) {
    const buffer = Buffer.alloc(TEXT_READ_LIMIT_BYTES)
    const handle = await open(target, 'r')
    try {
      await handle.read(buffer, 0, TEXT_READ_LIMIT_BYTES, 0)
    } finally {
      await handle.close()
    }
    return {
      content: binaryOf(buffer) ? '' : buffer.toString('utf8'),
      binary: binaryOf(buffer),
      truncated: true,
      size,
      version,
    }
  }
  const buffer = await readFile(target)
  return {
    content: binaryOf(buffer) ? '' : buffer.toString('utf8'),
    binary: binaryOf(buffer),
    truncated: false,
    size,
    version,
  }
}

/** Content type for a path extension (binary-safe fallback). */
export function mediaTypeForPath(path: string): string {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase()
  return MEDIA_TYPES[ext] ?? 'application/octet-stream'
}

/** Resolve a session's authoritative working directory (session header wins). */
function sessionCwdOf(ctx: Context, sessionId: string): string {
  const session = ctx.sessions.get(sessionId)
  const headerCwd = session?.header.cwd
  return headerCwd !== undefined && headerCwd !== '' ? headerCwd : process.cwd()
}

/** Project one directory entry to the wire shape. */
async function projectEntry(cwd: string, name: string): Promise<FsEntry> {
  const path = joinPath(cwd, name)
  let isDir = false
  let isSymlink = false
  let broken = false
  try {
    const info = await stat(path)
    isDir = info.isDirectory()
    isSymlink = info.isSymbolicLink()
  } catch {
    // Unreadable entry: mark broken so the tree can render an error row.
    broken = true
  }
  return { name, path: normalizePath(path), isDir, hidden: name.startsWith('.'), isSymlink, broken }
}

/** List one directory level, capped at the configurable row bound. */
async function listDirectory(cwd: string, max: number): Promise<{ entries: FsEntry[]; truncated: boolean }> {
  let handle
  try {
    handle = await opendir(cwd)
  } catch (error) {
    throw fsFailure('list', cwd, error)
  }
  const entries: FsEntry[] = []
  let truncated = false
  for await (const dirent of handle) {
    if (entries.length >= max) { truncated = true; break }
    entries.push(await projectEntry(cwd, dirent.name))
  }
  return { entries, truncated }
}

/** Build the JSON API handler for one request path. */
function buildApi(ctx: Context, config: WorkspaceConfig, terminals: WorkbenchTerminalHost) {
  return async (req: WorkspaceHttpRequest, res: WorkspaceHttpResponse): Promise<void> => {
    try {
      const payload = await readJsonBody(req)
      const sessionId = requireString(payload, 'sessionId')
      const cwd = sessionCwdOf(ctx, sessionId)
      const method = (payload as { method?: unknown }).method
      switch (method) {
        case 'session.cwd': {
          writeOk(res, { sessionId, cwd, root: rootLabel(cwd) })
          return
        }
        case 'fs.list': {
          const path = typeof (payload as { path?: unknown }).path === 'string'
            ? (payload as { path: string }).path
            : cwd
          const target = resolvePath(cwd, path)
          if (!isWithin(cwd, target)) throw new WorkspaceError('forbidden', 'path escapes session cwd')
          const listing = await listDirectory(target, config.listEntryMax)
          writeOk(res, listing)
          return
        }
        case 'fs.read': {
          const path = requireString(payload, 'path')
          const target = resolvePath(cwd, path)
          if (!isWithin(cwd, target)) throw new WorkspaceError('forbidden', 'path escapes session cwd')
          const result = await readTextFile(target).catch(error => fsFailure('read', path, error))
          writeOk(res, { path: normalizePath(target), ...result })
          return
        }
        case 'fs.write': {
          const path = requireString(payload, 'path')
          const content = requireString(payload, 'content')
          const raw = payload as Record<string, unknown>
          const version = typeof raw.version === 'string' ? raw.version : undefined
          const target = resolvePath(cwd, path)
          if (!isWithin(cwd, target)) throw new WorkspaceError('forbidden', 'path escapes session cwd')
          if (version !== undefined) {
            const current = await stat(target).catch(() => undefined)
            if (current === undefined || versionOf(current) !== version) {
              throw new WorkspaceError('conflict', 'file changed since it was read')
            }
          }
          await writeFile(target, content, 'utf8').catch(error => fsFailure('write', path, error))
          const after = await stat(target).catch(() => undefined)
          writeOk(res, { ok: true, version: after === undefined ? undefined : versionOf(after) })
          return
        }
        case 'fs.mkdir': {
          const path = requireString(payload, 'path')
          const target = resolvePath(cwd, path)
          if (!isWithin(cwd, target)) throw new WorkspaceError('forbidden', 'path escapes session cwd')
          await mkdir(target, { recursive: true }).catch(error => fsFailure('mkdir', path, error))
          writeOk(res, { ok: true })
          return
        }
        case 'fs.rename': {
          const path = requireString(payload, 'path')
          const nextPath = requireString(payload, 'nextPath')
          const from = resolvePath(cwd, path)
          const to = resolvePath(cwd, nextPath)
          if (!isWithin(cwd, from) || !isWithin(cwd, to)) {
            throw new WorkspaceError('forbidden', 'path escapes session cwd')
          }
          await rename(from, to).catch(error => fsFailure('rename', path, error))
          writeOk(res, { ok: true })
          return
        }
        case 'fs.remove': {
          const path = requireString(payload, 'path')
          const recursive = (payload as { recursive?: unknown }).recursive === true
          const target = resolvePath(cwd, path)
          if (!isWithin(cwd, target)) throw new WorkspaceError('forbidden', 'path escapes session cwd')
          const info = await stat(target).catch(() => undefined)
          if (info === undefined) throw new WorkspaceError('not-found', `"${path}" does not exist`, 404)
          if (info.isDirectory() && !recursive) {
            throw new WorkspaceError('bad-request', `"${path}" is a directory; pass recursive`)
          }
          await rm(target, { recursive: info.isDirectory(), force: true }).catch(error => fsFailure('remove', path, error))
          writeOk(res, { ok: true })
          return
        }
        case 'terminal.spawn': {
          const cwdArg = (payload as { cwd?: unknown }).cwd
          let spawned
          try {
            spawned = terminals.spawn(sessionId, typeof cwdArg === 'string' ? cwdArg : undefined)
          } catch (error) {
            throw new WorkspaceError('pty-error', error instanceof Error ? error.message : String(error))
          }
          writeOk(res, spawned)
          return
        }
        case 'terminal.write': {
          const id = requireString(payload, 'id')
          const data = requireString(payload, 'data')
          try {
            terminals.write(sessionId, id, data)
          } catch (error) {
            throw new WorkspaceError('pty-error', error instanceof Error ? error.message : String(error))
          }
          writeOk(res, { ok: true })
          return
        }
        case 'terminal.read': {
          const id = requireString(payload, 'id')
          try {
            const result = terminals.read(sessionId, id)
            writeOk(res, result)
          } catch (error) {
            throw new WorkspaceError('pty-error', error instanceof Error ? error.message : String(error))
          }
          return
        }
        case 'terminal.close': {
          const id = requireString(payload, 'id')
          await terminals.close(sessionId, id)
          writeOk(res, { ok: true })
          return
        }
        case 'terminal.closeSession': {
          await terminals.closeSession(sessionId)
          writeOk(res, { ok: true })
          return
        }
        default:
          throw new WorkspaceError('bad-request', `unknown method "${String(method)}"`)
      }
    } catch (error) {
      writeError(res, error)
    }
  }
}

/**
 * Plugin body: register the JSON API, the media route, and the lazy-bundle
 * route, all behind the browser-trust fence.
 * @param ctx - the host cordis context.
 * @param config - optional cordis.yml config section.
 */
export function apply(ctx: Context, config?: Partial<WorkspaceConfig>): void {
  const resolved = resolveWorkspaceConfig(config)
  const terminals = new WorkbenchTerminalHost()
  const fence = (req: WorkspaceHttpRequest): boolean => isTrustedApiRequest(req, ctx.webRuntime.trustedHosts)

  // JSON API: POST /workspace/api
  ctx.effect(() => {
    const off = ctx.webServer.register({
      kind: 'prefix',
      path: '/workspace/api',
      handler: async (req, res) => {
        if (!fence(req)) {
          writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'forbidden' } })
          return
        }
        await buildApi(ctx, resolved, terminals)(req, res)
      },
    })
    return () => { off(); void terminals.dispose() }
  }, 'dsh-workbench-window: json api')

  // Media route: GET /workspace/file?sessionId=&path= (images only)
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/workspace/file',
    handler: async (req, res) => {
      if (!fence(req)) { writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'forbidden' } }); return }
      try {
        const url = new URL(req.url ?? '/workspace/file', 'http://localhost')
        const sessionId = url.searchParams.get('sessionId') ?? ''
        const path = url.searchParams.get('path') ?? ''
        if (sessionId === '' || path === '') throw new WorkspaceError('bad-request', 'missing sessionId or path')
        const cwd = sessionCwdOf(ctx, sessionId)
        const target = resolvePath(cwd, path)
        if (!isWithin(cwd, target)) throw new WorkspaceError('forbidden', 'path escapes session cwd')
        const data = await readFile(target).catch(error => fsFailure('read', path, error))
        res.writeHead(200, { 'content-type': mediaTypeForPath(path) })
        res.end(data)
      } catch (error) {
        writeError(res, error)
      }
    },
  }), 'dsh-workbench-window: media route')
}
