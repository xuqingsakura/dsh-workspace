/**
 * Locale dictionaries for the workspace plugin (zh/en). Registered into the
 * shared locale registry under the 'workbench' namespace on activation.
 * @module dsh-workbench-window/client-locales
 */
/** Chinese copy. */
export declare const zh: {
    readonly 'actions.workbench': "工作台";
    readonly 'viewer.empty': "从文件树打开文件";
    readonly 'viewer.loading': "加载中…";
    readonly 'viewer.binary': "二进制文件，暂不支持预览";
    readonly 'viewer.truncated': "文件较大，仅显示前一部分";
    readonly 'viewer.openError': "无法打开文件";
    readonly 'viewer.title': "{path}";
    readonly 'tab.close': "关闭";
    readonly copy: "复制";
    readonly copied: "已复制";
    readonly 'tree.loading': "加载中…";
    readonly 'editor.save': "保存";
    readonly 'editor.saving': "保存中…";
    readonly 'editor.saved': "已保存";
    readonly 'editor.saveError': "保存失败";
    readonly 'editor.dirty': "有未保存的更改";
    readonly 'terminal.title': "终端";
    readonly 'terminal.running': "运行中";
    readonly 'terminal.exited': "已退出";
    readonly 'terminal.close': "关闭";
    readonly 'terminal.placeholder': "输入命令，回车执行";
    readonly 'terminal.inputAria': "终端命令输入";
    readonly 'terminal.new': "新建终端";
    readonly 'terminal.clear': "清屏";
    readonly 'terminal.closePanel': "关闭终端面板";
    readonly 'browser.back': "后退";
    readonly 'browser.forward': "前进";
    readonly 'browser.home': "首页";
    readonly 'browser.reload': "刷新";
    readonly 'browser.addressPlaceholder': "输入网址";
    readonly 'browser.addressAria': "浏览器地址栏";
    readonly 'browser.go': "前往";
    readonly 'browser.blank': "输入网址开始浏览";
    readonly 'browser.title': "内嵌浏览器";
    readonly 'git.title': "源代码管理";
    readonly 'git.branch': "分支";
    readonly 'git.history': "提交历史";
    readonly 'git.staged': "已暂存";
    readonly 'git.unstaged': "更改";
    readonly 'git.untracked': "未跟踪";
    readonly 'git.clean': "工作区干净";
    readonly 'git.noRepo': "当前目录不是 Git 仓库";
    readonly 'git.noCommits': "暂无提交";
    readonly 'git.commit': "提交";
    readonly 'git.commitPlaceholder': "提交信息";
    readonly 'git.commitHint': "Ctrl+Enter 提交";
    readonly 'git.stage': "暂存";
    readonly 'git.unstage': "撤销暂存";
    readonly 'git.discard': "丢弃";
    readonly 'git.discardConfirm': "确定丢弃 {count} 个文件？";
    readonly 'git.stageAll': "暂存全部";
    readonly 'git.discardAll': "丢弃全部更改";
    readonly 'git.fetch': "拉取";
    readonly 'git.pull': "同步";
    readonly 'git.push': "推送";
    readonly 'git.more': "更多操作";
    readonly 'git.refresh': "刷新";
    readonly 'git.refreshing': "刷新中…";
    readonly 'git.merge': "合并";
    readonly 'git.binaryDiff': "二进制文件差异";
    readonly 'git.emptyDiff': "（无差异）";
    readonly 'git.openDiffInViewer': "在编辑区查看差异";
    readonly 'git.unknown': "未知";
    readonly 'git.branchAria': "选择分支";
    readonly 'git.loading': "加载中…";
};
/** English copy. */
export declare const en: Record<keyof typeof zh, string>;
/** Locale namespace key. */
export declare const NS: "workbench";
/** The key union (shared by zh/en). */
export type WorkspaceKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map