/**
 * 侧边栏 Git 面板（VSCode 风格）：分支选择、提交历史、变更分组
 * （已暂存 / 更改 / 未跟踪，可折叠 + 滚动）、提交信息与按钮。
 * 点击变更文件在中间列打开 diff（onOpenDiff）。
 *
 * 布局自上而下：标题行 -> 分支选择 -> 提交历史（固定高度，始终可见）
 * -> 变更列表（滚动区，可折叠）-> 提交 composer（竖排）。
 * @module dsh-workbench-window/client-git-panel
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { api, type SessionScope } from '../api.ts'
import type {
  WorkbenchGitBranch,
  WorkbenchGitChange,
  WorkbenchGitLogEntry,
  WorkbenchGitStatusResult,
} from '../../workbench-types.ts'
import { NS } from '../locales.ts'
import css from '../styles/git-panel.module.css'

/** Git 面板 props。 */
export interface GitPanelProps {
  /** 会话作用域（sessionId + cwd），undefined 时显示空提示。 */
  scope: SessionScope | undefined
  /** 点击变更文件后打开该文件的 diff（中间列）。 */
  onOpenDiff(path: string, staged: boolean): void
  /** 语言包。 */
  t: TranslateNS<typeof NS>
}

/** 把变更列表分成 已暂存 / 更改 / 未跟踪 三组。 */
function groupChanges(changes: WorkbenchGitChange[]): {
  staged: WorkbenchGitChange[]
  unstaged: WorkbenchGitChange[]
  untracked: WorkbenchGitChange[]
} {
  const staged: WorkbenchGitChange[] = []
  const unstaged: WorkbenchGitChange[] = []
  const untracked: WorkbenchGitChange[] = []
  for (const change of changes) {
    if (change.kind === 'untracked') untracked.push(change)
    else if (change.staged) staged.push(change)
    else unstaged.push(change)
  }
  return { staged, unstaged, untracked }
}

/** 变更类型的短标签（VSCode 风格角标）。 */
function kindLabel(kind: WorkbenchGitChange['kind'], t: TranslateNS<typeof NS>): string {
  switch (kind) {
    case 'added': return 'A'
    case 'modified': return 'M'
    case 'deleted': return 'D'
    case 'renamed': return 'R'
    case 'untracked': return '?'
    /* 闭合的线类型 */
    default: return t('git.unknown')
  }
}

/**
 * Git 面板主体。
 * @param props - 会话作用域、打开 diff 回调、语言包。
 */
