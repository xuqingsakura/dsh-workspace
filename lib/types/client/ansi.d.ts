/** Minimal ANSI parser for terminal output rendering: splits text into plain
 * chunks and styled spans (foreground, background, bold, inverse). The shell
 * pipe carries raw escape sequences; parsing here keeps the stored output
 * plain while the view renders it with the theme's terminal palette. SGR
 * codes set the running style; every other CSI sequence is dropped. */
/** One rendered segment: either plain text or a styled run. */
export type AnsiSegment = {
    text: string;
    style?: undefined;
} | {
    text: string;
    style: AnsiStyle;
};
/** Resolved style for one styled run. */
export interface AnsiStyle {
    fg?: string;
    bg?: string;
    bold?: boolean;
    inverse?: boolean;
}
/**
 * Parse text containing escape sequences into renderable segments.
 * @param text - raw terminal output.
 * @returns an ordered list of plain and styled segments.
 */
export declare function parseAnsi(text: string): AnsiSegment[];
//# sourceMappingURL=ansi.d.ts.map