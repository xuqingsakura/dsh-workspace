/* main.js — 原型入口：装配各模块、活动栏切换、菜单、主题、标注 */

import { initFileTree } from './filetree.js';
import { initEditor } from './editor.js';
import { initConversation } from './conversation.js';
import { initBottomPanel } from './bottom-panel.js';
import { initLayout } from './layout.js';

function initTitlebar() {
  document.querySelectorAll('.titlebar__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      console.log(`[prototype] titlebar action: ${btn.dataset.win}`);
    });
  });
}

function switchPanel(view) {
  // 活动栏切换侧边栏面板（explorer/search/scm 有面板；settings 无面板）
  const hasPanel = ['explorer', 'search', 'scm'].includes(view);
  const sidebar = document.getElementById('sidebar');
  if (sidebar !== null) sidebar.style.display = hasPanel ? 'flex' : 'none';
  if (!hasPanel) return;
  document.querySelectorAll('.sidebar__panel').forEach((p) => { p.hidden = p.dataset.panel !== view; });
}

function initActivityBar() {
  document.querySelectorAll('.activity__item').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.activity__item').forEach((i) => i.classList.toggle('active', i === item));
      switchPanel(item.dataset.view);
    });
  });
}

function initMenubar() {
  document.querySelectorAll('.menubar__item').forEach((item) => {
    item.addEventListener('click', () => {
      console.log(`[prototype] menu: ${item.dataset.menu}`);
    });
  });
}

function initStatusbar() {
  // 状态栏"同步"点击：开关底部终端面板（原型演示）
  document.querySelector('.statusbar__item--sync')?.addEventListener('click', () => {
    const panel = document.getElementById('bottom-panel');
    if (panel !== null) panel.hidden = !panel.hidden;
  });
}

function initAnnotations() {
  const layer = document.getElementById('annotations');
  const toggle = document.getElementById('annotations-toggle');
  toggle?.addEventListener('click', () => {
    const visible = layer?.classList.toggle('visible');
    toggle.textContent = visible ? '隐藏标注' : '标注';
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
    }
  });
}

function init() {
  initTitlebar();
  initMenubar();
  initActivityBar();
  initFileTree(document.getElementById('file-tree'), document.querySelector('.sidebar__section-label'));
  initEditor();
  initConversation();
  initBottomPanel();
  initLayout();
  initStatusbar();
  initAnnotations();
}

document.addEventListener('DOMContentLoaded', init);
