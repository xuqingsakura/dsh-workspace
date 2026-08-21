/**
 * 通用输入对话框（自绘 modal）：用于新建文件/文件夹、另存为等输入名称/路径。
 * @module dsh-workbench-window/client-prompt-dialog
 */
import { useEffect, useState, type ReactNode } from 'react'
import css from '../styles/prompt-dialog.module.css'

/** 输入对话框 props。 */
export interface PromptDialogProps {
  open: boolean
  /** 对话框标题。 */
  title: string
  /** 输入框占位符。 */
  placeholder?: string
  /** 初始值（如另存为预填当前路径）。 */
  defaultValue?: string
  /** 确认回调（传入输入值）。 */
  onConfirm(value: string): void
  /** 取消回调。 */
  onCancel(): void
}

/**
 * 输入对话框主体。
 * @param props - 开关、标题、占位、初始值、确认/取消回调。
 */
export function PromptDialog({ open, title, placeholder, defaultValue, onConfirm, onCancel }: PromptDialogProps): ReactNode {
  const [value, setValue] = useState(defaultValue ?? '')

  // 每次打开时重置输入。
  useEffect(() => {
    if (open) setValue(defaultValue ?? '')
  }, [open, defaultValue])

  if (!open) return null
  const submit = (): void => {
    const trimmed = value.trim()
    if (trimmed === '') return
    onConfirm(trimmed)
  }
  return (
    <div className={css.overlay} onClick={onCancel}>
      <div className={css.dialog} role="dialog" aria-modal="true" aria-label={title}
        onClick={(event) => event.stopPropagation()}>
        <div className={css.header}>
          <span className={css.title}>{title}</span>
          <button type="button" className={css.close} aria-label="关闭" title="关闭" onClick={onCancel}>×</button>
        </div>
        <div className={css.body}>
          <input className={css.input} value={value} autoFocus placeholder={placeholder}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') submit() }} />
        </div>
        <div className={css.footer}>
          <button type="button" className={css.cancel} onClick={onCancel}>取消</button>
          <button type="button" className={css.ok} disabled={value.trim() === ''} onClick={submit}>确定</button>
        </div>
      </div>
    </div>
  )
}

export default PromptDialog
