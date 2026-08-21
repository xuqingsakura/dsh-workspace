/**
 * dsh-workbench-window configuration schema. Deployment-varying choices live here
 * (cordis.yml editable) instead of hardcoded constants — the repo convention
 * for plugin tunables. The schema is a plain structural mirror (schemastery
 * is a host dependency; the client never imports it).
 * @module dsh-workbench-window/config
 */
/** One named workspace config section. */
export interface WorkspaceConfig {
    /** Max terminals kept alive per session. */
    terminalsPerSession: number;
    /** Row cap of one directory listing response. */
    listEntryMax: number;
    /** Whether the detached-window entry button is exposed in the session header. */
    detachedWindowEnabled: boolean;
    /** 文件名搜索返回的最大结果数。 */
    searchMax: number;
}
/** Defaults applied when a config section is absent. */
export declare const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfig;
/**
 * Resolve the effective config, merging the provided section over defaults.
 * Unknown keys are dropped so a stale cordis.yml never leaks foreign fields.
 * @param raw - the raw config section (may be undefined).
 * @returns the resolved config.
 */
export declare function resolveWorkspaceConfig(raw: Partial<WorkspaceConfig> | undefined): WorkspaceConfig;
//# sourceMappingURL=config.d.ts.map