/**
 * 对话区顶部会话切换器：显示当前会话标题，点击展开会话列表下拉并切换。
 * 使用宽松结构类型（不依赖 api-remotes，避免 client bundle purity 门禁）。
 * @module dsh-workbench-window/client-session-switcher
 */
import { useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { NS } from '../locales.ts'
import css from '../styles/session-switcher.module.css'

/** 会话切换器 props。 */
export interface SessionSwitcherProps {
  /** 会话 id 列表（Host 顺序）。 */
  ids: string[]
  /** 会话摘要映射（id -> 摘要，含 title）。 */
  byId: Record<string, { title?: string }>
  /** 当前会话 id。 */
  current: string | undefined
  /** 切换当前会话。 */
  onOpen(id: string): void
  /** 语言包。 */
  t: TranslateNS<typeof NS>
}

/**
 * 会话切换器主体：当前会话按钮 + 下拉列表。
 * @param props - 会话列表、当前会话、切换回调、语言包。
 */
export function SessionSwitcher({ ids, byId, current, onOpen, t }: SessionSwitcherProps) {
  const [open, setOpen] = useState(false)
  const title = current !== undefined ? (byId[current]?.title ?? current) : '选择会话'
  return (
    <div className={css.wrap}>
      <button type="button" className={css.button} title={t('session.switch')} aria-label={t('session.switch')}
        onClick={() => setOpen(o => !o)}>
        <span className={css.title}>{title}</span>
        <span className={css.chevron}>▾</span>
      </button>
      {open ? (
        <div className={css.menu}>
          {ids.length === 0 ? <div className={css.hint}>暂无会话</div> : null}
          {ids.map(id => (
            <button key={id} type="button" className={`${css.item} ${id === current ? css.active : ''}`}
              onClick={() => { onOpen(id); setOpen(false) }}>
              {byId[id]?.title ?? id}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default SessionSwitcher
