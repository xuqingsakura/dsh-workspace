/* editor.js — 中列编辑器：标签页激活/关闭、内容渲染、滚轮横向滑动 */

import { editorContents } from './data.js';

function contentFor(path) {
  return editorContents[path] ?? editorContents['README.md'];
}

function renderContent(path) {
  const box = document.getElementById('editor-content');
  const data = contentFor(path);
  box.innerHTML = data.html;
}

export function initEditor() {
  const tabs = document.getElementById('editor-tabs');
  const content = document.getElementById('editor-content');
  if (tabs === null) return;

  const activate = (path) => {
    tabs.querySelectorAll('.editor__tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.path === path);
    });
    renderContent(path);
  };

  // 标签过多时：滚轮横向滑动（不显示横向滚动条，CSS 已隐藏）
  tabs.addEventListener('wheel', (e) => {
    if (tabs.scrollWidth <= tabs.clientWidth) return;
    e.preventDefault();
    tabs.scrollLeft += e.deltaY > 0 ? 40 : -40;
  }, { passive: false });

  tabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.editor__tab');
    if (tab !== null && !e.target.closest('.editor__tab-close')) {
      activate(tab.dataset.path);
      return;
    }
    const close = e.target.closest('.editor__tab-close');
    if (close !== null) {
      const t = close.closest('.editor__tab');
      t?.remove();
      const remaining = tabs.querySelector('.editor__tab');
      if (remaining !== null) activate(remaining.dataset.path);
      else content.replaceChildren();
    }
  });

  // 外部：文件树点击（标签追加到末尾）
  window.addEventListener('prototype:open-file', (e) => {
    const path = e.detail.path;
    if (tabs.querySelector(`.editor__tab[data-path="${CSS.escape(path)}"]`) === null) {
      const tab = document.createElement('div');
      tab.className = 'editor__tab active';
      tab.dataset.path = path;
      tab.innerHTML = `<span>${path}</span><button class="editor__tab-close" aria-label="关闭">&#x2715;</button>`;
      tabs.append(tab);
    }
    activate(path);
  });

  activate('README.md');
}
