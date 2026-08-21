/**
 * Sidebar-foot launch action: opens the detached workspace window bound to the
 * current session (VSCode-style workbench). Rendered beside Settings in the
 * sidebar foot (the `sidebar.footer.action` seat), so the user always has a
 * one-click entry to the workbench window even before opening a conversation.
 * @module dsh-workbench-window/client-launch
 */
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from '../locales.ts';
/** Full props for the sidebar-foot workbench launch action. */
export type WorkbenchLaunchProps = PropsRuntime<'sidebar.footer.action'> & PropsLocale<typeof NS> & {
    openWorkbench(): void;
};
/**
 * The sidebar-foot button that opens the detached workbench window.
 * @param props - the shell owner share (wide flag), the opener, and locale.
 */
export declare function WorkbenchLaunch({ wide, openWorkbench, t }: WorkbenchLaunchProps): import("react").JSX.Element;
//# sourceMappingURL=WorkbenchLaunch.d.ts.map