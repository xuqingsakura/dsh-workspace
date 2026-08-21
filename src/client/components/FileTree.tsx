/**
 * Sidebar file tree: lazy directory listing via the workspace API, recursive
 * expansion, selection, and open-in-editor. Re-roots when the session cwd
 * changes (session switch follows the workspace store).
 *
 * Expansion state lives in the workspace store (`expanded` Set); the local
 * flat row list caches the lazily loaded children of each expanded directory.
 * Collapsing removes that directory's cached subtree from the list, so a
 * later re-expand re-inserts it exactly once (no duplicate rows).
 * @module dsh-workbench-window/client-file-tree
 */
import { useEffect, useState, type ReactNode } from 'react'
import { api, type FsEntry, type SessionScope } from '../api.ts'
import { FolderIcon, FileIcon } from './icons.tsx'
import css from '../styles/sidebar.module.css'

/** One tree row (directory or file). */
interface TreeRow {
  entry: FsEntry
  depth: number
  /** Direct parent path of this row (undefined for the tree root level). */
  parentPath?: string
  /** Children listed lazily once expanded (directories only). */
  children?: TreeRow[]
  loading?: boolean
  error?: string
}

/** Props for the file tree. */
export interface FileTreeProps {
  /** The active session scope (sessionId + cwd). */
  scope: SessionScope | undefined
  /** Expanded absolute paths (controlled by the workspace store). */
  expanded: ReadonlySet<string>
  selected: string | undefined
  onToggleExpanded(path: string): void
  onSelect(path: string): void
  onOpen(path: string): void
}

/** Row indentation per depth level. */
const INDENT = 14

/** Load one directory level, returning child rows. */
async function loadChildren(scope: SessionScope, path: string): Promise<TreeRow[]> {
  const listing = await api.fsList(scope, path)
  return listing.entries.map(entry => ({ entry, depth: 0 }))
}

/**
 * The file tree component.
 * @param props - session scope, expansion/selection state, and callbacks.
 */
export function FileTree({ scope, expanded, selected, onToggleExpanded, onSelect, onOpen }: FileTreeProps) {
  const [rows, setRows] = useState<TreeRow[] | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  // Re-root on session/cwd change.
  useEffect(() => {
    setRows(undefined)
    setError(undefined)
    if (scope === undefined) return
    let cancelled = false
    setLoading(true)
    api.fsList(scope, '')
      .then((listing) => {
        if (cancelled) return
        setRows(listing.entries.map(entry => ({ entry, depth: 0 })))
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [scope?.sessionId, scope?.cwd])

  /** Remove every cached descendant row of a directory (collapse). */
  const removeSubtree = (all: TreeRow[], parentPath: string): TreeRow[] => {
    const doomed = new Set<string>()
    const queue = [parentPath]
    while (queue.length > 0) {
      const current = queue.shift() as string
      for (const row of all) {
        if (row.parentPath === current) {
          doomed.add(row.entry.path)
          queue.push(row.entry.path)
        }
      }
    }
    return all.filter(row => !doomed.has(row.entry.path))
  }

  /** Toggle a directory: expand (lazy load) or collapse (drop cached children). */
  const toggle = async (row: TreeRow): Promise<void> => {
    const { path } = row.entry
    if (expanded.has(path)) {
      onToggleExpanded(path)
      setRows(prev => prev === undefined ? prev : removeSubtree(prev, path))
      return
    }
    onToggleExpanded(path)
    if (scope === undefined) return
    try {
      const children = await loadChildren(scope, path)
      setRows(prev => prev === undefined ? prev : patchRows(prev, path, children))
    } catch (err) {
      setRows(prev => prev === undefined ? prev : patchRows(prev, path, [], err instanceof Error ? err.message : String(err)))
    }
  }

  /** Recursively insert children into the flat row list under a parent path. */
  const patchRows = (all: TreeRow[], parentPath: string, children: TreeRow[], error?: string): TreeRow[] => {
    const out: TreeRow[] = []
    for (const row of all) {
      out.push(row)
      if (row.entry.path === parentPath && row.entry.isDir) {
        if (children.length > 0) {
          for (const child of children) out.push({ ...child, depth: row.depth + 1, parentPath })
        } else if (error !== undefined) {
          out.push({ entry: { name: error, path: `${parentPath}/#error`, isDir: false, hidden: false, isSymlink: false, broken: true }, depth: row.depth + 1, parentPath, error })
        } else {
          out.push({ entry: { name: '(空)', path: `${parentPath}/#empty`, isDir: false, hidden: false, isSymlink: false, broken: false }, depth: row.depth + 1, parentPath })
        }
      }
    }
    return out
  }

  if (scope === undefined) {
    return <div className={css.empty}>选择会话以浏览文件</div>
  }
  if (loading && rows === undefined) {
    return <div className={css.empty}>加载中…</div>
  }
  if (error !== undefined && rows === undefined) {
    return <div className={css.empty}>{error}</div>
  }
  if (rows === undefined || rows.length === 0) {
    return <div className={css.empty}>空目录</div>
  }

  return (
    <nav className={css.tree} aria-label="文件树">
      {rows.map(row => renderRow(row))}
    </nav>
  )

  function renderRow(row: TreeRow): ReactNode {
    const { entry } = row
    const isDir = entry.isDir
    const open = isDir && expanded.has(entry.path)
    const selectedClass = selected === entry.path ? css.rowSelected : ''
    return (
      <div key={entry.path}>
        <button
          type="button"
          className={`${css.row} ${selectedClass}`}
          style={{ paddingLeft: 8 + row.depth * INDENT }}
          onClick={() => {
            if (isDir) void toggle(row)
            else { onSelect(entry.path); onOpen(entry.path) }
          }}
          title={entry.path}
        >
          {isDir ? <span className={`${css.twisty} ${open ? '' : css.twistyClosed}`} aria-hidden="true">▼</span> : <span className={css.twisty} aria-hidden="true" />}
          <span className={css.icon}>
            {isDir ? <FolderIcon open={open} /> : <FileIcon name={entry.name} />}
          </span>
          <span className={css.name}>{entry.name}</span>
        </button>
      </div>
    )
  }
}
