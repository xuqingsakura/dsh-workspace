/** Row bound of one directory listing (protects the wire against huge levels). */
export declare const LIST_ENTRY_MAX = 1000;
/** One projected directory row. */
export interface FsEntry {
    name: string;
    path: string;
    isDir: boolean;
    hidden: boolean;
    /** Whether the row is a symlink; `isDir` then describes the link's target. */
    isSymlink: boolean;
    /** For symlinks: the target is missing or unreadable (stat failed). */
    broken: boolean;
}
/** One directory listing result (may be truncated). */
export interface FsListing {
    entries: FsEntry[];
    truncated: boolean;
}
/** Normalize a path to forward slashes and drop a trailing separator. */
export declare function normalizePath(path: string): string;
/** Parent directory of a path ('/' for a root, null when no parent exists). */
export declare function parentOf(path: string): string | null;
/** Whether `path` is the cwd itself or inside it. */
export declare function isWithin(cwd: string, path: string): boolean;
/** The display label of a cwd path (its basename, or the drive/root fallback). */
export declare function rootLabel(cwd: string): string;
/** Throw a fs-error WorkspaceError for a failed path operation. */
export declare function fsFailure(operation: string, path: string, error: unknown): never;
//# sourceMappingURL=fs-tree.d.ts.map