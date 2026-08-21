/**
 * Persistent shell sessions for the workbench terminal UI. Each session is a
 * plain child process over stdio pipes (no PTY), keyed by session scope and a
 * gateway-minted id; output is buffered and consumed incrementally so the UI
 * can poll for deltas. Windows prefers PowerShell 7 (`pwsh`) and falls back
 * to Windows PowerShell (`powershell.exe`); POSIX uses bash and then sh.
 * @module @deepseek-ai/dsh-host-workbench/terminal
 */
import type { WorkbenchTerminalReadResult, WorkbenchTerminalSpawnResult } from './workbench-types.ts';
/**
 * Probe whether a shell candidate resolves on PATH.
 *
 * The probe must be synchronous: spawn() reports ENOENT through the async
 * 'error' event, which a caller checking the return value never sees, so the
 * old pickShell always picked the first candidate even when it was missing.
 * spawnSync() throws ENOENT synchronously, so a missing candidate is
 * detected here and skipped.
 * @param candidate - the shell candidate to probe.
 * @returns true when the probe process starts and exits cleanly.
 */
export declare function probeShell(candidate: {
    file: string;
}): boolean;
/**
 * Pick the first shell candidate present on PATH.
 * @param probe - PATH probe override (test seam); defaults to probeShell.
 * @returns the first candidate whose probe succeeds, or the first candidate
 * when none resolve (the spawn itself then surfaces the failure).
 */
export declare function pickShell(probe?: (candidate: {
    file: string;
}) => boolean): {
    file: string;
    args: readonly string[];
};
/**
 * Session-scoped terminal registry: spawns shells, buffers output, and clears
 * every process when the owning gateway disposes.
 */
export declare class WorkbenchTerminalHost {
    private readonly terminals;
    private readonly counters;
    /**
     * Spawn one persistent shell for a session scope.
     * @param sessionId - the conversation scope owning the terminal.
     * @param cwd - initial working directory; falls back to the session cwd when absent.
     * @returns the minted session and the shell program name.
     */
    spawn(sessionId: string, cwd?: string): WorkbenchTerminalSpawnResult;
    /**
     * Write raw input to one terminal's stdin.
     * @param sessionId - the owning conversation scope.
     * @param id - the terminal id.
     * @param data - bytes to write.
     */
    write(sessionId: string, id: string, data: string): void;
    /**
     * Consume the output produced since the previous read.
     * @param sessionId - the owning conversation scope.
     * @param id - the terminal id.
     * @returns the incremental output plus the session snapshot.
     */
    read(sessionId: string, id: string): WorkbenchTerminalReadResult;
    /**
     * Terminate one terminal and drop its record. Unknown ids are a no-op.
     * @param sessionId - the owning conversation scope.
     * @param id - the terminal id.
     * @returns after the process tree has exited.
     */
    close(sessionId: string, id: string): Promise<void>;
    /**
     * Terminate every terminal owned by one session scope.
     * @param sessionId - the owning conversation scope.
     * @returns after every process tree has exited.
     */
    closeSession(sessionId: string): Promise<void>;
    /**
     * Terminate every terminal across all scopes (gateway disposal).
     * @returns after every process tree has exited.
     */
    dispose(): Promise<void>;
    private expect;
    private killTree;
}
export default WorkbenchTerminalHost;
//# sourceMappingURL=terminal.d.ts.map