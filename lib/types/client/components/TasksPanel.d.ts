/**
 * 侧边栏子代理/后台任务面板：展示当前会话的工作目录，并按区域列出
 * "运行中的任务" 与 "子代理"。任务/子代理数据随会话日志逐步接入，
 * 当前提供结构完整的视图与空态。
 * @module dsh-workbench-window/client-tasks-panel
 */
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionScope } from '../api.ts';
import { NS } from '../locales.ts';
/** 任务面板 props。 */
export interface TasksPanelProps {
    /** 会话作用域（sessionId + cwd）。 */
    scope: SessionScope | undefined;
    /** 语言包。 */
    t: TranslateNS<typeof NS>;
}
/**
 * 子代理/后台任务面板主体。
 * @param props - 会话作用域、语言包。
 */
export declare function TasksPanel({ scope }: TasksPanelProps): import("react").JSX.Element;
export default TasksPanel;
//# sourceMappingURL=TasksPanel.d.ts.map