import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { ForwardedRef, ReactElement, ReactNode, RefAttributes } from "react";
import { clampDashboardColumnCount } from "../core/columns";
import { validateDashboardGridConfiguration } from "../core/configuration";
import { createDashboardResizeScheduler } from "../browser/resize-scheduler";
import type {
  DashboardColumnCount,
  DashboardExternalDropTarget,
  DashboardGridEngineOptions,
  DashboardInteractionOptions,
  DashboardLayoutSnapshot,
  DashboardResponsiveOptions,
  DashboardWidget as DashboardWidgetModel,
  DashboardWidgetExternalDropEvent,
  DashboardWidgetDropCandidate,
  DashboardWidgetDropRequest,
  DashboardWidgetInteractionEvent,
  DashboardWidgetResizeFrameEvent,
  DashboardWidgetTransferMode,
} from "../core/types";
import type { DashboardGridHandle } from "../gridstack/adapter";
import { validateDashboardExternalDropTargetSelectors } from "../gridstack/external-drop-target";
import { createDashboardGridConnection } from "../browser/grid-connection";
import { titleFillSnapshot } from "../core/widget-presentation";
import { observeDashboardContent } from "../browser/lazy-content";
import { isDashboardContentPositioned } from "../gridstack/element-state";
import { DashboardWidgetShell } from "./DashboardWidget";
import type { DashboardWidgetActionLabels } from "./DashboardWidget";

export type { DashboardGridHandle } from "../gridstack/adapter";

export type DashboardGridProps<TData = unknown> = DashboardInteractionOptions & {
  widgets: DashboardWidgetModel<TData>[];
  columns?: DashboardColumnCount;
  engineOptions?: DashboardGridEngineOptions;
  responsive?: DashboardResponsiveOptions;
  externalDropTargets?: ReadonlyArray<DashboardExternalDropTarget>;
  gridId?: string;
  acceptExternalWidgets?: boolean | ((candidate: DashboardWidgetDropCandidate<TData>) => boolean);
  gridTransferMode?: DashboardWidgetTransferMode;
  className?: string;
  refreshKey?: number;
  showControls?: boolean;
  /** Default title double-click fills the current row's unused columns. */
  titleDoubleClickAction?: 'fill' | 'none';
  lazyRenderWidget?: boolean;
  actionLabels?: Partial<DashboardWidgetActionLabels>;
  renderWidget: (widget: DashboardWidgetModel<TData>) => ReactNode;
  renderWidgetActions?: (widget: DashboardWidgetModel<TData>) => ReactNode;
  onColumnsChange?: (columns: DashboardColumnCount) => void;
  onLayoutCommit?: (snapshot: DashboardLayoutSnapshot) => void;
  onWidgetLayoutChange?: (id: string, layout: DashboardWidgetModel<TData>["layout"]) => void;
  onWidgetResizeFrame?: (event: DashboardWidgetResizeFrameEvent) => void;
  onWidgetExternalDrop?: (event: DashboardWidgetExternalDropEvent) => void;
  onWidgetDropRequest?: (request: DashboardWidgetDropRequest<TData>) => void;
  /** @deprecated Use onBeforeMove. Retained in 0.3.0; removal is deferred to a future version. */
  onWidgetDragStart?: (event: DashboardWidgetInteractionEvent) => void;
  /** @deprecated Use onAfterMove. Retained in 0.3.0; removal is deferred to a future version. */
  onWidgetDragStop?: (event: DashboardWidgetInteractionEvent) => void;
  /** @deprecated Use onBeforeResize. Retained in 0.3.0; removal is deferred to a future version. */
  onWidgetResizeStart?: (event: DashboardWidgetInteractionEvent) => void;
  /** @deprecated Use onAfterResize. Retained in 0.3.0; removal is deferred to a future version. */
  onWidgetResizeStop?: (event: DashboardWidgetInteractionEvent) => void;
  onBeforeMove?: (event: DashboardWidgetInteractionEvent) => void;
  onMove?: (event: DashboardWidgetInteractionEvent) => void;
  onAfterMove?: (event: DashboardWidgetInteractionEvent) => void;
  onBeforeResize?: (event: DashboardWidgetInteractionEvent) => void;
  onResize?: (event: DashboardWidgetInteractionEvent) => void;
  onAfterResize?: (event: DashboardWidgetInteractionEvent) => void;
  onBeforeTitleDoubleClick?: (event: DashboardWidgetInteractionEvent) => void;
  onTitleDoubleClick?: (event: DashboardWidgetInteractionEvent) => void;
  onAfterTitleDoubleClick?: (event: DashboardWidgetInteractionEvent) => void;
  /** @deprecated Supply a custom action using resizeWidget. */
  onMaximizeWidget?: (id: string) => void;
  /** @deprecated Supply a custom action using resizeWidget. */
  onMinimizeWidget?: (id: string) => void;
  onRestoreWidget?: (id: string) => void;
  onRemoveWidget?: (id: string) => void;
  /**
   * @deprecated This is a title-only legacy alias. Use onTitleDoubleClick.
   * Retained in 0.3.0; removal is deferred to a future version.
   */
  onWidgetHeaderDoubleClick?: (id: string) => void;
};

