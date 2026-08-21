/** File-extension → language metadata shared by the viewer highlight hint and
 * the tab-bar file badge. */
/**
 * Lowercased file-extension to CodeBlock language hint (highlight.ts alias
 * ids) for the read-only viewer.
 */
export declare const LANG_BY_EXTENSION: Readonly<Record<string, string>>;
/**
 * Derive a CodeBlock language hint from a file path's extension; unknown or
 * dotfile extensions yield undefined (plain monospace, still copyable).
 * @param path - the file path relative to the session cwd.
 * @returns the language hint, or undefined when the extension maps to none.
 */
export declare function langFromPath(path: string): string | undefined;
/**
 * Tab-badge metadata for a file path. Unknown or dotfile extensions fall back
 * to a neutral document glyph so every tab still shows a stable badge.
 * @param path - the file path relative to the session cwd.
 * @returns the badge label and accent color.
 */
export declare function fileBadge(path: string): {
    label: string;
    color: string;
};
//# sourceMappingURL=file-lang.d.ts.map