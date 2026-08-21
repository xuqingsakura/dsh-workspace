/**
 * 侧边栏浏览器面板：地址栏 + 导航控制（后退/前进/首页/刷新）包着一个内嵌
 * iframe。纯客户端实现（无 host 依赖）；禁止被 iframe 的站点（X-Frame-Options /
 * CSP frame-ancestors）会显示说明。
 * @module dsh-workbench-window/client-browser-panel
 */
import { type ReactNode } from 'react';
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from '../locales.ts';
/** 浏览器面板 props。 */
export interface BrowserPanelProps {
    /** 语言包。 */
    t: TranslateNS<typeof NS>;
}
/**
 * 把用户输入规范化为可导航 URL：裸域名补 https://。
 * @param raw - 地址栏文本。
 * @returns 规范化后的 URL；不像 URL 的输入原样返回。
 */
export declare function normalizeBrowserUrl(raw: string): string;
/**
 * 侧边栏浏览器主体：地址栏 + iframe，带简单前进/后退历史。
 * @param props - 语言包。
 */
export declare function BrowserPanel({ t }: BrowserPanelProps): ReactNode;
export default BrowserPanel;
//# sourceMappingURL=BrowserPanel.d.ts.map