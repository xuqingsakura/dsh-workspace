import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { type SessionScope } from '../api.ts';
import { NS } from '../locales.ts';
/** 状态栏 props。 */
export interface StatusBarProps {
    /** 会话作用域（sessionId + cwd），用于拉取 git 状态。 */
    scope: SessionScope | undefined;
    /** 语言包。 */
    t: TranslateNS<typeof NS>;
}
/**
 * 状态栏组件。
 * @param props - 会话作用域、语言包。
 */
export declare function StatusBar({ scope }: StatusBarProps): import("react").JSX.Element;
export default StatusBar;
//# sourceMappingURL=StatusBar.d.ts.map