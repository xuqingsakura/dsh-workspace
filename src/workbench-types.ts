/**
 * Wire vocabulary for the workbench window (read/write results, terminal
 * sessions, git projections). Plain JSON across the /workspace API; kept
 * local so the plugin never depends on the fork's api-remotes types.
 * @module dsh-workbench-window/client-types
 */

/** Opaque freshness token minted by the host on read; handed back on save. */
export type WorkbenchVersion = string

/** Outcome of a text read. */
export interface WorkbenchReadResult {
  /** Decoded text; empty for a binary file. */
  content: string
  /** Whether the file exceeded the read window and was truncated. */
  truncated: boolean
  /** Whether the file is binary (NUL-probed) and therefore not text-editable. */
  binary: boolean
  /** Byte size as reported by the filesystem. */
  size: number
  /** Freshness token to hand back to a guarded save. */
  version: WorkbenchVersion
}

/** Outcome of a text write. */
export interface WorkbenchWriteResult {
  /** Freshness token of the file after the write. */
  version: WorkbenchVersion
}

/** One live terminal session (backed by a child shell process over pipes). */
export interface WorkbenchTerminalSession {
  /** Host-minted terminal id, unique within the session scope. */
  id: string
  /** Whether the shell process is still running. */
  status: 'running' | 'exited'
  /** Process exit code once exited; null while running. */
  exitCode: number | null
}

/** Result of one terminal spawn. */
export interface WorkbenchTerminalSpawnResult {
  /** The minted terminal session. */
  session: WorkbenchTerminalSession
  /** The shell program actually launched (for display). */
  shell: string
}

/** Incremental output read from one terminal session. */
export interface WorkbenchTerminalReadResult {
  /** Output produced since the previous read (stdout and stderr merged). */
  delta: string
  /** The session snapshot at read time. */
  session: WorkbenchTerminalSession
}

/** How one working-tree file differs from the index or HEAD. */
export type WorkbenchGitChangeKind = 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked'

/** One changed path in the working tree. */
export interface WorkbenchGitChange {
  /** Path relative to the repository root. */
  path: string
  /** Whether the change is already staged in the index. */
  staged: boolean
  /** How the file differs from the previous tree. */
  kind: WorkbenchGitChangeKind
}

/** The git status projection (VSCode-style). */
export interface WorkbenchGitStatusResult {
  /** Whether the session cwd is inside a git work tree. */
  isRepo: boolean
  /** The current branch name ('' when in detached HEAD). */
  branch: string
  /** Working-tree changes; staged entries sort first. */
  changes: WorkbenchGitChange[]
}

/** One commit from the recent history. */
export interface WorkbenchGitLogEntry {
  /** Full commit hash. */
  hash: string
  /** Abbreviated hash (7 chars). */
  shortHash: string
  /** Author name. */
  author: string
  /** ISO author date. */
  date: string
  /** First subject line. */
  message: string
  /** Parent commit hashes (first parent first; empty for a root commit). */
  parents: string[]
}

/** The unified diff of one path against the index/HEAD. */
export interface WorkbenchGitDiffResult {
  /** Unified diff text (empty for binary content). */
  diff: string
  /** Whether the file was treated as binary and diffed as metadata only. */
  binary: boolean
}

/** One local branch. */
export interface WorkbenchGitBranch {
  /** Branch name. */
  name: string
  /** Whether this is the checked-out branch. */
  current: boolean
}
