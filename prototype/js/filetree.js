/* filetree.js — 文件树渲染与交互（展开/折叠、选中、Git 状态徽标、搜索过滤） */
import { workspace, fileTree } from './data.js';
import { folderIcon, fileIcon } from './icons.js';

const GIT_BADGE = { m: 'M', u: 'U', a: 'A' };

function defaultOpen(node) {
  return node.name === 'apps' || node.name === 'packages' || node.name === 'client';
}

function renderRow(node, depth, openSet, selected) {
  const isDir = node.type === 'dir';
  const row = document.createElement('div');
  row.className = 'tree-row' + (selected === node.name && !isDir ? ' selected' : '');
  row.style.paddingLeft = `${8 + depth * 14}px`;
  row.dataset.name = node.name;
  row.dataset.type = node.type;

  const twisty = document.createElement('span');
  twisty.className = 'tree-row__twisty' + (openSet.has(node.name) ? '' : ' collapsed');
  twisty.textContent = '▼';
  twisty.style.visibility = isDir ? 'visible' : 'hidden';

  const icon = document.createElement('span');
  icon.className = 'tree-row__icon';
  icon.style.display = 'inline-flex';
  icon.style.alignItems = 'center';
  icon.style.justifyContent = 'center';
  if (isDir) icon.innerHTML = folderIcon(openSet.has(node.name));
  else icon.innerHTML = fileIcon(node.name);

  const label = document.createElement('span');
  label.textContent = node.name;

  row.append(twisty, icon, label);

  if (node.git && GIT_BADGE[node.git]) {
    const badge = document.createElement('span');
    badge.className = `tree-row__git tree-row__git--${node.git}`;
    badge.textContent = GIT_BADGE[node.git];
    row.append(badge);
  }

  if (isDir) {
    row.addEventListener('click', () => {
      const children = row.nextElementSibling;
      if (children === null) return;
      const open = children.classList.toggle('open');
      twisty.classList.toggle('collapsed', !open);
      icon.innerHTML = folderIcon(open);
    });
  } else {
    row.addEventListener('click', () => {
      document.querySelectorAll('.tree-row.selected').forEach((el) => el.classList.remove('selected'));
      row.classList.add('selected');
      window.dispatchEvent(new CustomEvent('prototype:open-file', { detail: { path: node.name } }));
    });
  }
  return row;
}

function renderTree(container, nodes, depth, openSet, selected) {
  for (const node of nodes) {
    const row = renderRow(node, depth, openSet, selected);
    container.append(row);
    if (node.type === 'dir') {
      const children = document.createElement('div');
      children.className = 'tree-children' + (openSet.has(node.name) ? ' open' : '');
      renderTree(children, node.children ?? [], depth + 1, openSet, selected);
      container.append(children);
    }
  }
}

function collectMatches(node, query) {
  const q = query.toLowerCase();
  if (node.type === 'file') return node.name.toLowerCase().includes(q);
  const kids = (node.children ?? []).map((c) => ({ node: c, hit: collectMatches(c, q) }));
  return kids.some((k) => k.hit) || node.name.toLowerCase().includes(q);
}

export function initFileTree(container, cwdEl) {
  const render = (query) => {
    container.replaceChildren();
    const openSet = new Set(['apps', 'packages', 'client']);
    if (query === undefined || query === '') {
      renderTree(container, fileTree, 0, openSet, undefined);
      return;
    }
    const filtered = fileTree.filter((n) => collectMatches(n, query));
    renderTree(container, filtered, 0, openSet, undefined);
  };

  if (cwdEl !== null) cwdEl.textContent = `${workspace.label}`;
  render('');

  const search = document.querySelector('.tree__search input');
  search?.addEventListener('input', (e) => render(e.target.value.trim()));
}

/** 切换会话：更新工作区标签（原型沿用同一棵树，生产按会话 cwd 重新拉取） */
export function setWorkspaceCwd(label) {
  const el = document.querySelector('.sidebar__section-label');
  if (el !== null) el.textContent = `${label}`;
}
