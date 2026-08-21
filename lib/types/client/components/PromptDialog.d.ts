/**
 * 通用输入对话框（自绘 modal）：用于新建文件/文件夹、另存为等输入名称/路径。
 * @module dsh-workbench-window/client-prompt-dialog
 */
import { type ReactNode } from 'react';
/** 输入对话框 props。 */
export interface PromptDialogProps {
    open: boolean;
    /** 对话框标题。 */
    title: string;
    /** 输入框占位符。 */
    placeholder?: string;
    /** 初始值（如另存为预填当前路径）。 */
    defaultValue?: string;
    /** 确认回调（传入输入值）。 */
    onConfirm(value: string): void;
    /** 取消回调。 */
    onCancel(): void;
}
/**
 * 输入对话框主体。
 * @param props - 开关、标题、占位、初始值、确认/取消回调。
 */
export declare function PromptDialog({ open, title, placeholder, defaultValue, onConfirm, onCancel }: PromptDialogProps): ReactNode;
export default PromptDialog;
//# sourceMappingURL=PromptDialog.d.ts.map