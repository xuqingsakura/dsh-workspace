/* icons.js — VSCode 风格线条 SVG 图标（文件树用）
   16x16 viewBox，stroke 线条风格，颜色按类型区分（贴近 vscode-icons 观感）。 */

/** 文件夹图标（open/closed 两种形态） */
export function folderIcon(open = false) {
  if (open) {
    return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style="color:#d4a72c">'
      + '<path d="M1 4.5A1.5 1.5 0 0 1 2.5 3h3l1.5 1.5h6A1.5 1.5 0 0 1 14.5 6H5a1 1 0 0 0-.97.76L2.8 12.3 2.1 9.8A1.5 1.5 0 0 1 1 8.5v-4z" fill="currentColor" opacity="0.9"/>'
      + '<path d="M1.6 10.5h11.9a.5.5 0 0 1 .48.36l1 3.64H2l-1.1-3.6a.5.5 0 0 1 .7-.4z" fill="currentColor" opacity="0.7"/>'
      + '</svg>';
  }
  return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style="color:#d4a72c">'
    + '<path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.2l1.6 1.6H13A1.5 1.5 0 0 1 14.5 5.1V12A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12v-8.5z" fill="currentColor" opacity="0.9"/>'
    + '</svg>';
}

/** 通用文件图标（线条文档） */
function fileBase() {
  return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M4 1.5h5.5L13 5v8.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z"/><path d="M9.5 1.5V5H13"/></svg>';
}

/** 类型徽标（叠加在文件上，Seti 风格小色块） */
function badge(color, label) {
  return `<span style="position:relative;display:inline-flex;width:16px;height:16px">${fileBase()}<span style="position:absolute;right:0;bottom:0;font-size:8px;font-weight:700;line-height:1;color:${color};padding:0 1px;background:var(--bg-layer-1)">${label}</span></span>`;
}

/** 按文件名/扩展名返回图标 HTML */
export function fileIcon(name) {
  if (/\.(ts|tsx|mts|cts)$/.test(name)) return badge('#3178c6', 'TS');
  if (/\.(js|jsx|mjs|cjs)$/.test(name)) return badge('#f1e05a', 'JS');
  if (/\.md$/.test(name)) return badge('#4d9fff', 'M↓');
  if (/\.json$/.test(name)) return badge('#f1e05a', '{}');
  if (/\.(yml|yaml)$/.test(name)) return badge('#8e44ad', '~');
  if (/\.(css|scss|less)$/.test(name)) return badge('#563d7c', '#');
  if (/\.(html|htm)$/.test(name)) return badge('#e44d26', '<>');
  if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/.test(name)) return badge('#58a6ff', '◆');
  if (/\.(pdf)$/.test(name)) return badge('#f85149', 'PDF');
  if (/\.(txt|log)$/.test(name)) return badge('#9aa4b2', 'T');
  return fileBase();
}
