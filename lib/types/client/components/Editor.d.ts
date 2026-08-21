import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { type SessionScope } from '../api.ts';
import { NS } from '../locales.ts';
import type { EditorTab } from '../state/workspace-store.ts';
/** Props for the editor column. */
export interface EditorProps {
    scope: SessionScope | undefined;
    tabs: EditorTab[];
    activeTabId: string | undefined;
    onActivate(tabId: string): void;
    onClose(tabId: string): void;
    /** 把当前文件的保存函数注册给上层（菜单栏「保存」触发）。 */
    onRegisterSave?: (fn: (() => Promise<void>) | undefined) => void;
    t: TranslateNS<typeof NS>;
}
/** The editor column component. */
export declare function Editor({ scope, tabs, activeTabId, onActivate, onClose, onRegisterSave, t }: EditorProps): import("react").JSX.Element;
//# sourceMappingURL=Editor.d.ts.map