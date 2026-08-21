/**
 * Bottom terminal (prototype style): a single persistent shell per session —
 * output strip with prompt + blinking cursor, command input with Up/Down
 * history, a clear button, and an x button that closes the whole panel.
 * The shell owns the prompt and command echo; the panel is a thin pipe to
 * the terminal verbs (spawn/write/read), polling output incrementally.
 * @module dsh-workbench-window/client-terminal-panel
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { api } from '../api.ts'
import { parseAnsi } from '../ansi.ts'
import { NS } from '../locales.ts'
import css from '../styles/terminal.module.css'

/** Poll cadence for incremental output reads. */
const POLL_MS = 200

/** Props for the terminal panel. */
export interface TerminalPanelProps {
  /** The conversation whose cwd the shell starts in. */
  sessionId: string
  /** Close the whole bottom terminal panel. */
  onClose(): void
  /** Locale-bound copy. */
  t: TranslateNS<typeof NS>
}

/** The prototype-style single-terminal panel. */
export function TerminalPanel({ sessionId, onClose, t }: TerminalPanelProps) {
  const [output, setOutput] = useState('')
  const [value, setValue] = useState('')
  const [cwd, setCwd] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const idRef = useRef<string | undefined>(undefined)
  const outputRef = useRef('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId
  const inputRef = useRef<HTMLInputElement>(null)

  // The block cursor hugs the last character, so the input must be exactly as
  // wide as its rendered text. A hidden mirror measures the real width:
  // sizing by `value.length ch` clips CJK/wide glyphs, which are wider than
  // one ch (the "0" advance) in monospace fonts.
  const mirrorRef = useRef<HTMLSpanElement>(null)
  const [inputWidth, setInputWidth] = useState(0)

  useLayoutEffect(() => {
    const el = mirrorRef.current
    if (el !== null) setInputWidth(el.offsetWidth)
  }, [value])

  // Spawn one shell on mount (or session switch) and poll its output.
  useEffect(() => {
    let alive = true
    let poll: ReturnType<typeof setInterval> | undefined
    // Resolve the session cwd first so the shell starts there (its prompt
    // then matches the input-row prompt) and spawn with that working dir.
    void api.sessionCwd({ sessionId })
      .then(({ cwd }) => {
        if (!alive) return undefined
        setCwd(cwd)
        return api.terminalSpawn({ sessionId }, cwd)
      })
      .then((spawned) => {
        if (!alive || spawned === undefined) return
        const { session } = spawned
        if (!alive) return
        idRef.current = session.id
        poll = setInterval(async () => {
          const id = idRef.current
          if (id === undefined) return
          try {
            const result = await api.terminalRead({ sessionId: sessionIdRef.current }, id)
            if (result.delta) {
              outputRef.current += result.delta
              if (alive) setOutput(outputRef.current)
            }
          } catch { /* terminal torn down; stop polling next tick */ }
        }, POLL_MS)
      })
      .catch((caught: unknown) => {
        if (alive) setError(caught instanceof Error ? caught.message : String(caught))
      })
    return () => {
      alive = false
      if (poll !== undefined) clearInterval(poll)
      if (idRef.current !== undefined) void api.terminalClose({ sessionId }, idRef.current)
    }
  }, [sessionId])

  // Keep the output pinned to the newest line while it grows.
  useEffect(() => {
    const el = scrollRef.current
    if (el !== null) el.scrollTop = el.scrollHeight
  }, [output])

  /** Submit one command line to the shell's stdin. */
  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const trimmed = value
    if (trimmed.length === 0 || idRef.current === undefined) return
    void api.terminalWrite({ sessionId }, idRef.current, `${trimmed}\n`).catch(() => {})
    historyRef.current = [...historyRef.current, trimmed]
    setHistoryIndex(-1)
    setValue('')
  }

  /** Up/Down walks the command history of this shell. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const index = historyIndex === -1 ? historyRef.current.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(index)
      setValue(historyRef.current[index] ?? '')
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (historyIndex === -1) return
      const index = historyIndex + 1
      if (index >= historyRef.current.length) {
        setHistoryIndex(-1)
        setValue('')
      } else {
        setHistoryIndex(index)
        setValue(historyRef.current[index] ?? '')
      }
    }
  }

  return (
    <div className={css.panel}>
      <div className={css.bar}>
        <span className={css.label}>终端</span>
        <span className={css.spacer} />
        <button type="button" className={css.close} aria-label="关闭终端" title="关闭终端" onClick={onClose}>×</button>
      </div>
      <div ref={scrollRef} className={css.output} aria-live="polite">
        {error !== undefined ? <div className={css.row}>{error}</div> : null}
        {output.split('\n').map((line, lineIndex) => {
          // Skip bare idle prompts from the shell (prompt with no command):
          // the input row owns the visible prompt, so showing both duplicates it.
          if (/^PS .+?>\s*$/.test(line)) return null
          // Highlight a leading shell prompt (PS C:\...>) like the prototype
          // terminal__prompt, leaving the rest of the line ANSI-rendered.
          const promptMatch = /^(PS .+?>)/.exec(line)
          const promptText = promptMatch === null || promptMatch[1] === undefined ? undefined : promptMatch[1]
          const rest = promptText === undefined ? line : line.slice(promptText.length)
          return (
            <div key={lineIndex} className={css.row}>
              {promptText !== undefined ? <span className={css.promptInline}>{promptText}</span> : null}
              {parseAnsi(rest).map((segment, index) =>
                segment.style === undefined
                  ? <span key={index}>{segment.text}</span>
                  : <span key={index} style={{
                      color: segment.style.fg,
                      backgroundColor: segment.style.bg,
                      fontWeight: segment.style.bold ? 700 : undefined,
                    }}>{segment.text}</span>
              )}
              {line === '' ? ' ' : null}
            </div>
          )
        })}
      <form className={css.inputRow} onSubmit={submit} onClick={(event) => { if (event.target !== inputRef.current) inputRef.current?.focus() }}>
        <span className={css.prompt}>{cwd === '' ? '>' : `PS ${cwd}>`}</span>
        <span ref={mirrorRef} className={css.mirror} aria-hidden="true">{value === '' ? '\u00A0' : value}</span>
        <input
          ref={inputRef}
          className={css.input}
          style={{ width: inputWidth, minWidth: 0 }}
          value={value}
          onChange={(event) => { setValue(event.target.value) }}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          aria-label={t('terminal.inputAria')}
        />
        <span className={css.cursor} aria-hidden="true">█</span>
      </form>
      </div>
    </div>
  )
}
