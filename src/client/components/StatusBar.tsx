/**
 * Status bar: the blue bottom strip (branch / sync / errors / language).
 * @module dsh-workbench-window/client-status-bar
 */
import css from '../styles/root.module.css'

/** The status bar component. */
export function StatusBar() {
  return (
    <footer className={css.statusbar}>
      <span className={css.statusItem}>⎇ master</span>
      <span className={css.statusItem}>⇅ 同步</span>
      <span className={css.statusItem}>⊗ 0 △ 0</span>
      <span className={css.statusSpacer} />
      <span className={css.statusItem}>简体中文</span>
      <span className={css.statusItem}>DeepSeek Harness</span>
    </footer>
  )
}
