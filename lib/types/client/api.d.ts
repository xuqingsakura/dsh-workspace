/**
 * Typed fetch wrapper over the /workspace JSON API. Every call posts to
 * `/workspace/api` with the sessionId. Failures surface as
 * {@link WorkspaceApiError} with the wire code.
 * @module dsh-workbench-window/client-api
 */
/** One wire failure. */
export declare class WorkspaceApiError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
import type { WorkbenchGitBranch, WorkbenchGitDiffResult, WorkbenchGitLogEntry, WorkbenchGitStatusResult, WorkbenchSearchResult, WorkbenchTerminalReadResult, WorkbenchTerminalSpawnResult } from '../workbench-types.ts';
/** One directory entry (host fs-tree shape). */
export interface FsEntry {
    name: string;
    path: string;
    isDir: boolean;
    hidden: boolean;
    isSymlink: boolean;
    broken: boolean;
}
/** One directory listing result. */
export interface FsListing {
    entries: FsEntry[];
    truncated: boolean;
}
/** The session scope threaded through every call. */
export interface SessionScope {
    sessionId: string;
    cwd?: string;
}
/** The workspace API surface (session scope threaded through every call). */
export declare const api: {
    sessionCwd: (scope: SessionScope, signal?: AbortSignal) => Promise<{
        sessionId: string;
        cwd: string;
        root: string;
    }>;
    fsList: (scope: SessionScope, path: string, signal?: AbortSignal) => Promise<FsListing>;
    fsRead: (scope: SessionScope, path: string, signal?: AbortSignal) => Promise<{
        path: string;
        content: string;
        binary: boolean;
        truncated: boolean;
        size: number;
        version: string;
    }>;
    fsWrite: (scope: SessionScope, path: string, content: string, version?: string) => Promise<{
        ok: true;
        version?: string;
    }>;
    fsMkdir: (scope: SessionScope, path: string) => Promise<{
        ok: true;
    }>;
    fsRename: (scope: SessionScope, path: string, nextPath: string) => Promise<{
        ok: true;
    }>;
    fsRemove: (scope: SessionScope, path: string, recursive: boolean) => Promise<{
        ok: true;
    }>;
    fsSearch: (scope: SessionScope, query: string, signal?: AbortSignal) => Promise<{
        results: WorkbenchSearchResult[];
    }>;
    terminalSpawn: (scope: SessionScope, cwd?: string) => Promise<WorkbenchTerminalSpawnResult>;
    terminalWrite: (scope: SessionScope, id: string, data: string) => Promise<{
        ok: true;
    }>;
    terminalRead: (scope: SessionScope, id: string) => Promise<WorkbenchTerminalReadResult>;
    terminalClose: (scope: SessionScope, id: string) => Promise<{
        ok: true;
    }>;
    terminalCloseSession: (scope: SessionScope) => Promise<{
        ok: true;
    }>;
    gitStatus: (scope: SessionScope, signal?: AbortSignal) => Promise<WorkbenchGitStatusResult>;
    gitDiff: (scope: SessionScope, path: string | undefined, staged: boolean, signal?: AbortSignal) => Promise<WorkbenchGitDiffResult>;
    gitLog: (scope: SessionScope, limit: number, signal?: AbortSignal) => Promise<WorkbenchGitLogEntry[]>;
    gitBranches: (scope: SessionScope, signal?: AbortSignal) => Promise<WorkbenchGitBranch[]>;
    gitAdd: (scope: SessionScope, paths: string[] | undefined, signal?: AbortSignal) => Promise<{
        ok: true;
    }>;
    gitRestore: (scope: SessionScope, paths: string[], staged: boolean, signal?: AbortSignal) => Promise<{
        ok: true;
    }>;
    gitCommit: (scope: SessionScope, message: string, signal?: AbortSignal) => Promise<{
        ok: true;
    }>;
    gitCheckout: (scope: SessionScope, branch: string, signal?: AbortSignal) => Promise<{
        ok: true;
    }>;
    gitFetch: (scope: SessionScope, remote: string | undefined, signal?: AbortSignal) => Promise<{
        ok: true;
    }>;
    gitPull: (scope: SessionScope, signal?: AbortSignal) => Promise<{
        ok: true;
    }>;
    gitPush: (scope: SessionScope, remote: string | undefined, branch: string | undefined, signal?: AbortSignal) => Promise<{
        ok: true;
    }>;
};
/** Absolute URL of the media route for one path (images only). */
export declare function mediaUrl(scope: SessionScope, path: string): string;
//# sourceMappingURL=api.d.ts.map