/**
 * Filesystem tree helpers for the workspace API: path normalization,
 * directory listing with a row bound, and cwd root resolution. Browser-safe
 * (no Node type imports here — the host casts at the boundary).
 * @module dsh-workbench-window/fs-tree
 */
import { WorkspaceError } from './wire.ts'

/** Row bound of one directory listing (protects the wire against huge levels). */
export const LIST_ENTRY_MAX = 1000

/** One projected directory row. */
export interface FsEntry {
  name: string
  path: string
  isDir: boolean
  hidden: boolean
  /** Whether the row is a symlink; `isDir` then describes the link's target. */
  isSymlink: boolean
  /** For symlinks: the target is missing or unreadable (stat failed). */
  broken: boolean
}

/** One directory listing result (may be truncated). */
export interface FsListing {
  entries: FsEntry[]
  truncated: boolean
}

/** Normalize a path to forward slashes and drop a trailing separator. */
export function normalizePath(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized
}

/** Parent directory of a path ('/' for a root, null when no parent exists). */
export function parentOf(path: string): string | null {
  const normalized = normalizePath(path)
  const index = normalized.lastIndexOf('/')
  if (index <= 0) return index === 0 ? '/' : null
  return normalized.slice(0, index)
}

/** Whether `path` is the cwd itself or inside it. */
export function isWithin(cwd: string, path: string): boolean {
  const root = normalizePath(cwd)
  const target = normalizePath(path)
  if (target === root) return true
  return target.startsWith(`${root}/`)
}

/** The display label of a cwd path (its basename, or the drive/root fallback). */
export function rootLabel(cwd: string): string {
  const normalized = normalizePath(cwd)
  const index = normalized.lastIndexOf('/')
  if (index === -1 || index === normalized.length - 1) return normalized
  return normalized.slice(index + 1)
}

/** Throw a fs-error WorkspaceError for a failed path operation. */
export function fsFailure(operation: string, path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : String(error)
  throw new WorkspaceError('fs-error', `${operation} "${path}": ${message}`, 500)
}
