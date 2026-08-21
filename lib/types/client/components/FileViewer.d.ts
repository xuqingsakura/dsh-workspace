/** Workbench file editor: Markdown previews stay rendered; every other text
 * file opens in the CodeMirror editor with save (Ctrl+S / button) through the
 * workbench Remote's version-guarded write. */
import type { WorkbenchReadResult, WorkbenchWriteResult } from '../../workbench-types.ts';
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from '../locales.ts';
/** The injected read/write verbs the panel hands down. */
export interface FileViewerInjected {
    /** Read one text file through the workbench window. */
    readText: (sessionId: string, path: string) => Promise<WorkbenchReadResult>;
    /** Write one text file atomically; a stale version token fails loud. */
    writeText: (sessionId: string, path: string, content: string, version: WorkbenchWriteResult['version']) => Promise<WorkbenchWriteResult>;
}
/** Full props for the file viewer. */
export type FileViewerProps = FileViewerInjected & {
    /** The conversation whose cwd the file lives in. */
    sessionId: string;
    /** The file path, relative to the session cwd. */
    path: string;
    /** Locale-bound copy. */
    t: TranslateNS<typeof NS>;
    /** Report dirty-state changes so the panel can guard tab switches. */
    onDirtyChange?: (path: string, dirty: boolean) => void;
    /** 注册当前文件的保存函数（供菜单栏「保存」触发）。 */
    onRegisterSave?: (fn: (() => Promise<void>) | undefined) => void;
};
/**
 * The workbench file editor: loads one file on mount or path change and
 * renders Markdown as a read-only preview or other text in the CodeMirror
 * editor with an explicit save. Tracks a dirty flag; Ctrl+S and the header
 * button both save through the version-guarded write.
 */
export declare function FileViewer({ sessionId, path, readText, writeText, t, onDirtyChange, onRegisterSave }: FileViewerProps): import("react").JSX.Element;
//# sourceMappingURL=FileViewer.d.ts.map