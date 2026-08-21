import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from '../locales.ts';
/** 会话切换器 props。 */
export interface SessionSwitcherProps {
    /** 会话 id 列表（Host 顺序）。 */
    ids: string[];
    /** 会话摘要映射（id -> 摘要，含 title）。 */
    byId: Record<string, {
        title?: string;
    }>;
    /** 当前会话 id。 */
    current: string | undefined;
    /** 切换当前会话。 */
    onOpen(id: string): void;
    /** 语言包。 */
    t: TranslateNS<typeof NS>;
}
/**
 * 会话切换器主体：当前会话按钮 + 下拉列表。
 * @param props - 会话列表、当前会话、切换回调、语言包。
 */
export declare function SessionSwitcher({ ids, byId, current, onOpen, t }: SessionSwitcherProps): import("react").JSX.Element;
export default SessionSwitcher;
//# sourceMappingURL=SessionSwitcher.d.ts.map