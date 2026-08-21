/**
 * VSCode-style line SVG icons for the workspace UI. Colors follow the theme
 * tokens (currentColor) plus a per-type accent for file badges.
 * @module dsh-workbench-window/client-icons
 */
import type { ReactNode } from 'react';
/** Folder icon (open or closed). */
export declare function FolderIcon({ open }: {
    open: boolean;
}): ReactNode;
/** File icon by name/extension (VSCode-seti-ish palette). */
export declare function FileIcon({ name }: {
    name: string;
}): ReactNode;
/** Activity-bar icon: explorer (files). */
export declare function ExplorerIcon(): ReactNode;
/** Activity-bar icon: search. */
export declare function SearchIcon(): ReactNode;
/** Activity-bar icon: source control (git branch). */
export declare function ScmIcon(): ReactNode;
/** Activity-bar icon: settings gear. */
export declare function SettingsIcon(): ReactNode;
//# sourceMappingURL=icons.d.ts.map