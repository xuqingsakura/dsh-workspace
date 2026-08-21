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
};
/** English copy. */
export declare const en: Record<keyof typeof zh, string>;
/** Locale namespace key. */
export declare const NS: "workbench";
/** The key union (shared by zh/en). */
export type WorkspaceKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map