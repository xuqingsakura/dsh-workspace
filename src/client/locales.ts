/**
 * Locale dictionaries for the workspace plugin (zh/en). Registered into the
 * shared locale registry under the 'workbench' namespace on activation.
 * @module dsh-workbench-window/client-locales
 */

/** Chinese copy. */
export const zh = {
  'actions.workbench': '工作台',
  'viewer.empty': '从文件树打开文件',
  'viewer.loading': '加载中…',
  'viewer.binary': '二进制文件，暂不支持预览',
  'viewer.truncated': '文件较大，仅显示前一部分',
  'viewer.openError': '无法打开文件',
  'viewer.title': '{path}',
  'copy': '复制',
  'copied': '已复制',
  'tree.loading': '加载中…',
  'editor.save': '保存',
  'editor.saving': '保存中…',
  'editor.saved': '已保存',
  'editor.saveError': '保存失败',
  'editor.dirty': '有未保存的更改',
  'terminal.title': '终端',
  'terminal.running': '运行中',
  'terminal.exited': '已退出',
  'terminal.close': '关闭',
  'terminal.placeholder': '输入命令，回车执行',
  'terminal.inputAria': '终端命令输入',
  'terminal.new': '新建终端',
  'terminal.clear': '清屏',
  'terminal.closePanel': '关闭终端面板',
} as const

/** English copy. */
export const en: Record<keyof typeof zh, string> = {
  'actions.workbench': 'Workbench',
  'viewer.empty': 'Open a file from the tree',
  'viewer.loading': 'Loading…',
  'viewer.binary': 'Binary file — preview not supported yet',
  'viewer.truncated': 'File is large; showing the leading part only',
  'viewer.openError': 'Cannot open file',
  'viewer.title': '{path}',
  'copy': 'Copy',
  'copied': 'Copied',
  'tree.loading': 'Loading…',
  'editor.save': 'Save',
  'editor.saving': 'Saving…',
  'editor.saved': 'Saved',
  'editor.saveError': 'Save failed',
  'editor.dirty': 'Unsaved changes',
  'terminal.title': 'Terminal',
  'terminal.running': 'Running',
  'terminal.exited': 'Exited',
  'terminal.close': 'Close',
  'terminal.placeholder': 'Type a command and press Enter',
  'terminal.inputAria': 'Terminal command input',
  'terminal.new': 'New terminal',
  'terminal.clear': 'Clear',
  'terminal.closePanel': 'Close terminal panel',
} as const

/** Locale namespace key. */
export const NS = 'workbench' as const

/** The key union (shared by zh/en). */
export type WorkspaceKey = keyof typeof zh
