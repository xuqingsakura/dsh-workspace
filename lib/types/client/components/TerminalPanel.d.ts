import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from '../locales.ts';
/** Props for the terminal panel. */
export interface TerminalPanelProps {
    /** The conversation whose cwd the shell starts in. */
    sessionId: string;
    /** Close the whole bottom terminal panel. */
    onClose(): void;
    /** Locale-bound copy. */
    t: TranslateNS<typeof NS>;
}
/** The prototype-style single-terminal panel. */
export declare function TerminalPanel({ sessionId, onClose, t }: TerminalPanelProps): import("react").JSX.Element;
//# sourceMappingURL=TerminalPanel.d.ts.map