/**
 * Wire helpers for the /workspace JSON API: bounded body reading, response
 * writing, and the shared error envelope. Every API method returns
 * `{ok: true, value}` on success and `{ok: false, error: {code, message}}`
 * (HTTP 4xx/5xx matching the code) on failure.
 * @module dsh-workbench-window/wire
 */
import type { WorkspaceHttpRequest, WorkspaceHttpResponse } from './context-types.ts';
/** Machine-readable error codes of the workspace API. */
export type WorkspaceErrorCode = 'bad-request' | 'not-found' | 'forbidden' | 'method-error' | 'conflict' | 'fs-error' | 'git-error' | 'pty-error' | 'internal';
/** One API failure with its wire code and HTTP status. */
export declare class WorkspaceError extends Error {
    readonly code: WorkspaceErrorCode;
    readonly status: number;
    constructor(code: WorkspaceErrorCode, message: string, status?: number);
}
/** Success envelope of one API method. */
export interface WorkspaceOk<T> {
    ok: true;
    value: T;
}
/** Failure envelope of one API method. */
export interface WorkspaceErr {
    ok: false;
    error: {
        code: WorkspaceErrorCode;
        message: string;
    };
}
/** Read and parse the JSON request body (bounded; malformed → bad-request). */
export declare function readJsonBody(req: WorkspaceHttpRequest): Promise<unknown>;
/** Write a JSON response with the given status. */
export declare function writeJson(res: WorkspaceHttpResponse, status: number, body: unknown): void;
/** Write the success envelope. */
export declare function writeOk(res: WorkspaceHttpResponse, value: unknown): void;
/** Write the failure envelope for any thrown value (unknown → internal 500). */
export declare function writeError(res: WorkspaceHttpResponse, error: unknown): void;
/** Narrow an unknown payload value to a string, else throw bad-request. */
export declare function requireString(payload: unknown, key: string): string;
//# sourceMappingURL=wire.d.ts.map