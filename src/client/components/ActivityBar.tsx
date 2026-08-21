/**
 * Activity bar: the permanent 48px rail with view-switch icons (VSCode style).
 * @module dsh-workbench-window/client-activity-bar
 */
import type { ReactNode } from 'react'
import { ExplorerIcon, ScmIcon, SearchIcon, SettingsIcon } from './icons.tsx'
import css from '../styles/root.module.css'

/** One activity view key. */
export type ActivityView = 'explorer' | 'search' | 'scm' | 'settings'

/** Props for the activity bar. */
export interface ActivityBarProps {
  active: ActivityView
  onSelect(view: ActivityView): void
}

/** The activity bar component. */
export function ActivityBar({ active, onSelect }: ActivityBarProps) {
  const items: Array<{ view: ActivityView; label: string; icon: ReactNode }> = [
    { view: 'explorer', label: '资源管理器', icon: <ExplorerIcon /> },
    { view: 'search', label: '搜索', icon: <SearchIcon /> },
    { view: 'scm', label: '源代码管理', icon: <ScmIcon /> },
  ]
  const bottom: Array<{ view: ActivityView; label: string; icon: ReactNode }> = [
    { view: 'settings', label: '管理', icon: <SettingsIcon /> },
  ]
  const cls = (view: ActivityView): string => `${css.activityItem} ${active === view ? css.activityItemActive : ''}`
  return (
    <aside className={css.activity}>
      <div className={css.activityTop}>
        {items.map(item => (
          <button key={item.view} type="button" className={cls(item.view)} title={item.label} aria-label={item.label}
            onClick={() => onSelect(item.view)}>
            {item.icon}
          </button>
        ))}
      </div>
      <div className={css.activityBottom}>
        {bottom.map(item => (
          <button key={item.view} type="button" className={cls(item.view)} title={item.label} aria-label={item.label}
            onClick={() => onSelect(item.view)}>
            {item.icon}
          </button>
        ))}
      </div>
    </aside>
  )
}
