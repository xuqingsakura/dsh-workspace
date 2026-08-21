/* layout.js — 工作台列宽拖拽（活动栏固定；侧边栏、对话列可调，编辑器弹性）
   left-rail 跨两行，宽度 = activity + sidebar；底部面板 grid 列自动跟随。 */

const MIN = 160;

export function initLayout() {
  const frame = document.getElementById('frame');
  const leftRail = document.getElementById('left-rail');
  const sidebar = document.getElementById('sidebar');
  const chat = document.getElementById('chat');
  const editor = document.getElementById('editor');
  if (frame === null || sidebar === null || chat === null || editor === null) return;

  // 手柄定位基于 frame 坐标系（left-rail 内 activity 48px 固定）
  const makeHandle = (side, getLeft) => {
    const handle = document.createElement('div');
    handle.className = 'layout-handle';
    frame.append(handle);

    let startX = 0;
    let startW = 0;
    let target = null;

    const position = () => { handle.style.left = `${getLeft()}px`; };
    position();
    window.addEventListener('resize', position);

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      handle.dataset.dragging = 'true';
      startX = e.clientX;
      if (side === 'sidebar') { target = sidebar; startW = sidebar.offsetWidth; }
      else { target = chat; startW = chat.offsetWidth; }
    });
    handle.addEventListener('pointermove', (e) => {
      if (!handle.hasPointerCapture(e.pointerId) || target === null) return;
      const dx = e.clientX - startX;
      // 可用宽度 = frame 宽 - activity(48) - 两侧最小
      const maxW = frame.clientWidth - 48 - MIN * 2;
      const next = side === 'sidebar'
        ? Math.max(MIN, Math.min(startW + dx, maxW))
        : Math.max(MIN, Math.min(startW - dx, maxW));
      target.style.flex = `0 0 ${next}px`;
    });
    const end = (e) => {
      if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
      handle.removeAttribute('data-dragging');
      target = null;
      void e;
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  };

  requestAnimationFrame(() => {
    makeHandle('sidebar', () => 48 + sidebar.offsetWidth);
    makeHandle('chat', () => frame.clientWidth - chat.offsetWidth);
  });
}
