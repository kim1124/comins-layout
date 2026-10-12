import type { DashboardGridProps } from "./types";

/** Track consumer-owned Vue inputs without traversing arbitrary widget data.
 * Copies also keep the adapter's previous options stable for runtime diffing.
 */
export function snapshotDashboardGridInputs<TData>(props: DashboardGridProps<TData>) {
  return {
    widgets: props.widgets.map(widget => ({ ...widget, layout: { ...widget.layout } })),
    engineOptions: props.engineOptions ? { ...props.engineOptions } : undefined,
    responsive: props.responsive ? {
      ...props.responsive,
      breakpoints: props.responsive.breakpoints?.map(breakpoint => ({ ...breakpoint })),
    } : undefined,
    externalDropTargets: props.externalDropTargets?.map(target => ({ ...target })),
  };
}