export function GitPanel({ scope, onOpenDiff, t }: GitPanelProps) {
  const [status, setStatus] = useState<WorkbenchGitStatusResult | undefined>(undefined)
  const [log, setLog] = useState<WorkbenchGitLogEntry[]>([])
  const [branches, setBranches] = useState<WorkbenchGitBranch[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  /** 用户折叠的变更分组。 */
  const [collapsed, setCollapsed] = useState<ReadonlySet<'staged' | 'unstaged' | 'untracked'>>(() => new Set())
  /** 记录最近一次加载是否成功（避免在非仓库目录反复请求）。 */
  const lastScope = useRef<string | undefined>(undefined)

  const sessionId = scope?.sessionId

  /** 拉取 status / log / branches 三份投影。 */
  const refresh = useCallback(async (): Promise<void> => {
    if (scope === undefined) return
    setRefreshing(true)
    setError(undefined)
    try {
      const [nextStatus, nextLog, nextBranches] = await Promise.all([
        api.gitStatus(scope),
        api.gitLog(scope, 30),
        api.gitBranches(scope),
      ])
      setStatus(nextStatus)
      setLog(nextLog)
      setBranches(nextBranches)
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setRefreshing(false)
    }
  }, [scope])

  // 会话 / cwd 变化时刷新；不重复请求同一作用域。
  useEffect(() => {
    if (scope === undefined) return
    const key = `${sessionId}:${scope.cwd ?? ''}`
    if (lastScope.current === key) return
    lastScope.current = key
    void refresh()
  }, [sessionId, scope?.cwd, refresh])

  /** 执行一次变更操作并刷新。 */
  const run = async (action: () => Promise<unknown>): Promise<void> => {
    setBusy(true)
    setError(undefined)
    try {
      await action()
      await refresh()
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  const stageAll = (): void => { void run(() => api.gitAdd(scope ?? { sessionId: '' }, [])) }
  const discardAll = (): void => {
    const unstaged = status?.changes.filter(change => !change.staged) ?? []
    if (unstaged.length === 0) return
    if (!window.confirm(t('git.discardConfirm', { count: String(unstaged.length) }))) return
    void run(() => api.gitRestore(scope ?? { sessionId: '' }, unstaged.map(change => change.path), false))
  }
  const commit = (): void => {
    const trimmed = message.trim()
    if (trimmed.length === 0) return
    void run(async () => {
      await api.gitCommit(scope ?? { sessionId: '' }, trimmed)
      setMessage('')
    })
  }
  const checkout = (branch: string): void => {
    if (branch === status?.branch) return
    void run(() => api.gitCheckout(scope ?? { sessionId: '' }, branch))
  }
  const toggleGroup = (group: 'staged' | 'unstaged' | 'untracked'): void => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const groups = useMemo(() => status === undefined ? undefined : groupChanges(status.changes), [status])

  if (scope === undefined) {
    return <div className={css.empty}>{t('tree.loading')}</div>
  }

  return (
    <div className={css.panel}>
      {/* 标题行：标题 + 刷新 + 更多操作 */}
      <div className={css.header}>
        <span className={css.title}>{t('git.title')}</span>
        <span className={css.spacer} />
        <button type="button" className={css.action} disabled={refreshing || busy} title={t('git.refresh')} aria-label={t('git.refresh')}
          onClick={() => void refresh()}>{refreshing ? t('git.refreshing') : t('git.refresh')}</button>
        {status?.isRepo === true ? (
          <div className={css.more}>
            <button type="button" className={css.action} disabled={busy} title={t('git.more')} aria-label={t('git.more')}
              onClick={() => setMoreOpen(open => !open)}>⋯</button>
            {moreOpen ? (
              <div className={css.menu}>
                {[
                  { id: 'stageAll', label: t('git.stageAll'), danger: false },
                  { id: 'discardAll', label: t('git.discardAll'), danger: true },
                  { id: 'fetch', label: t('git.fetch'), danger: false },
                  { id: 'pull', label: t('git.pull'), danger: false },
                  { id: 'push', label: t('git.push'), danger: false },
                ].map(item => (
                  <button key={item.id} type="button"
                    className={`${css.menuItem} ${item.danger ? css.menuItemDanger : ''}`}
                    onClick={() => {
                      setMoreOpen(false)
                      if (item.id === 'stageAll') stageAll()
                      else if (item.id === 'discardAll') discardAll()
                      else if (item.id === 'fetch') void run(() => api.gitFetch(scope, undefined))
                      else if (item.id === 'pull') void run(() => api.gitPull(scope))
                      else if (item.id === 'push') void run(() => api.gitPush(scope, undefined, undefined))
                    }}>{item.label}</button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {error !== undefined ? <div className={css.error}>{error}</div> : null}

      {/* 分支选择：标题下面，单独一行 */}
      {status?.isRepo === true ? (
        <div className={css.branchRow}>
          <select className={css.select} value={status.branch} disabled={busy}
            aria-label={t('git.branchAria')}
            onChange={(event) => checkout(event.target.value)}>
            {branches.map(branch => (
              <option key={branch.name} value={branch.name}>{branch.current ? `✓ ${branch.name}` : branch.name}</option>
            ))}
          </select>
        </div>
      ) : null}

      {status !== undefined && !status.isRepo ? (
        <div className={css.empty}>{t('git.noRepo')}</div>
      ) : (
        <>
          {/* 提交历史：固定高度，始终显示在变更列表之上 */}
          <div className={css.history}>
            <div className={css.sectionTitle}>{t('git.history')}</div>
            {log.length === 0 ? (
              <div className={css.hint}>{t('git.noCommits')}</div>
            ) : (
              <ul className={css.historyList}>
                {log.map(entry => (
                  <li key={entry.hash} className={css.historyRow}
                    title={`${entry.hash}\n${entry.author} · ${entry.date}`}>
                    <span className={css.hash}>{entry.shortHash}</span>
                    <span className={css.msg}>{entry.message}</span>
                    {entry.parents.length > 1 ? <span className={css.mergeTag}>{t('git.merge')}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 变更列表：滚动区，可折叠分组 */}
          <div className={css.changes}>
            {groups === undefined ? (
              <div className={css.hint}>{t('git.loading')}</div>
            ) : groups.staged.length + groups.unstaged.length + groups.untracked.length === 0 ? (
              <div className={css.hint}>{t('git.clean')}</div>
            ) : (
              <>
                {groups.staged.length > 0 ? (
                  <GroupSection label={t('git.staged')} count={groups.staged.length}
                    collapsed={collapsed.has('staged')} onToggle={() => toggleGroup('staged')}>
                    {groups.staged.map(change => (
                      <ChangeRow key={change.path} change={change}
                        onOpenDiff={() => onOpenDiff(change.path, true)}
                        onUnstage={() => void run(() => api.gitRestore(scope, [change.path], true))}
                        t={t} />
                    ))}
                  </GroupSection>
                ) : null}
                {groups.unstaged.length > 0 ? (
                  <GroupSection label={t('git.unstaged')} count={groups.unstaged.length}
                    collapsed={collapsed.has('unstaged')} onToggle={() => toggleGroup('unstaged')}>
                    {groups.unstaged.map(change => (
                      <ChangeRow key={change.path} change={change}
                        onOpenDiff={() => onOpenDiff(change.path, false)}
                        onStage={() => void run(() => api.gitAdd(scope, [change.path]))}
                        onDiscard={() => {
                          if (window.confirm(t('git.discardConfirm', { count: '1' }))) {
                            void run(() => api.gitRestore(scope, [change.path], false))
                          }
                        }}
                        t={t} />
                    ))}
                  </GroupSection>
                ) : null}
                {groups.untracked.length > 0 ? (
                  <GroupSection label={t('git.untracked')} count={groups.untracked.length}
                    collapsed={collapsed.has('untracked')} onToggle={() => toggleGroup('untracked')}>
                    {groups.untracked.map(change => (
                      <ChangeRow key={change.path} change={change}
                        onOpenDiff={() => onOpenDiff(change.path, false)}
                        onStage={() => void run(() => api.gitAdd(scope, [change.path]))}
                        t={t} />
                    ))}
                  </GroupSection>
                ) : null}
              </>
            )}
          </div>

          {/* 提交 composer：输入框 + 提交按钮（竖排） */}
          <div className={css.composer}>
            <input className={css.commitInput} value={message} disabled={busy}
              placeholder={t('git.commitPlaceholder')}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) commit() }} />
            <button type="button" className={css.commitButton} disabled={busy || message.trim() === ''} onClick={commit}>
              {t('git.commit')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/** 可折叠变更分组：文件夹式表头（箭头折叠整组）。 */
function GroupSection({ label, count, collapsed, onToggle, children }: {
  label: string
  count: number
  collapsed: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <>
      <button type="button" className={css.groupHeader} onClick={onToggle} aria-expanded={!collapsed}>
        <span className={css.groupArrow} aria-hidden="true">{collapsed ? '▶' : '▼'}</span>
        <span>{label} ({count})</span>
      </button>
      {collapsed ? null : children}
    </>
  )
}

/** 一行变更：单击打开 diff，行尾提供 暂存/撤销/丢弃 操作。 */
function ChangeRow({ change, onOpenDiff, onStage, onUnstage, onDiscard, t }: {
  change: WorkbenchGitChange
  onOpenDiff: () => void
  onStage?: () => void
  onUnstage?: () => void
  onDiscard?: () => void
  t: TranslateNS<typeof NS>
}) {
  return (
    <div className={css.row} onClick={onOpenDiff} title={t('git.openDiffInViewer')}>
      <span className={css.kindBadge} data-kind={change.kind}>{kindLabel(change.kind, t)}</span>
      <span className={css.path} title={change.path}>{change.path}</span>
      <span className={css.rowActions}>
        {onStage ? <button type="button" className={css.rowAction} title={t('git.stage')}
          onClick={(event) => { event.stopPropagation(); onStage() }}>+</button> : null}
        {onUnstage ? <button type="button" className={css.rowAction} title={t('git.unstage')}
          onClick={(event) => { event.stopPropagation(); onUnstage() }}>−</button> : null}
        {onDiscard ? <button type="button" className={css.rowActionDanger} title={t('git.discard')}
          onClick={(event) => { event.stopPropagation(); onDiscard() }}>✕</button> : null}
      </span>
    </div>
  )
}

export default GitPanel
