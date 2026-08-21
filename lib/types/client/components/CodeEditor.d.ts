/** CodeMirror-based code editor for workbench files: syntax highlighting,
 * line numbers, search, history, and optional read-write editing. The theme
 * follows the app's `body[data-ds-dark-theme]` attribute live, so the editor
 * matches the surrounding light/dark palette without a restart. */
/** Full props for the CodeMirror editor. */
export interface CodeEditorProps {
    /** The document text to show. */
    value: string;
    /** Optional language hint from a file path. */
    lang?: string | undefined;
    /** Disable editing when true. */
    readOnly?: boolean | undefined;
    /** Report edited text (read-write mode only). */
    onChange?: ((value: string) => void) | undefined;
}
/**
 * One CodeMirror editor instance. The view is recreated when the document,
 * language, or read-only flag changes; theme switches (light/dark) are applied
 * live through a MutationObserver on the body attribute.
 */
export declare function CodeEditor({ value, lang, readOnly, onChange }: CodeEditorProps): import("react").JSX.Element;
export default CodeEditor;
//# sourceMappingURL=CodeEditor.d.ts.map