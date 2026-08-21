/**
 * 侧边栏文件树：懒加载目录列表、递归展开、选择、打开编辑器；支持
 * 顶部过滤框（匹配节点 + 保留祖先，不匹配子树隐藏）和虚拟滚动
 * （固定行高，大目录只渲染可见行）。
 *
 * 展开状态存在 workspace store（`expanded` Set）；本地扁平行列表缓存
 * 每个展开目录懒加载的子节点。折叠时递归移除该目录的缓存子树，避免
 * 重复行。会话 cwd 变化时重新挂载根。
 * @module dsh-workbench-window/client-file-tree
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, type FsEntry, type SessionScope } from '../api.ts'
import { FolderIcon, FileIcon } from './icons.tsx'
import css from '../styles/sidebar.module.css'

/** 一行树节点（目录或文件）。 */
interface TreeRow {
  entry: FsEntry
  depth: number
  /** 该行直接父路径（根层级为 undefined）。 */
  parentPath?: string
  /** 展开后懒加载的子节点（仅目录）。 */
  children?: TreeRow[]
  loading?: boolean
  error?: string
}

/** 文件树 props。 */
export interface FileTreeProps {
  /** 当前会话作用域（sessionId + cwd）。 */
  scope: SessionScope | undefined
  /** 展开的绝对路径（由 workspace store 控制）。 */
  expanded: ReadonlySet<string>
  selected: string | undefined
  onToggleExpanded(path: string): void
  onSelect(path: string): void
  onOpen(path: string): void
}

/** 每行固定高度（虚拟滚动依赖，与 .row 高度一致）。 */
const ROW_HEIGHT = 26
/** 每级缩进像素。 */
const INDENT = 14
/** 滚动窗口外额外渲染的缓冲行数（减少滚动跳变）。 */
const BUFFER = 6

/** 加载一个目录层级，返回子节点行。 */
async function loadChildren(scope: SessionScope, path: string): Promise<TreeRow[]> {
  const listing = await api.fsList(scope, path)
  return listing.entries.map(entry => ({ entry, depth: 0 }))
}

/** 按过滤词筛选：保留匹配行及其所有祖先路径（不匹配子树隐藏）。 */
function filterRows(rows: TreeRow[], query: string): TreeRow[] {
  if (query === '') return rows
  const q = query.toLowerCase()
  const parentOf = new Map<string, string | undefined>()
  for (const row of rows) parentOf.set(row.entry.path, row.parentPath)
  const isMatch = (row: TreeRow): boolean => row.entry.name.toLowerCase().includes(q)
  const ancestors = (path: string): Set<string> => {
    const out = new Set<string>()
    let cur = parentOf.get(path)
    while (cur !== undefined) { out.add(cur); cur = parentOf.get(cur) }
    return out
  }
  const keep = new Set<string>()
  for (const row of rows) {
    if (!isMatch(row)) continue
    keep.add(row.entry.path)
    for (const ancestor of ancestors(row.entry.path)) keep.add(ancestor)
  }
  return rows.filter(row => keep.has(row.entry.path))
}

/**
 * 文件树组件。
 * @param props - 会话作用域、展开/选择状态、回调。
 */
export function FileTree({ scope, expanded, selected, onToggleExpanded, onSelect, onOpen }: FileTreeProps) {
  const [rows, setRows] = useState<TreeRow[] | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportH, setViewportH] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 会话 / cwd 变化时重新加载根目录。
  useEffect(() => {
    setRows(undefined)
    setError(undefined)
    setQuery('')
    setScrollTop(0)
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

  // 跟踪滚动容器高度（窗口尺寸变化时更新）。
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el === null) return
    setViewportH(el.clientHeight)
    const observer = new ResizeObserver(() => setViewportH(el.clientHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /** 移除一个目录的全部缓存后代行（折叠）。 */
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

  /** 切换目录：展开（懒加载）或折叠（丢弃缓存子节点）。 */
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

  /** 把子节点递归插入扁平行列表（父目录之下）。 */
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

  /** 过滤后的可见行列表（搜索时保留匹配 + 祖先）。 */
  const visibleRows = useMemo(() => {
    if (rows === undefined) return undefined
    return filterRows(rows, query.trim())
  }, [rows, query])

  // 虚拟滚动窗口：只渲染可见范围内的行，上下用占位撑起高度。
  const total = visibleRows?.length ?? 0
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER)
  const end = Math.min(total, Math.ceil((scrollTop + viewportH) / ROW_HEIGHT) + BUFFER)
  const windowRows = visibleRows?.slice(start, end) ?? []

  if (scope === undefined) {
    return <div className={css.empty}>选择会话以浏览文件</div>
  }
  if (loading && rows === undefined) {
    return <div className={css.empty}>加载中…</div>
  }
  if (error !== undefined && rows === undefined) {
    return <div className={css.empty}>{error}</div>
  }

  return (
    <div className={css.fileTree}>
      {/* 顶部过滤框：按文件名过滤当前树 */}
      <div className={css.filterBox}>
        <input
          className={css.filterInput}
          value={query}
          placeholder="过滤文件…"
          aria-label="过滤文件"
          onChange={(event) => { setQuery(event.target.value); setScrollTop(0) }}
        />
      </div>
      <nav ref={scrollRef} className={css.tree} aria-label="文件树"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        {total === 0 ? (
          <div className={css.empty}>{query.trim() === '' ? '空目录' : '无匹配结果'}</div>
        ) : (
          <>
            <div style={{ height: start * ROW_HEIGHT }} aria-hidden="true" />
            {windowRows.map(row => renderRow(row))}
            <div style={{ height: (total - end) * ROW_HEIGHT }} aria-hidden="true" />
          </>
        )}
      </nav>
    </div>
  )

  function renderRow(row: TreeRow): ReactNode {
    const { entry } = row
    const isDir = entry.isDir
    const open = isDir && expanded.has(entry.path)
    const selectedClass = selected === entry.path ? css.rowSelected : ''
    return (
      <div key={entry.path} style={{ height: ROW_HEIGHT }}>
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
