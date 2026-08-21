/* bottom-panel.js — 底部面板：开关（仅终端） */

export function initBottomPanel() {
  const panel = document.getElementById('bottom-panel');
  const close = document.getElementById('bottom-close');
  if (panel === null) return;

  close?.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    close.title = panel.hidden ? '打开终端面板' : '关闭面板';
  });

  return { open: () => { panel.hidden = false; } };
}
