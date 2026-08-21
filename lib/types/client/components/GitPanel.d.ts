import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { type SessionScope } from '../api.ts';
import { NS } from '../locales.ts';
/** Git 面板 props。 */
export interface GitPanelProps {
    /** 会话作用域（sessionId + cwd），undefined 时显示空提示。 */
    scope: SessionScope | undefined;
    /** 点击变更文件后打开该文件的 diff（中间列）。 */
    onOpenDiff(path: string, staged: boolean): void;
    /** 语言包。 */
    t: TranslateNS<typeof NS>;
}
/**
 * Git 面板主体。
 * @param props - 会话作用域、打开 diff 回调、语言包。
 */
export declare function GitPanel({ scope, onOpenDiff, t }: GitPanelProps): import("react").JSX.Element;
export default GitPanel;
//# sourceMappingURL=GitPanel.d.ts.map