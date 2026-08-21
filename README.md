# dsh-workspace

DeepSeek Harness 独立工作台窗口插件：VSCode 风格的文件树 / 编辑器 / 终端 / Git / 浏览器 / 搜索，按会话隔离。

> ## ⚠️ 兼容性说明（重要）
>
> 本插件是 **fork 桌面端专属**，依赖以下**仅存在于 fork 桌面端**的外壳能力：
>
> - `workspace.shell` 布局 seat（`@deepseek-ai/dsh-client-ui-layout`）
> - `window.dshDesktop.openWorkbenchWindow` / `leaveWorkbench` 桥（`apps/desktop` preload）
> - `?dshWindow=workspace` 独立工作台窗口（`apps/desktop` main）
>
> 因此插件 **只能运行在 `xuqingsakura/deepseek-harness` fork 桌面端**。官方 `deepseek-ai/deepseek-harness`、社区 `anywhere-labs/deepseek-harness-desktop` 均**不兼容**——安装后能加载，但核心工作台功能（独立窗口、回到原桌面、X 进托盘）不可用。

## 安装

在 fork 桌面端（需带上述外壳能力）中安装：

```sh
dsh plugin --profile web add "github:xuqingsakura/dsh-workspace#main"
```

> 开发时改 `src/` 后需先 `pnpm run build`，否则 GitHub 安装的版本会落后于源码。

## 文档

- [开发规范摘要](docs/dev-standards.md) — 从 deepseek-harness 官方文档提炼的插件开发规范
- [原型设计](prototype/) — 工作台布局原型（VSCode 样式）

## 功能

- 三栏工作台：文件树 | 阅读/编辑 | 对话（保留原项目对话显示）
- 独立窗口模式：打开时隐藏主窗口，「回到原桌面」恢复主窗口
- 文件树：懒加载、虚拟滚动、根目录/文件夹折叠、按类型彩色图标（VSCode 风格）
- 编辑器：CodeMirror 语法高亮、Markdown 预览、Ctrl+S 保存、圆角独立标签
- 终端：原型风格（提示符高亮、块光标、历史、长命令溢出滚动）
- Git 面板：分支 / 提交历史 / 变更分组（折叠+滚动）/ 提交 / 点击文件看 diff
- 浏览器：本地开发预览（iframe）
- 搜索：会话 cwd 下文件名递归搜索
- 任务/子代理面板、会话切换器、对话区最小化/还原
- 菜单栏：文件（新建/保存/另存为）/ 编辑 / 查看 / 转到 / 终端 / 帮助（自绘关于）
- 活动栏：资源管理器 / 搜索 / Git / 浏览器 / 任务 / 设置 / 回到原桌面

## 状态

v0.1.0（开发中）：fork 桌面端完整可用。详见上方兼容性说明。
