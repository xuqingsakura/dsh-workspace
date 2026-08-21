//#region src/invariant.ts
/**
* dsh-workbench-window companion module: the single repository-wide invariant
* surface. Kept separate from index.ts so the pure invariant helpers stay
* importable without pulling the whole plugin graph.
* @module dsh-workbench-window/invariant
*/
/** One assertion failure in this plugin. */
var WorkspaceInvariantError = class extends Error {
	constructor(message) {
		super(`dsh-workbench-window invariant: ${message}`);
		this.name = "WorkspaceInvariantError";
	}
};
/**
* Assert a condition, failing loud when it does not hold.
* @param condition - the invariant to check.
* @param message - the failure reason.
* @returns the asserted value (narrowed to `true`).
*/
function invariant(condition, message) {
	if (!condition) throw new WorkspaceInvariantError(message);
}
/**
* Narrow an unknown value to a non-empty string (host route payload guard).
* @param value - the untrusted value.
* @param label - the field name for the error message.
* @returns the narrowed string.
*/
function requireNonEmptyString(value, label) {
	if (typeof value !== "string" || value.trim() === "") throw new WorkspaceInvariantError(`${label} must be a non-empty string`);
	return value;
}
//#endregion
export { WorkspaceInvariantError, invariant, requireNonEmptyString };
