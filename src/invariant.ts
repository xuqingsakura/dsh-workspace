/**
 * dsh-workbench-window companion module: the single repository-wide invariant
 * surface. Kept separate from index.ts so the pure invariant helpers stay
 * importable without pulling the whole plugin graph.
 * @module dsh-workbench-window/invariant
 */

/** One assertion failure in this plugin. */
export class WorkspaceInvariantError extends Error {
  constructor(message: string) {
    super(`dsh-workbench-window invariant: ${message}`)
    this.name = 'WorkspaceInvariantError'
  }
}

/**
 * Assert a condition, failing loud when it does not hold.
 * @param condition - the invariant to check.
 * @param message - the failure reason.
 * @returns the asserted value (narrowed to `true`).
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new WorkspaceInvariantError(message)
}

/**
 * Narrow an unknown value to a non-empty string (host route payload guard).
 * @param value - the untrusted value.
 * @param label - the field name for the error message.
 * @returns the narrowed string.
 */
export function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new WorkspaceInvariantError(`${label} must be a non-empty string`)
  }
  return value
}
