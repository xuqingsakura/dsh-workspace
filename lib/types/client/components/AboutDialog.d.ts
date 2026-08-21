/**
 * 关于对话框：自绘 modal（替代原生 alert），展示工作台插件信息与功能。
 * @module dsh-workbench-window/client-about-dialog
 */
import type { ReactNode } from 'react';
/** 关于对话框 props。 */
export interface AboutDialogProps {
    open: boolean;
    onClose(): void;
}
/**
 * 关于对话框主体：遮罩 + 居中卡片。
 * @param props - 开关状态与关闭回调。
 */
export declare function AboutDialog({ open, onClose }: AboutDialogProps): ReactNode;
export default AboutDialog;
//# sourceMappingURL=AboutDialog.d.ts.map