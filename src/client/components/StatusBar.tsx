/**
 * 状态栏：底部蓝色条。显示当前 Git 分支与变更数（接入真实 git status），
 * 以及语言与应用名。非 git 仓库时不显示分支/变更项。
 * @module dsh-workbench-window/client-status-bar
 */
import { useEffect, useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { api, type SessionScope } from '../api.ts'
import type { WorkbenchGitStatusResult } from '../../workbench-types.ts'
import { NS } from '../locales.ts'
import css from '../styles/root.module.css'

/** 状态栏 props。 */
export interface StatusBarProps {
  /** 会话作用域（sessionId + cwd），用于拉取 git 状态。 */
  scope: SessionScope | undefined
  /** 语言包。 */
  t: TranslateNS<typeof NS>
}

/**
 * 状态栏组件。
 * @param props - 会话作用域、语言包。
 */
export function StatusBar({ scope }: StatusBarProps) {
  const [status, setStatus] = useState<WorkbenchGitStatusResult | undefined>(undefined)

  // 会话 / cwd 变化时拉取 git 状态。
  useEffect(() => {
    if (scope === undefined) { setStatus(undefined); return }
    let alive = true
    api.gitStatus(scope)
      .then((next) => { if (alive) setStatus(next) })
      .catch(() => { if (alive) setStatus(undefined) })
    return () => { alive = false }
  }, [scope])

  const changeCount = status?.changes.length ?? 0

  return (
    <footer className={css.statusbar}>
      {status?.isRepo === true ? <span className={css.statusItem}>⎇ {status.branch}</span> : null}
      {status?.isRepo === true ? <span className={css.statusItem}>⇅ {changeCount}</span> : null}
      <span className={css.statusItem}>⊗ 0 △ 0</span>
      <span className={css.statusSpacer} />
      <span className={css.statusItem}>简体中文</span>
      <span className={css.statusItem}>DeepSeek Harness</span>
    </footer>
  )
}

export default StatusBar
