import type { WorkbenchGitBranch, WorkbenchGitChange, WorkbenchGitDiffResult, WorkbenchGitLogEntry, WorkbenchGitStatusResult } from './workbench-types.ts';
/** 解析 `git status --porcelain=v1 -z` 的 NUL 分割字段为有序变更列表。 */
export declare function parsePorcelain(parts: readonly string[]): WorkbenchGitChange[];
/** 解析 `git log --format` 中按单元分隔符(\u001f)切分的记录。 */
export declare function parseLog(records: readonly string[]): WorkbenchGitLogEntry[];
/** 一次 git 调用的完整结果。 */
export interface GitRunResult {
    /** 捕获的 stdout。 */
    stdout: string;
    /** 捕获的 stderr（用于错误提示）。 */
    stderr: string;
    /** 进程退出码。 */
    code: number;
}
/**
 * 在指定工作目录运行一条 git 命令。
 * @param cwd - 仓库工作目录。
 * @param args - git 参数（不含开头的 `git`）。
 * @returns 捕获结果；非零退出不 reject。
 */
export declare function runGit(cwd: string, args: readonly string[]): Promise<GitRunResult>;
/** 判断目录是否位于 git 工作树内。 */
export declare function isGitRepo(cwd: string): Promise<boolean>;
/** 投影一个 git 工作树的状态（是否仓库、当前分支、变更列表）。 */
export declare function gitStatus(cwd: string): Promise<WorkbenchGitStatusResult>;
/** 投影一个路径（或整棵树）的统一 diff。 */
export declare function gitDiff(cwd: string, path: string | undefined, staged: boolean): Promise<WorkbenchGitDiffResult>;
/** 最近的提交历史（最新在前）。 */
export declare function gitLog(cwd: string, limit: number): Promise<WorkbenchGitLogEntry[]>;
/** 本地分支列表，当前检出分支带标记。 */
export declare function gitBranches(cwd: string): Promise<WorkbenchGitBranch[]>;
/** 把一次 git 失败包装为带捕获 stderr 的错误。 */
export declare function gitFailure(operation: string, result: GitRunResult): Error;
/** 暂存指定路径（为空则暂存全部）。 */
export declare function gitAdd(cwd: string, paths: readonly string[] | undefined): Promise<void>;
/** 丢弃工作区改动(staged=false)或撤销暂存(staged=true)。 */
export declare function gitRestore(cwd: string, paths: readonly string[], staged: boolean): Promise<void>;
/** 用一条提交信息提交暂存内容。 */
export declare function gitCommit(cwd: string, message: string): Promise<void>;
/** 检出本地分支。 */
export declare function gitCheckout(cwd: string, branch: string): Promise<void>;
/** 从配置的远端 fetch（不合并）。 */
export declare function gitFetch(cwd: string, remote?: string): Promise<void>;
/** 从上游拉取当前分支。 */
export declare function gitPull(cwd: string): Promise<void>;
/** 推送到上游（或指定远端）。 */
export declare function gitPush(cwd: string, remote?: string, branch?: string): Promise<void>;
declare const _default: {
    parsePorcelain: typeof parsePorcelain;
    parseLog: typeof parseLog;
    runGit: typeof runGit;
    isGitRepo: typeof isGitRepo;
    gitStatus: typeof gitStatus;
    gitDiff: typeof gitDiff;
    gitLog: typeof gitLog;
    gitBranches: typeof gitBranches;
    gitAdd: typeof gitAdd;
    gitRestore: typeof gitRestore;
    gitCommit: typeof gitCommit;
    gitCheckout: typeof gitCheckout;
    gitFetch: typeof gitFetch;
    gitPull: typeof gitPull;
    gitPush: typeof gitPush;
    gitFailure: typeof gitFailure;
};
export default _default;
//# sourceMappingURL=git.d.ts.map