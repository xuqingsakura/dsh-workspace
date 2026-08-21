/**
 * Structural types for the cordis services this plugin consumes, plus the
 * Context augmentation both halves share. A third-party plugin resolves
 * outside the DSH monorepo's single cordis instance, so the upstream
 * `declare module 'cordis'` augmentations do not reach this Context — and
 * the npm cordis package does not declare the DSH-vendored runtime members
 * (`ctx.effect`, service properties). The members below mirror the actual
 * runtime shapes this plugin touches:
 * - webServer: @deepseek-ai/dsh-host-webserver (the WebServer)
 * - sessions: host side @deepseek-ai/dsh-session (SessionStore), client
 *   side the runtime ISessions list feed
 * - webRuntime: @deepseek-ai/dsh-web-app (bind-derived trusted hosts)
 * - settings: @deepseek-ai/dsh-settings (SettingsProvider)
 * - slots: the client runtime SlotRegistry
 * - effect: the DSH-vendored cordis lifecycle helper
 *
 * This file must stay FREE of Node.js types (`node:http`, `node:stream`,
 * `Buffer`): it is part of the CLIENT-reachable declaration graph, so a Node
 * import here would leak into browser-only consumer builds.
 * @module dsh-workbench-window/context-types
 */
import type { Context } from 'cordis';
/** The request face route handlers see (structural subset of node's IncomingMessage). */
export interface WorkspaceHttpRequest {
    url?: string;
    method?: string;
    headers: Record<string, string | string[] | undefined>;
    [Symbol.asyncIterator](): AsyncIterator<string | Uint8Array>;
}
/** The response face route handlers write to (structural subset of node's ServerResponse). */
export interface WorkspaceHttpResponse {
    statusCode: number;
    writeHead(status: number, headers?: Record<string, string>): void;
    end(body?: string | Uint8Array): void;
}
/** The upgrade socket face (structural subset: the destroy the fences use). */
export interface WorkspaceUpgradeSocket {
    destroy(): void;
}
/** One named webserver route (mirror of the host-webserver WebRoute). */
export interface WorkspaceWebRoute {
    kind: 'exact' | 'prefix';
    path: string;
    handler: (req: WorkspaceHttpRequest, res: WorkspaceHttpResponse) => void | Promise<void>;
}
/** One exact-path HTTP upgrade registration (mirror of WebUpgradeRoute). */
export interface WorkspaceWebUpgradeRoute {
    path: string;
    handler: (req: WorkspaceHttpRequest, socket: WorkspaceUpgradeSocket, head: Uint8Array) => void | Promise<void>;
}
/** The webServer service face this plugin uses. */
export interface WorkspaceWebServer {
    register(route: WorkspaceWebRoute): () => void;
    registerUpgrade(route: WorkspaceWebUpgradeRoute): () => void;
}
/** A published session's header slice the workspace reads (authoritative cwd). */
export interface WorkspaceSessionHeader {
    cwd?: string;
}
/** The host session store face (`ctx.sessions.get(id)` returns the live session). */
export interface WorkspaceSessionStore {
    get(id: string): {
        header: WorkspaceSessionHeader;
    } | undefined;
}
/** The web runtime service face (bind-derived trust list). */
export interface WorkspaceWebRuntime {
    trustedHosts: readonly string[];
}
/** The settings service face (mirror of @deepseek-ai/dsh-settings' SettingsProvider). */
export interface WorkspaceSettingsService {
    register<T>(ns: string, schema: unknown, options?: {
        base?: Partial<T>;
        applies?: 'live' | 'restart';
    }): {
        get(): T;
        watch(callback: (next: T, prev: T) => void | Promise<void>): () => void;
        update(patch: object): Promise<void>;
    };
    describe(options?: {
        redactSecrets?: boolean;
    }): Array<{
        ns: string;
        value?: unknown;
        base?: unknown;
        user?: unknown;
        applies: 'live' | 'restart';
        revision: number;
    }>;
    update(ns: string, patch: object, expectedRevision?: number): Promise<void>;
}
/** The tools service face (mirror of @deepseek-ai/dsh-tools' ToolRuntime). */
export interface WorkspaceToolsService {
    register(tool: unknown): () => void;
}
/** Subscribe to the session append feed (mirror of the cordis event API). */
export interface WorkspaceSessionEvent {
    type: string;
    [key: string]: unknown;
}
declare module 'cordis' {
    interface Context {
        webServer: WorkspaceWebServer;
        sessions: WorkspaceSessionStore;
        webRuntime: WorkspaceWebRuntime;
        settings: WorkspaceSettingsService;
        tools: WorkspaceToolsService;
        slots: unknown;
        /** DSH-vendored lifecycle helper: runs at activation, cleanup at disposal. */
        effect(fn: () => void | (() => void), label?: string): void;
        /** Subscribe to the session append feed (session, event). */
        on(event: string, listener: (session: unknown, event: WorkspaceSessionEvent) => void): () => void;
    }
}
export type { Context };
//# sourceMappingURL=context-types.d.ts.map