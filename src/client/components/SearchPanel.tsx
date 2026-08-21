/**
 * 侧边栏搜索视图：在当前会话 cwd 下按文件名递归搜索，结果点击后在
 * 编辑区打开。输入做 300ms 防抖，避免频繁调用 host API。
 * @module dsh-workbench-window/client-search-panel
 */
import { useEffect, useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { api, type SessionScope } from '../api.ts'
import type { WorkbenchSearchResult } from '../../workbench-types.ts'
import { NS } from '../locales.ts'
import css from '../styles/search-panel.module.css'

/** 搜索面板 props。 */
export interface SearchPanelProps {
  /** 会话作用域（sessionId + cwd）。 */
  scope: SessionScope | undefined
  /** 点击结果后打开文件（编辑区）。 */
  onOpen(path: string): void
  /** 语言包。 */
  t: TranslateNS<typeof NS>
}

/**
 * 搜索面板主体：顶部输入框 + 结果列表。
 * @param props - 会话作用域、打开文件回调、语言包。
 */
export function SearchPanel({ scope, onOpen, t }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WorkbenchSearchResult[] | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  // 防抖搜索：300ms 后调用 host fs.search。
  useEffect(() => {
    if (scope === undefined || query.trim() === '') {
      setResults(undefined)
      setError(undefined)
      return
    }
    let cancelled = false
    setBusy(true)
    const timer = setTimeout(() => {
      api.fsSearch(scope, query.trim())
        .then(({ results }) => { if (!cancelled) { setResults(results); setError(undefined) } })
        .catch((caught: unknown) => { if (!cancelled) setError(caught instanceof Error ? caught.message : String(caught)) })
        .finally(() => { if (!cancelled) setBusy(false) })
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query, scope])

  return (
    <div className={css.panel}>
      <div className={css.searchBox}>
        <input className={css.input} value={query} placeholder="搜索文件…" aria-label="搜索文件"
          onChange={(event) => setQuery(event.target.value)} />
      </div>
      {error !== undefined ? <div className={css.error}>{error}</div> : null}
      {query.trim() === '' ? (
        <div className={css.hint}>{t('search.empty')}</div>
      ) : busy && results === undefined ? (
        <div className={css.hint}>{t('git.loading')}</div>
      ) : results !== undefined && results.length === 0 ? (
        <div className={css.hint}>无匹配结果</div>
      ) : (
        <ul className={css.list}>
          {(results ?? []).map(item => (
            <li key={item.path}>
              <button type="button" className={css.row} title={item.path}
                onClick={() => onOpen(item.path)}>
                <span className={css.name}>{item.name}</span>
                <span className={css.path}>{item.path}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default SearchPanel
