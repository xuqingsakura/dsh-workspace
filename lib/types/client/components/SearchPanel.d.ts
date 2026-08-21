import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { type SessionScope } from '../api.ts';
import { NS } from '../locales.ts';
/** 搜索面板 props。 */
export interface SearchPanelProps {
    /** 会话作用域（sessionId + cwd）。 */
    scope: SessionScope | undefined;
    /** 点击结果后打开文件（编辑区）。 */
    onOpen(path: string): void;
    /** 语言包。 */
    t: TranslateNS<typeof NS>;
}
/**
 * 搜索面板主体：顶部输入框 + 结果列表。
 * @param props - 会话作用域、打开文件回调、语言包。
 */
export declare function SearchPanel({ scope, onOpen, t }: SearchPanelProps): import("react").JSX.Element;
export default SearchPanel;
//# sourceMappingURL=SearchPanel.d.ts.map