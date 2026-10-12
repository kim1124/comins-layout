import { clampDashboardColumnCount } from './columns';
import { createDashboardLayoutState, fitDashboardWidgetToColumns, serializeDashboardLayout } from './layout-state';
import type { DashboardGridEngineOptions, DashboardInteractionOptions, DashboardWidget } from './types';

/** Shared default title action; callbacks still observe the title lifecycle. */
export function titleFillSnapshot<T>(widgets: DashboardWidget<T>[], columns: number, id: string,
  options: DashboardInteractionOptions & { engineOptions?: DashboardGridEngineOptions; titleDoubleClickAction?: 'fill' | 'none' }) {
  const target = widgets.find(widget => widget.id === id);
  if (!target || target.maximized || target.minimized || target.locked
    || target.movable === false || target.resizable === false || options.editable === false
    || options.movable === false || options.resizable === false || options.engineOptions?.staticGrid
    || options.titleDoubleClickAction === 'none') return undefined;
  const state = createDashboardLayoutState({ columns: clampDashboardColumnCount(columns), widgets });
  const next = fitDashboardWidgetToColumns(state, id);
  if (next === state) return undefined;
  // Packing the row must not move a peer whose position is locked.
  if (next.widgets.some((widget, index) => {
    const previous = state.widgets[index]!;
    return (previous.locked || previous.movable === false)
      && (widget.layout.x !== previous.layout.x || widget.layout.y !== previous.layout.y);
  })) return undefined;
  if (next.widgets.every((widget, index) => {
    const previous = state.widgets[index]!.layout;
    return widget.layout.x === previous.x && widget.layout.w === previous.w;
  })) return undefined;
  return serializeDashboardLayout(next);
}
