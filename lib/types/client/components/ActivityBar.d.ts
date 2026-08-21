/** One activity view key. */
export type ActivityView = 'explorer' | 'search' | 'scm' | 'browser' | 'tasks' | 'settings';
/** Props for the activity bar. */
export interface ActivityBarProps {
    active: ActivityView;
    onSelect(view: ActivityView): void;
}
/** The activity bar component. */
export declare function ActivityBar({ active, onSelect }: ActivityBarProps): import("react").JSX.Element;
//# sourceMappingURL=ActivityBar.d.ts.map