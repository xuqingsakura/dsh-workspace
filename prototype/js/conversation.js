/* conversation.js — 右列对话：渲染原项目 DeepSeek Harness 风格的对话流
   节点：上下文注入 → 用户消息 → Think/工具调用 → Assistant 文本 → 反馈按钮 */

import { sessions, messagesBySession } from './data.js';

const SESSION_LABEL = Object.fromEntries(sessions.map((s) => [s.id, s.name]));

/* ── 原项目消息流数据（按会话） ────────────────── */
const flowBySession = {
  s1: [
    { kind: 'ctx', badge: 'system-prompt', name: '@deepseek-ai/dsh-system-prompt' },
    { kind: 'user', text: '继续完善工作台插件，把文件树、编辑器、终端和 Git 整合到一个独立窗口。' },
    { kind: 'think', text: 'The user asked to build the workbench as a standalone window. Analyze both implementations (dsh-workbench + DSH-better-sidebar) and plan the layout.' },
    { kind: 'tool', name: 'Bash', status: '完成', text: 'Show diff stats for working tree and staged\n.../apps/desktop | 12 +-' },
    { kind: 'ctx', badge: 'AGENTS.md', name: '~/.dsh/AGENTS.md, AGENTS.md' },
    { kind: 'assistant', text: '我建议做成三栏布局：左侧文件树、中间阅读/编辑、右侧对话，底部可展开终端面板。\n\n- **文件树**：虚拟滚动、搜索过滤、Git 状态徽标\n- **编辑器**：标签页、语法高亮、Markdown/PDF 预览\n- **对话**：保留原项目显示，会话切换联动文件树' },
    { kind: 'user', text: '会话切换后文件树也要跟着动态更新。' },
    { kind: 'think', text: 'Session switch must re-root the file tree to the new session cwd.' },
    { kind: 'assistant', text: '已确认：切换会话时，文件树会按新会话的工作目录重新拉取，编辑器/终端/Git 面板同步跟随。' },
  ],
  s2: [
    { kind: 'ctx', badge: 'system-prompt', name: '@deepseek-ai/dsh-system-prompt' },
    { kind: 'user', text: '独立仓库已经建好了：xuqingsakura/dsh-workspace。' },
    { kind: 'assistant', text: '收到。原型页面正在独立仓库的 `prototype/` 目录下开发，先验证布局再写插件。' },
  ],
  s3: [
    { kind: 'ctx', badge: 'AGENTS.md', name: 'README.md' },
    { kind: 'user', text: '把 README 里过时的安装步骤整理一下。' },
    { kind: 'assistant', text: '已列出待整理章节：快速开始、插件安装、常见问题。' },
  ],
  s4: [
    { kind: 'ctx', badge: 'system-prompt', name: '@deepseek-ai/dsh-system-prompt' },
    { kind: 'user', text: '调研一下长会话 DOM 虚拟化和内存优化的方案。' },
    { kind: 'assistant', text: '初步结论：会话节点窗口化收益最大，流式 Markdown 渲染上限次之，渲染内存 LRU 兜底。' },
  ],
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderFeedback(container) {
  const row = el('div', 'msg-actions');
  const thumbs = ['👍', '👎', '↗'];
  for (const glyph of thumbs) {
    const btn = el('button', 'icon-btn', glyph);
    btn.type = 'button';
    btn.title = { '👍': '点赞', '👎': '点踩', '↗': '分享' }[glyph];
    row.append(btn);
  }
  container.append(row);
}

function renderNode(flow, node) {
  switch (node.kind) {
    case 'ctx': {
      const row = el('div', 'ctx-row');
      row.append(el('span', 'ctx-row__badge', node.badge));
      row.append(el('span', 'ctx-row__name', node.name));
      flow.append(row);
      break;
    }
    case 'user': {
      const msg = el('div', 'user-msg');
      msg.append(el('div', 'user-msg__label', '你'));
      msg.append(el('div', 'user-msg__text', node.text));
      flow.append(msg);
      break;
    }
    case 'think': {
      const box = el('div', 'think');
      const head = el('button', 'think__head');
      head.type = 'button';
      head.append(el('span', 'think__chevron', '▼'));
      head.append(el('span', null, 'Think'));
      const body = el('div', 'think__body', node.text);
      head.addEventListener('click', () => {
        box.dataset.collapsed = box.hasAttribute('data-collapsed') ? '' : 'true';
      });
      box.append(head, body);
      flow.append(box);
      break;
    }
    case 'tool': {
      const box = el('div', 'tool-call');
      const head = el('button', 'tool-call__head');
      head.type = 'button';
      head.append(el('span', 'think__chevron', '▼'));
      head.append(el('span', 'tool-call__name', node.name));
      head.append(el('span', 'tool-call__status', node.status));
      const body = el('div', 'tool-call__body', node.text);
      head.addEventListener('click', () => {
        box.dataset.collapsed = box.hasAttribute('data-collapsed') ? '' : 'true';
      });
      box.append(head, body);
      flow.append(box);
      break;
    }
    case 'assistant': {
      const msg = el('div', 'assistant-msg');
      msg.append(el('div', 'assistant-msg__label', 'DeepSeek Harness'));
      const text = el('div', 'assistant-msg__text');
      // 简化 Markdown 渲染：**bold** 与 `code`（原型够用，生产走 AssistantMarkdown）
      const html = node.text
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
      text.innerHTML = html;
      msg.append(text);
      renderFeedback(msg);
      flow.append(msg);
      break;
    }
    default:
      break;
  }
}

function renderFlow(sessionId) {
  const box = document.getElementById('chat-messages');
  if (box === null) return;
  const flow = el('div', 'msg-flow');
  const nodes = flowBySession[sessionId] ?? [];
  for (const node of nodes) renderNode(flow, node);
  box.replaceChildren(flow);
  box.scrollTop = box.scrollHeight;
}

function updateWorkspaceLabel(sessionId) {
  const label = SESSION_LABEL[sessionId] ?? '';
  const crumb = document.querySelector('.chat__crumb--current');
  if (crumb !== null) crumb.textContent = label;
  const sidebarLabel = document.querySelector('.sidebar__section-label');
  if (sidebarLabel !== null) sidebarLabel.textContent = label;
}

export function initConversation() {
  const current = document.getElementById('session-current');
  const menu = document.getElementById('session-menu');
  const nameEl = current?.querySelector('.chat__session-name');

  const select = (id) => {
    const s = sessions.find((x) => x.id === id);
    if (s === undefined) return;
    if (nameEl !== null) nameEl.textContent = s.name;
    menu?.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.session === id));
    renderFlow(id);
    updateWorkspaceLabel(id);
    menu?.setAttribute('hidden', '');
    current?.setAttribute('aria-expanded', 'false');
  };

  current?.addEventListener('click', (e) => {
    e.stopPropagation();
    const hidden = menu?.hasAttribute('hidden');
    if (hidden) menu?.removeAttribute('hidden');
    else menu?.setAttribute('hidden', '');
    current.setAttribute('aria-expanded', String(!hidden));
  });

  menu?.addEventListener('click', (e) => {
    const opt = e.target.closest('button[role="option"]');
    if (opt !== null) select(opt.dataset.session);
  });

  document.addEventListener('click', () => menu?.setAttribute('hidden', ''));

  renderFlow('s1');
  updateWorkspaceLabel('s1');
}
