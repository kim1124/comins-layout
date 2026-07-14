import type { GridStackOptions, GridStackWidget } from "gridstack";
import { clampDashboardColumnCount } from "../core/columns";
import type { DashboardInteractionOptions, DashboardWidget } from "../core/types";

export type DashboardGridEngineOptions = DashboardInteractionOptions & {
  columns?: number;
  cellHeight?: GridStackOptions["cellHeight"];
  margin?: GridStackOptions["margin"];
};

export function mapDashboardGridOptions(options: DashboardGridEngineOptions = {}): GridStackOptions {
  const editable = options.editable ?? true;
  const movable = editable && (options.movable ?? true);
  const resizable = editable && (options.resizable ?? true);

  return {
    cellHeight: options.cellHeight ?? 96,
    column: clampDashboardColumnCount(options.columns ?? 12),
    disableDrag: !movable,
    disableResize: !resizable,
    float: false,
    margin: options.margin ?? 8,
    resizable: { handles: "se" },
  };
}

export function mapDashboardWidgetOptions<TData>(
  widget: DashboardWidget<TData>,
  options: DashboardGridEngineOptions,
): Pick<GridStackWidget, "locked" | "noMove" | "noResize"> {
  const editable = options.editable ?? true;
  const gridMovable = editable && (options.movable ?? true);
  const gridResizable = editable && (options.resizable ?? true);
  const widgetMovable = !widget.locked && (widget.movable ?? true);
  const widgetResizable = !widget.locked && (widget.resizable ?? true);

  return {
    locked: widget.locked,
    noMove: !(gridMovable && widgetMovable),
    noResize: !(gridResizable && widgetResizable),
  };
}
