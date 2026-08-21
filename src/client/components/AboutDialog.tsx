/**
 * 关于对话框：自绘 modal（替代原生 alert），展示工作台插件信息与功能。
 * @module dsh-workbench-window/client-about-dialog
 */
import type { ReactNode } from 'react'
import css from '../styles/about-dialog.module.css'

/** 关于对话框 props。 */
export interface AboutDialogProps {
  open: boolean
  onClose(): void
}

/** 功能列表。 */
const FEATURES: string[] = [
  '三栏工作台：文件树 | 阅读/编辑 | 对话',
  '独立窗口模式，主窗口隐藏/恢复',
  'Git 面板：分支 / 提交历史 / 变更 / 提交',
  '浏览器：本地开发预览',
  '终端：原型风格',
  '文件树虚拟滚动 + 文件搜索',
]

/**
 * 关于对话框主体：遮罩 + 居中卡片。
 * @param props - 开关状态与关闭回调。
 */
export function AboutDialog({ open, onClose }: AboutDialogProps): ReactNode {
  if (!open) return null
  return (
    <div className={css.overlay} onClick={onClose}>
      <div className={css.dialog} role="dialog" aria-modal="true" aria-label="关于 DeepSeek Harness 工作台"
        onClick={(event) => event.stopPropagation()}>
        <div className={css.header}>
          <span className={css.title}>关于 DeepSeek Harness 工作台</span>
          <button type="button" className={css.close} aria-label="关闭" title="关闭" onClick={onClose}>×</button>
        </div>
        <div className={css.body}>
          <div className={css.appName}>DeepSeek Harness 工作台</div>
          <div className={css.version}>版本 v0.1.0</div>
          <p className={css.desc}>DeepSeek Harness 的 VSCode 风格独立工作台窗口插件，按会话隔离。</p>
          <div className={css.sectionTitle}>功能</div>
          <ul className={css.features}>
            {FEATURES.map(item => <li key={item}>{item}</li>)}
          </ul>
          <div className={css.repo}>
            仓库：
            <a href="https://github.com/xuqingsakura/dsh-workspace" target="_blank" rel="noreferrer">
              github.com/xuqingsakura/dsh-workspace
            </a>
          </div>
        </div>
        <div className={css.footer}>
          <button type="button" className={css.ok} onClick={onClose}>确定</button>
        </div>
      </div>
    </div>
  )
}

export default AboutDialog
