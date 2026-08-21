/**
 * VSCode-style line SVG icons for the workspace UI. Colors follow the theme
 * tokens (currentColor) plus a per-type accent for file badges.
 * @module dsh-workbench-window/client-icons
 */
import type { ReactNode } from 'react'

/** One icon renderer: a 16x16 stroke SVG. */
function lineSvg(children: ReactNode, color?: string): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      stroke={color ?? 'currentColor'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

/** Folder icon (open or closed). */
export function FolderIcon({ open }: { open: boolean }): ReactNode {
  if (open) {
    return lineSvg(
      <>
        <path d="M1.5 4A1.5 1.5 0 0 1 3 2.5h3l1.5 1.5h5A1.5 1.5 0 0 1 14 5.5v6A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5V4z" fill="currentColor" stroke="none" opacity="0.9" />
        <path d="M2 10.5h11.5a.5.5 0 0 1 .48.36L15 14H1.5L2 10.5z" fill="currentColor" stroke="none" opacity="0.6" />
      </>,
      '#d4a72c',
    )
  }
  return lineSvg(
    <path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.2l1.6 1.6H13A1.5 1.5 0 0 1 14.5 5.1V11A1.5 1.5 0 0 1 13 12.5H3A1.5 1.5 0 0 1 1.5 11V3.5z" fill="currentColor" stroke="none" opacity="0.9" />,
    '#d4a72c',
  )
}

/** Generic file icon with an optional type badge (Seti style). */
function fileWithBadge(badge: string, color: string): ReactNode {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 16, height: 16 }}>
      {lineSvg(<><path d="M4 1.5h5.5L13 5v8.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z" /><path d="M9.5 1.5V5H13" /></>)}
      <span style={{
        position: 'absolute', right: 0, bottom: 0, fontSize: 7, fontWeight: 700, lineHeight: 1,
        color, padding: '0 1px', background: 'var(--dsw-alias-bg-layer-1, #11161d)',
      }}>{badge}</span>
    </span>
  )
}

/** File icon by name/extension (VSCode-seti-ish palette). */
export function FileIcon({ name }: { name: string }): ReactNode {
  if (/\.(tsx|jsx)$/.test(name)) return fileWithBadge('⚛', '#c084fc')
  if (/\.(ts|mts|cts)$/.test(name)) return fileWithBadge('TS', '#3178c6')
  if (/\.(js|mjs|cjs)$/.test(name)) return fileWithBadge('JS', '#f1e05a')
  if (/\.md$/.test(name)) return fileWithBadge('M↓', '#4d9fff')
  if (/\.json$/.test(name)) return fileWithBadge('{}', '#f1e05a')
  if (/\.(yml|yaml)$/.test(name)) return fileWithBadge('~', '#8e44ad')
  if (/\.(css|scss|less)$/.test(name)) return fileWithBadge('#', '#563d7c')
  if (/\.(html|htm)$/.test(name)) return fileWithBadge('<>', '#e44d26')
  if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/.test(name)) return fileWithBadge('◆', '#58a6ff')
  if (/\.pdf$/.test(name)) return fileWithBadge('PDF', '#f85149')
  return lineSvg(<><path d="M4 1.5h5.5L13 5v8.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z" /><path d="M9.5 1.5V5H13" /></>)
}

/** Activity-bar icon: explorer (files) — 两个叠放文档，VSCode 资源管理器风格。 */
export function ExplorerIcon(): ReactNode {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* 后层文档 */}
      <path d="M9 3h6l4 4v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M15 3v4h4" />
      {/* 前层文档 */}
      <path d="M5 9h6l4 4v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z" />
      <path d="M11 9v4h4" />
    </svg>
  )
}

/** Activity-bar icon: search. */
export function SearchIcon(): ReactNode {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

/** Activity-bar icon: source control (git branch). */
export function ScmIcon(): ReactNode {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="8" r="2.5" />
      <path d="M6 8.5v7M18 10.5a4 4 0 0 1-4 4h-4" />
    </svg>
  )
}

/** Activity-bar icon: embedded browser (window + globe). */
export function BrowserIcon(): ReactNode {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <circle cx="6.5" cy="6.5" r="0.5" /><circle cx="9.5" cy="6.5" r="0.5" />
    </svg>
  )
}

/** Activity-bar icon: tasks (list + check). */
export function TasksIcon(): ReactNode {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h9" />
      <path d="M16 17l2 2 3-3" />
    </svg>
  )
}

/** Activity-bar icon: settings gear. */
export function SettingsIcon(): ReactNode {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  )
}
