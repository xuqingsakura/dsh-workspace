import { type SessionScope } from '../api.ts';
/** 文件树 props。 */
export interface FileTreeProps {
    /** 当前会话作用域（sessionId + cwd）。 */
    scope: SessionScope | undefined;
    /** 展开的绝对路径（由 workspace store 控制）。 */
    expanded: ReadonlySet<string>;
    selected: string | undefined;
    onToggleExpanded(path: string): void;
    onSelect(path: string): void;
    onOpen(path: string): void;
}
/**
 * 文件树组件。
 * @param props - 会话作用域、展开/选择状态、回调。
 */
export declare function FileTree({ scope, expanded, selected, onToggleExpanded, onSelect, onOpen }: FileTreeProps): import("react").JSX.Element;
//# sourceMappingURL=FileTree.d.ts.map