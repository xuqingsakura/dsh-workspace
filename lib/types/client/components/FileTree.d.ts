import { type SessionScope } from '../api.ts';
/** Props for the file tree. */
export interface FileTreeProps {
    /** The active session scope (sessionId + cwd). */
    scope: SessionScope | undefined;
    /** Expanded absolute paths (controlled by the workspace store). */
    expanded: ReadonlySet<string>;
    selected: string | undefined;
    onToggleExpanded(path: string): void;
    onSelect(path: string): void;
    onOpen(path: string): void;
}
/**
 * The file tree component.
 * @param props - session scope, expansion/selection state, and callbacks.
 */
export declare function FileTree({ scope, expanded, selected, onToggleExpanded, onSelect, onOpen }: FileTreeProps): import("react").JSX.Element;
//# sourceMappingURL=FileTree.d.ts.map