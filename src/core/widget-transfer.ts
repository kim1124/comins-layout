import {
  insertDashboardWidgetAtLayout,
  removeDashboardWidget,
} from "./layout-state";
import type {
  DashboardWidgetTransferInput,
  DashboardWidgetTransferResult,
} from "./types";

export function transferDashboardWidget<TData>(
  input: DashboardWidgetTransferInput<TData>,
): DashboardWidgetTransferResult<TData> {
  const { source, target, widgetId, targetLayout, targetSnapshot, mode } = input;
  const widget = source.widgets.find((item) => item.id === widgetId);
  if (!widget) {
    return { accepted: false, reason: "missing-widget", source, target };
  }
  if (
    source === target
    || widget.locked
    || widget.movable === false
    || widget.maximized
    || widget.minimized
    || (mode !== "copy" && mode !== "move")
  ) {
    return { accepted: false, reason: "not-transferable", source, target };
  }

  const inserted = insertDashboardWidgetAtLayout(target, widget, targetLayout, targetSnapshot);
  if (!inserted.accepted) {
    return { accepted: false, reason: inserted.reason, source, target };
  }

  return {
    accepted: true,
    source: mode === "move" ? removeDashboardWidget(source, widgetId) : source,
    target: inserted.state,
  };
}
