/**
 * 中间列 diff 预览：加载一个 git 变更文件的统一 diff 并按 +/- 着色渲染。
 * Git 面板点击变更文件时打开此视图（而不是在窄侧边栏里看 diff）。
 * @module dsh-workbench-window/client-diff-viewer
 */
import { useEffect, useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { api, type SessionScope } from '../api.ts'
import type { WorkbenchGitDiffResult } from '../../workbench-types.ts'
import { NS } from '../locales.ts'
import css from '../styles/diff-viewer.module.css'

/** 把一段统一 diff 文本渲染成带 +/- 配色的行。 */
function DiffText({ text, t }: { text: string; t: TranslateNS<typeof NS> }) {
  const lines = text.split('\n')
  return (
    <pre className={css.diff}>
      {lines.map((line, index) => {
        const cls = line.startsWith('+') && !line.startsWith('+++')
          ? css.diffAdd
          : line.startsWith('-') && !line.startsWith('---')
            ? css.diffRemove
            : line.startsWith('@@')
              ? css.diffHunk
              : undefined
        return <div key={index} className={cls}>{line === '' ? '\u00a0' : line}</div>
      })}
      {text === '' ? t('git.emptyDiff') : null}
    </pre>
  )
}

/** Diff 视图的 props。 */
export interface DiffViewerProps {
  /** 会话作用域（sessionId + cwd）。 */
  scope: SessionScope
  /** 变更文件路径（相对会话 cwd）。 */
  path: string
  /** true=对比暂存区(index)，false=对比工作区。 */
  staged: boolean
  /** 关闭 diff 并返回文件内容视图。 */
  onClose(): void
  /** 语言包。 */
  t: TranslateNS<typeof NS>
}

/**
 * 中间列 diff 查看器：挂载时加载选中变更的 diff 并高亮渲染，
 * 顶部显示路径与关闭按钮。
 * @param props - 会话作用域、变更路径、是否暂存、关闭回调、语言包。
 */
export function DiffViewer({ scope, path, staged, onClose, t }: DiffViewerProps) {
  const [result, setResult] = useState<WorkbenchGitDiffResult | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let alive = true
    setResult(undefined)
    setError(undefined)
    void api.gitDiff(scope, path, staged)
      .then((next) => { if (alive) setResult(next) })
      .catch((caught: unknown) => {
        if (alive) setError(caught instanceof Error ? caught.message : String(caught))
      })
    return () => { alive = false }
  }, [scope.sessionId, scope.cwd, path, staged])

  return (
    <div className={css.viewer}>
      <div className={css.header}>
        <span className={css.path} title={path}>{path}</span>
        {result?.binary === true ? <span className={css.hint}>{t('git.binaryDiff')}</span> : null}
        <button type="button" className={css.close} aria-label={t('tab.close')} title={t('tab.close')} onClick={onClose}>✕</button>
      </div>
      {error !== undefined ? <div className={css.error}>{error}</div> : null}
      {result === undefined && error === undefined ? <div className={css.hint}>{t('tree.loading')}</div> : null}
      {result !== undefined ? <DiffText text={result.diff} t={t} /> : null}
    </div>
  )
}

export default DiffViewer
