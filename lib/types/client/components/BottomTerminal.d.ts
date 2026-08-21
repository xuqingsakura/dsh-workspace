/**
 * Bottom terminal: the VSCode-style terminal strip at the window bottom.
 * Renders the prototype-style terminal panel (one persistent shell per
 * session with prompt, input, clear, and close). Without a bound session it
 * shows a quiet hint with the close affordance.
 * @module dsh-workbench-window/client-terminal
 */
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from '../locales.ts';
/** Props for the bottom terminal. */
export interface BottomTerminalProps {
    open: boolean;
    onClose(): void;
    /** The bound session; undefined shows a hint instead of spawning shells. */
    sessionId: string | undefined;
    t: TranslateNS<typeof NS>;
}
/** The bottom terminal strip. */
export declare function BottomTerminal({ open, onClose, sessionId, t }: BottomTerminalProps): import("react").JSX.Element | null;
//# sourceMappingURL=BottomTerminal.d.ts.map