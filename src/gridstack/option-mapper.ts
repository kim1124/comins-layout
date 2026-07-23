import type { GridStackOptions, GridStackWidget } from "gridstack";
import { clampDashboardColumnCount } from "../core/columns";
import type {
  DashboardGridEngineOptions,
  DashboardInteractionOptions,
  DashboardResponsiveOptions,
  DashboardWidget,
} from "../core/types";

export type { DashboardGridEngineOptions } from "../core/types";

export type DashboardGridOptionInput = DashboardInteractionOptions & {
  columns?: number;
  engineOptions?: DashboardGridEngineOptions;
  responsive?: DashboardResponsiveOptions;
  /** @deprecated Use engineOptions.cellHeight. */
  cellHeight?: GridStackOptions["cellHeight"];
  /** @deprecated Use engineOptions.margin. */
  margin?: GridStackOptions["margin"];
};

function mapResponsiveOptions(responsive: DashboardResponsiveOptions | undefined): GridStackOptions["columnOpts"] {
  if (!responsive) {
    return undefined;
  }

  return {
    columnWidth: responsive.columnWidth,
    columnMax: responsive.columnMax,
    breakpoints: responsive.breakpoints
      ? [...responsive.breakpoints]
          .sort((left, right) => right.maxWidth - left.maxWidth)
          .map((breakpoint) => ({
            w: breakpoint.maxWidth,
            c: breakpoint.columns,
            layout: breakpoint.layout,
          }))
      : undefined,
    breakpointForWindow: responsive.breakpointForWindow,
    layout: responsive.layout,
  };
}

export function mapDashboardGridOptions(options: DashboardGridOptionInput = {}): GridStackOptions {
  const editable = options.editable ?? true;
  const movable = editable && (options.movable ?? true);
  const resizable = editable && (options.resizable ?? true);
  const engine = options.engineOptions ?? {};

  return {
    alwaysShowResizeHandle: engine.alwaysShowResizeHandle,
    animate: engine.animate,
    cellHeight: engine.cellHeight ?? options.cellHeight ?? 96,
    column: clampDashboardColumnCount(options.columns ?? 12),
    columnOpts: mapResponsiveOptions(options.responsive),
    disableDrag: !movable,
    disableResize: !resizable,
    draggable: engine.dragHandle ? { handle: engine.dragHandle } : undefined,
    float: engine.float ?? false,
    margin: engine.margin ?? options.margin ?? 8,
    maxRow: engine.maxRow,
    minRow: engine.minRow,
    nonce: engine.nonce,
    resizable: { handles: engine.resizeHandles ?? "se" },
    rtl: engine.rtl,
    sizeToContent: engine.sizeToContent,
    staticGrid: engine.staticGrid,
  };
}

export function mapDashboardWidgetOptions<TData>(
  widget: DashboardWidget<TData>,
  options: DashboardGridOptionInput,
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
