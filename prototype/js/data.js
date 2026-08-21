/* data.js — 原型演示数据（文件树、会话、消息、编辑器内容）
   生产环境：文件树来自 host /sidebar/api，会话来自 sessions.list。 */

export const workspace = {
  cwd: 'D:\\deepseek-harness',
  label: 'deepseek-harness',
};

/** 文件树（node = { name, type:'dir'|'file', children?, git? }） */
export const fileTree = [
  { name: '.agents', type: 'dir', children: [
    { name: 'notes', type: 'dir', children: [
      { name: 'implemented', type: 'dir', children: [
        { name: '2026-08-17-desktop-workbench-plugin-split.md', type: 'file' },
        { name: '2026-08-16-workbench-terminal-git-editor.md', type: 'file' },
      ]},
    ]},
  ]},
  { name: 'apps', type: 'dir', children: [
    { name: 'desktop', type: 'dir', children: [
      { name: 'src', type: 'dir', children: [
        { name: 'main.ts', type: 'file', git: 'm' },
        { name: 'preload.ts', type: 'file' },
      ]},
      { name: 'package.json', type: 'file' },
    ]},
    { name: 'web', type: 'dir', children: [
      { name: 'index.html', type: 'file' },
    ]},
  ]},
  { name: 'packages', type: 'dir', children: [
    { name: 'client', type: 'dir', children: [
      { name: 'ui-workbench', type: 'dir', children: [
        { name: 'src', type: 'dir', children: [
          { name: 'client', type: 'dir', children: [
            { name: 'FileTree.tsx', type: 'file' },
            { name: 'WorkbenchTreePanel.tsx', type: 'file' },
          ]},
        ]},
      ]},
    ]},
    { name: 'host', type: 'dir', children: [
      { name: 'workbench', type: 'dir', children: [
        { name: 'src', type: 'dir', children: [
          { name: 'index.ts', type: 'file', git: 'u' },
        ]},
      ]},
    ]},
  ]},
  { name: 'README.md', type: 'file' },
  { name: 'AGENTS.md', type: 'file' },
  { name: 'pnpm-workspace.yaml', type: 'file' },
];

export const sessions = [
  { id: 's1', name: '修仙游戏 App 开发', cwd: 'D:\\deepseek-harness', active: true },
  { id: 's2', name: 'DSH 工作台插件', cwd: 'D:\\deepseek-harness-key\\dsh-workspace', active: false },
  { id: 's3', name: 'README 整理', cwd: 'D:\\deepseek-harness', active: false },
  { id: 's4', name: '性能优化调研', cwd: 'D:\\deepseek-harness', active: false },
];

/** 每个会话的消息流（key 对应会话 id） */
export const messagesBySession = {
  s1: [
    { role: 'user', name: '你', text: '继续完善工作台插件，把文件树、编辑器、终端和 Git 整合到一个独立窗口。' },
    { role: 'tool', badge: 'Think', text: '先分析两套实现的差异，再规划独立窗口布局。' },
    { role: 'assistant', name: 'DeepSeek Harness', text: '好的，我建议做成三栏布局：左侧文件树、中间阅读/编辑、右侧对话，底部可展开终端/Git 面板。' },
    { role: 'user', name: '你', text: '会话切换后文件树也要跟着动态更新。' },
  ],
  s2: [
    { role: 'user', name: '你', text: '独立仓库已经建好了：xuqingsakura/dsh-workspace。' },
    { role: 'assistant', name: 'DeepSeek Harness', text: '收到。原型页面正在独立仓库的 prototype/ 目录下开发，先验证布局再写插件。' },
  ],
  s3: [
    { role: 'user', name: '你', text: '把 README 里过时的安装步骤整理一下。' },
    { role: 'assistant', name: 'DeepSeek Harness', text: '已列出待整理章节：快速开始、插件安装、常见问题。' },
  ],
  s4: [
    { role: 'user', name: '你', text: '调研一下长会话 DOM 虚拟化和内存优化的方案。' },
    { role: 'assistant', name: 'DeepSeek Harness', text: '初步结论：会话节点窗口化收益最大，流式 Markdown 渲染上限次之，渲染内存 LRU 兜底。' },
  ],
};

/** 编辑器示例内容（按文件名 key） */
export const editorContents = {
  'README.md': {
    lang: 'Markdown',
    html: `
      <div class="md">
        <h1>dsh-workspace</h1>
        <p>DeepSeek Harness 独立工作台窗口插件：文件树 / 编辑器 / 终端 / Git / 浏览器，三栏布局。</p>
        <hr />
        <h2>功能</h2>
        <p>左侧文件树、中间阅读与编辑、右侧对话，底部终端面板，全部按会话隔离。</p>
        <h2>安装</h2>
        <pre class="code-block"><span class="tok-com"># 从源码安装</span>
<span class="tok-kw">pnpm</span> add dsh-workspace
<span class="tok-kw">dsh</span> --profile web add <span class="tok-str">"file:./dsh-workspace"</span></pre>
      </div>`,
  },
  'src/index.ts': {
    lang: 'TypeScript',
    html: `
      <pre class="code-block"><span class="tok-kw">import</span> { Context } <span class="tok-kw">from</span> <span class="tok-str">'@deepseek-ai/cordis'</span>
<span class="tok-kw">export const</span> name = <span class="tok-str">'dsh-workspace'</span>
<span class="tok-kw">export const</span> inject = [<span class="tok-str">'webServer'</span>, <span class="tok-str">'sessions'</span>, <span class="tok-str">'webRuntime'</span>]

<span class="tok-kw">export function</span> <span class="tok-fn">apply</span>(ctx: Context): <span class="tok-kw">void</span> {
  <span class="tok-com">// host 端：注册 /sidebar/* 文件树、终端、Git 路由</span>
  ctx.effect(<span class="tok-fn">registerRoutes</span>(ctx))
}</pre>`,
  },
  'packages/host/workbench/src/index.ts': {
    lang: 'TypeScript',
    html: `
      <pre class="code-block"><span class="tok-kw">@Remote</span>(<span class="tok-str">'gitStatus'</span>)
<span class="tok-kw">async</span> gitStatus(sessionId: <span class="tok-kw">string</span>): Promise&lt;WorkbenchGitStatusResult&gt; {
  <span class="tok-kw">const</span> cwd = sessionCwdOf(<span class="tok-kw">this</span>.ctx.sessions, sessionId)
  <span class="tok-kw">return</span> <span class="tok-fn">gitStatus</span>(cwd)
}</pre>`,
  },
};
