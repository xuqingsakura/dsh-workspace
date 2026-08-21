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
import type { WorkbenchTerminalReadResult, WorkbenchTerminalSpawnResult } from '../workbench-types.ts';
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
};
/** Absolute URL of the media route for one path (images only). */
export declare function mediaUrl(scope: SessionScope, path: string): string;
//# sourceMappingURL=api.d.ts.map