/**
 * dsh-workbench-window companion module: the single repository-wide invariant
 * surface. Kept separate from index.ts so the pure invariant helpers stay
 * importable without pulling the whole plugin graph.
 * @module dsh-workbench-window/invariant
 */
/** One assertion failure in this plugin. */
export declare class WorkspaceInvariantError extends Error {
    constructor(message: string);
}
/**
 * Assert a condition, failing loud when it does not hold.
 * @param condition - the invariant to check.
 * @param message - the failure reason.
 * @returns the asserted value (narrowed to `true`).
 */
export declare function invariant(condition: unknown, message: string): asserts condition;
/**
 * Narrow an unknown value to a non-empty string (host route payload guard).
 * @param value - the untrusted value.
 * @param label - the field name for the error message.
 * @returns the narrowed string.
 */
export declare function requireNonEmptyString(value: unknown, label: string): string;
//# sourceMappingURL=invariant.d.ts.map