function DashboardGridInner<TData = unknown>(
  props: DashboardGridProps<TData>,
  ref: ForwardedRef<DashboardGridHandle>,
): ReactElement {
  const {
    widgets,
    columns = 12,
    engineOptions,
    responsive,
    externalDropTargets,
    gridId,
    acceptExternalWidgets = false,
    gridTransferMode,
    editable = true,
    movable = true,
    resizable = true,
    className,
    refreshKey,
    showControls = true,
    lazyRenderWidget = false,
    actionLabels,
    renderWidget,
    renderWidgetActions,
    onColumnsChange,
    onLayoutCommit,
    onWidgetLayoutChange,
    onWidgetResizeFrame,
    onWidgetExternalDrop,
    onWidgetDropRequest,
    onWidgetDragStart,
    onWidgetDragStop,
    onWidgetResizeStart,
    onWidgetResizeStop,
    onBeforeMove,
    onMove,
    onAfterMove,
    onBeforeResize,
    onResize,
    onAfterResize,
    onBeforeTitleDoubleClick,
    onTitleDoubleClick,
    onAfterTitleDoubleClick,
    onRestoreWidget,
    onRemoveWidget,
    onWidgetHeaderDoubleClick,
  } = props;
  validateDashboardGridConfiguration({
    engineOptions,
    responsive,
    externalDropTargets,
    gridId,
    acceptExternalWidgets,
    gridTransferMode,
  });
  if (typeof document !== "undefined") {
    validateDashboardExternalDropTargetSelectors(document, externalDropTargets);
  }
  const gridElementRef = useRef<HTMLDivElement>(null);
  const connection = useMemo(() => createDashboardGridConnection<TData>(), []);
  const [activeColumns, setActiveColumns] = useState(() => clampDashboardColumnCount(columns));
  const handleTitleDoubleClick = (event: DashboardWidgetInteractionEvent) => {
    const snapshot = titleFillSnapshot(widgets, activeColumns, event.id, props);
    if (snapshot) {
      snapshot.widgets.forEach(layout => onWidgetLayoutChange?.(layout.id, layout));
      onLayoutCommit?.(snapshot);
    }
    onTitleDoubleClick?.(event);
  };
  const handleColumnsChange = useCallback((nextColumns: DashboardColumnCount) => {
    setActiveColumns(nextColumns);
    onColumnsChange?.(nextColumns);
  }, [onColumnsChange]);
  const handleLayoutCommit = useCallback((snapshot: DashboardLayoutSnapshot) => {
    const controlledColumns = clampDashboardColumnCount(columns);
    if (!responsive && snapshot.columns !== controlledColumns) {
      return;
    }
    onLayoutCommit?.(snapshot);
  }, [columns, onLayoutCommit, responsive]);
  useImperativeHandle(
    ref,
    () => ({
      getGridStack: () => connection.getAdapter()?.grid ?? null,
      getColumnCount: () => connection.getAdapter()?.grid.getColumn() ?? null,
      getRowCount: () => connection.getAdapter()?.grid.getRow() ?? null,
      getFloat: () => connection.getAdapter()?.grid.getFloat() ?? null,
      isAreaEmpty: (layout) => connection.getAdapter()?.grid.isAreaEmpty(layout.x, layout.y, layout.w, layout.h) ?? null,
      willItFit: (layout) => connection.getAdapter()?.grid.willItFit(layout) ?? null,
      refresh: () => connection.getAdapter()?.refresh(),
      compact: (layout, doSort) => connection.getAdapter()?.compact(layout, doSort) ?? null,
      commitLayout: () => connection.getAdapter()?.commit() ?? null,
    }),
    [],
  );
  const resizeFrameHandlerRef = useRef(onWidgetResizeFrame);
  const resizeScheduler = useMemo(
    () =>
      createDashboardResizeScheduler((event) => {
        resizeFrameHandlerRef.current?.(event);
      }),
    [],
  );

  useEffect(() => {
    resizeFrameHandlerRef.current = onWidgetResizeFrame;
  }, [onWidgetResizeFrame]);

  useEffect(() => {
    if (!responsive) {
      setActiveColumns(clampDashboardColumnCount(columns));
    }
  }, [columns, responsive]);

  const adapterOptions = useMemo(
    () => ({
      columns,
      engineOptions,
      responsive,
      editable,
      movable,
      resizable,
      widgets,
      externalDropTargets,
      gridId,
      acceptExternalWidgets,
      gridTransferMode,
      onColumnsChange: handleColumnsChange,
      onLayoutCommit: handleLayoutCommit,
      onWidgetLayoutChange,
      onWidgetExternalDrop,
      onWidgetDropRequest,
      onWidgetDragStart,
      onWidgetDragStop,
      onWidgetResizeStart,
      onWidgetResizeStop,
      onBeforeMove,
      onMove,
      onAfterMove,
      onBeforeResize,
      onResize,
      onAfterResize,
      onWidgetResize: (id: string, size: { width: number; height: number }) => {
        resizeScheduler.schedule({ id, width: size.width, height: size.height });
      },
    }),
    [
      columns,
      editable,
      engineOptions,
      externalDropTargets,
      gridId,
      acceptExternalWidgets,
      gridTransferMode,
      handleColumnsChange,
      handleLayoutCommit,
      movable,
      onWidgetExternalDrop,
      onWidgetDropRequest,
      onWidgetDragStart,
      onWidgetDragStop,
      onWidgetLayoutChange,
      onWidgetResizeStart,
      onWidgetResizeStop,
      onBeforeMove,
      onMove,
      onAfterMove,
      onBeforeResize,
      onResize,
      onAfterResize,
      responsive,
      resizable,
      resizeScheduler,
      widgets,
    ],
  );
  const adapterReinitializeKey = useMemo(
    () => JSON.stringify([engineOptions?.rtl ?? null, engineOptions?.sizeToContent ?? null]),
    [engineOptions?.rtl, engineOptions?.sizeToContent],
  );

  useEffect(() => {
    const gridElement = gridElementRef.current;
    if (!gridElement) {
      return;
    }

    connection.connect(gridElement, adapterOptions);
    return () => {
      resizeScheduler.cancel();
      connection.disconnect();
    };
  }, [adapterReinitializeKey, connection, resizeScheduler]);

  useEffect(() => {
    connection.sync(adapterOptions);
  }, [adapterOptions, connection]);

  useEffect(() => {
    if (refreshKey !== undefined) {
      connection.getAdapter()?.refresh();
    }
  }, [refreshKey]);

  return (
    <section
      ref={gridElementRef}
      className={["grid-stack", "comins-grid-layout", className].filter(Boolean).join(" ")}
      data-columns={activeColumns}
      data-grid-id={gridId?.trim() || undefined}
      data-testid="dashboard-grid"
    >
      {widgets.map((widget) => (
        <article
          className="grid-stack-item"
          data-layout-h={widget.layout.h}
          data-layout-w={widget.layout.w}
          data-layout-x={widget.layout.x}
          data-layout-y={widget.layout.y}
          data-testid={`dashboard-widget-${widget.id}`}
          data-widget-id={widget.id}
          data-title-interactive={editable && !engineOptions?.staticGrid && !widget.locked
            && ((movable && widget.movable !== false) || (resizable && widget.resizable !== false))}
          data-maximized={String(widget.maximized ?? false)}
          data-minimized={String(widget.minimized ?? false)}
          gs-h={String(widget.layout.h)}
          gs-id={widget.id}
          gs-w={String(widget.layout.w)}
          gs-x={String(widget.layout.x)}
          gs-y={String(widget.layout.y)}
          key={widget.id}
        >
          <div className="grid-stack-item-content">
            <DashboardWidgetShell
              widget={widget}
              labels={{
                maximize: actionLabels?.maximize ?? "최대화",
                minimize: actionLabels?.minimize ?? "최소화",                restore: actionLabels?.restore ?? "복원",
                remove: actionLabels?.remove ?? "삭제",
              }}
              showControls={showControls}
              onRestore={onRestoreWidget}
              onRemove={onRemoveWidget}
              onHeaderDoubleClick={onWidgetHeaderDoubleClick}
              onBeforeTitleDoubleClick={onBeforeTitleDoubleClick}
              onTitleDoubleClick={handleTitleDoubleClick}
              onAfterTitleDoubleClick={onAfterTitleDoubleClick}
              renderActions={renderWidgetActions}
            >
              <DashboardWidgetContent
                enabled={lazyRenderWidget && (widget.lazyLoad ?? true)}
                renderWidget={renderWidget}
                widget={widget}
              />
            </DashboardWidgetShell>
          </div>
        </article>
      ))}
    </section>
  );
}

const ForwardedDashboardGrid = forwardRef(DashboardGridInner);
ForwardedDashboardGrid.displayName = "DashboardGrid";

export const DashboardGrid = ForwardedDashboardGrid as <TData = unknown>(
  props: DashboardGridProps<TData> & RefAttributes<DashboardGridHandle>,
) => ReactElement | null;

function DashboardWidgetContent<TData>({
  enabled,
  renderWidget,
  widget,
}: {
  enabled: boolean;
  renderWidget: (widget: DashboardWidgetModel<TData>) => ReactNode;
  widget: DashboardWidgetModel<TData>;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!enabled);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    return observeDashboardContent(element, {
      enabled,
      isPositioned: () => isDashboardContentPositioned(element),
      onVisible: () => setVisible(true),
    });
  }, [enabled]);

  return (
    <div
      ref={contentRef}
      className="comins-grid-layout-widget__render-boundary"
      data-lazy-rendered={String(visible)}
    >
      {visible ? renderWidget(widget) : null}
    </div>
  );
}
