/**
 * 侧边栏浏览器面板：地址栏 + 导航控制（后退/前进/首页/刷新）包着一个内嵌
 * iframe。纯客户端实现（无 host 依赖）；禁止被 iframe 的站点（X-Frame-Options /
 * CSP frame-ancestors）会显示说明。
 * @module dsh-workbench-window/client-browser-panel
 */
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { NS } from '../locales.ts'
import css from '../styles/browser-panel.module.css'

/** 浏览器面板 props。 */
export interface BrowserPanelProps {
  /** 语言包。 */
  t: TranslateNS<typeof NS>
}

/** 面板打开时的默认落地页。 */
const HOME_URL = 'https://www.deepseek.com'

/**
 * 把用户输入规范化为可导航 URL：裸域名补 https://。
 * @param raw - 地址栏文本。
 * @returns 规范化后的 URL；不像 URL 的输入原样返回。
 */
export function normalizeBrowserUrl(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === '') return ''
  // 冒号后跟数字视为端口（localhost:3000），不是协议。
  if (/^[a-z][a-z0-9+.-]*:(?![0-9])/i.test(trimmed)) return trimmed
  if (/^([a-z0-9-]+\.)+[a-z]{2,}(\/|$)/i.test(trimmed) || /^localhost(:\d+)?(\/|$)/i.test(trimmed)) {
    return 'https://' + trimmed
  }
  return trimmed
}

/**
 * 侧边栏浏览器主体：地址栏 + iframe，带简单前进/后退历史。
 * @param props - 语言包。
 */
export function BrowserPanel({ t }: BrowserPanelProps): ReactNode {
  const [input, setInput] = useState(HOME_URL)
  const [address, setAddress] = useState(HOME_URL)
  const history = useRef<string[]>([])
  const cursor = useRef(-1)

  /** 导航到指定地址并记入历史。 */
  const go = (next: string): void => {
    const normalized = normalizeBrowserUrl(next)
    setInput(normalized)
    setAddress(normalized)
    const stack = history.current
    stack.splice(cursor.current + 1, stack.length, normalized)
    cursor.current = stack.length - 1
  }

  const back = (): void => {
    if (cursor.current <= 0) return
    cursor.current -= 1
    const target = history.current[cursor.current] ?? ''
    setInput(target)
    setAddress(target)
  }

  const forward = (): void => {
    if (cursor.current >= history.current.length - 1) return
    cursor.current += 1
    const target = history.current[cursor.current] ?? ''
    setInput(target)
    setAddress(target)
  }

  const reload = (): void => {
    const current = address
    setAddress('')
    // 清空 src 强制 iframe 重载。
    void current
    setAddress(current)
  }

  const submit = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') go(input)
  }

  const canBack = cursor.current > 0
  const canForward = cursor.current < history.current.length - 1

  return (
    <div className={css.browser}>
      <div className={css.bar}>
        <button type="button" className={css.nav} onClick={back} disabled={!canBack}
          aria-label={t('browser.back')} title={t('browser.back')}>←</button>
        <button type="button" className={css.nav} onClick={forward} disabled={!canForward}
          aria-label={t('browser.forward')} title={t('browser.forward')}>→</button>
        <button type="button" className={css.nav} onClick={() => go(HOME_URL)}
          aria-label={t('browser.home')} title={t('browser.home')}>⌂</button>
        <button type="button" className={css.nav} onClick={reload}
          aria-label={t('browser.reload')} title={t('browser.reload')}>⟳</button>
        <input className={css.address} type="text" value={input}
          placeholder={t('browser.addressPlaceholder')} aria-label={t('browser.addressAria')}
          onChange={(event) => setInput(event.currentTarget.value)}
          onKeyDown={submit} spellCheck={false} />
        <button type="button" className={css.go} onClick={() => go(input)} disabled={input.trim() === ''}>
          {t('browser.go')}
        </button>
      </div>
      {address === '' ? (
        <div className={css.blank}>{t('browser.blank')}</div>
      ) : (
        <iframe className={css.frame} src={address} title={t('browser.title')}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="no-referrer" />
      )}
    </div>
  )
}

export default BrowserPanel
