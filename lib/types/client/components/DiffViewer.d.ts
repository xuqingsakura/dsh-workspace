import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { type SessionScope } from '../api.ts';
import { NS } from '../locales.ts';
/** Diff 视图的 props。 */
export interface DiffViewerProps {
    /** 会话作用域（sessionId + cwd）。 */
    scope: SessionScope;
    /** 变更文件路径（相对会话 cwd）。 */
    path: string;
    /** true=对比暂存区(index)，false=对比工作区。 */
    staged: boolean;
    /** 关闭 diff 并返回文件内容视图。 */
    onClose(): void;
    /** 语言包。 */
    t: TranslateNS<typeof NS>;
}
/**
 * 中间列 diff 查看器：挂载时加载选中变更的 diff 并高亮渲染，
 * 顶部显示路径与关闭按钮。
 * @param props - 会话作用域、变更路径、是否暂存、关闭回调、语言包。
 */
export declare function DiffViewer({ scope, path, staged, onClose, t }: DiffViewerProps): import("react").JSX.Element;
export default DiffViewer;
//# sourceMappingURL=DiffViewer.d.ts.map